"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Inbox,
  Bell,
  MessageSquare,
  Trash2,
  Check,
  CheckCheck,
  Send,
  ArrowLeft,
  Loader2,
  FolderKanban,
  Wifi,
  WifiOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TypingIndicator } from "@/components/ui/typing-indicator";
import { OnlineStatus, OnlineStatusBadge } from "@/components/ui/online-status";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeChat } from "@/lib/hooks/use-realtime-chat";
import { usePresenceContext } from "@/components/providers/presence-provider";
import { getInitials } from "@/lib/format";
import {
  subscribeToNotifications,
  subscribeToConversations,
  unsubscribeChannel,
  requestNotificationPermission,
  showBrowserNotification,
} from "@/lib/supabase/realtime";
import { useInboxData, useConversationMessages } from "@/lib/hooks/use-inbox";
import type { Conversation, Message } from "@/lib/hooks/use-inbox";

type Tab = "notifications" | "messages";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "application_received":
    case "application_accepted":
    case "application_rejected":
      return <FolderKanban className="h-4 w-4" />;
    case "new_message":
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

function InboxPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationParam = searchParams.get("conversation");
  const { isUserOnline } = usePresenceContext();

  // SWR hooks for data fetching
  const {
    notifications,
    conversations,
    currentUserId,
    isLoading,
    mutate: mutateInbox,
  } = useInboxData();

  const [activeTab, setActiveTab] = useState<Tab>(
    conversationParam ? "messages" : "notifications",
  );
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // SWR hook for messages
  const { messages: fetchedMessages, mutate: mutateMessages } =
    useConversationMessages(selectedConversation?.id ?? null, currentUserId);

  // Sync fetched messages to local state (allows optimistic updates from realtime)
  useEffect(() => {
    setLocalMessages(fetchedMessages);
  }, [fetchedMessages]);

  // Select conversation from URL param once data loads
  useEffect(() => {
    if (
      conversationParam &&
      conversations.length > 0 &&
      !selectedConversation
    ) {
      const conv = conversations.find((c) => c.id === conversationParam);
      if (conv) {
        setSelectedConversation(conv);
        setActiveTab("messages");
      }
    }
  }, [conversationParam, conversations, selectedConversation]);

  // Real-time chat hook
  const handleNewMessage = useCallback((message: Message) => {
    setLocalMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  const { typingUsers, setIsTyping, isConnected } = useRealtimeChat({
    conversationId: selectedConversation?.id || null,
    currentUserId,
    onNewMessage: handleNewMessage,
  });

  const otherUserName =
    selectedConversation?.other_user?.full_name || "Someone";

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  // Real-time subscriptions — revalidate SWR cache on changes
  useEffect(() => {
    if (!currentUserId) return;

    requestNotificationPermission();

    const notificationChannel = subscribeToNotifications(
      currentUserId,
      (notification) => {
        mutateInbox();
        if (!notification.read) {
          showBrowserNotification(
            notification.title,
            notification.body || "",
            () => {
              if (notification.related_posting_id) {
                router.push(`/projects/${notification.related_posting_id}`);
              }
            },
          );
        }
      },
      () => mutateInbox(),
      () => mutateInbox(),
    );

    const conversationChannel = subscribeToConversations(currentUserId, () =>
      mutateInbox(),
    );

    return () => {
      unsubscribeChannel(notificationChannel);
      unsubscribeChannel(conversationChannel);
    };
  }, [currentUserId, mutateInbox, router]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const handleMarkAsRead = async (notificationId: string) => {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);
    mutateInbox();
  };

  const handleMarkAllAsRead = async () => {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", currentUserId)
      .eq("read", false);
    mutateInbox();
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const supabase = createClient();
    await supabase.from("notifications").delete().eq("id", notificationId);
    mutateInbox();
  };

  const handleNotificationClick = (notification: (typeof notifications)[0]) => {
    handleMarkAsRead(notification.id);
    if (notification.related_posting_id) {
      router.push(`/projects/${notification.related_posting_id}`);
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    setIsSendingMessage(true);
    const supabase = createClient();

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: currentUserId,
        content: newMessage.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      setIsSendingMessage(false);
      return;
    }

    // Optimistic update
    setLocalMessages((prev) => [...prev, message]);
    setNewMessage("");

    // Create notification for other user (fire and forget)
    const otherUserId =
      selectedConversation.participant_1 === currentUserId
        ? selectedConversation.participant_2
        : selectedConversation.participant_1;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", currentUserId)
      .maybeSingle();

    supabase
      .from("notifications")
      .insert({
        user_id: otherUserId,
        type: "new_message",
        title: "New Message",
        body: `${profile?.full_name || "Someone"}: ${newMessage.trim().slice(0, 50)}${newMessage.length > 50 ? "..." : ""}`,
        related_user_id: currentUserId,
      })
      .then(({ error }) => {
        if (error) console.error("Error creating notification:", error);
      });

    setIsSendingMessage(false);
    mutateMessages();
  }, [newMessage, selectedConversation, currentUserId, mutateMessages]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="mt-1 text-muted-foreground">
            Notifications and messages
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => {
            setActiveTab("notifications");
            setSelectedConversation(null);
          }}
          className={cn(
            "relative px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "notifications"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
            {unreadNotifications > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                {unreadNotifications}
              </Badge>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab("messages")}
          className={cn(
            "relative px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "messages"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
            {conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0) >
              0 && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                {conversations.reduce(
                  (acc, c) => acc + (c.unread_count || 0),
                  0,
                )}
              </Badge>
            )}
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === "notifications" ? (
        <div className="space-y-4">
          {/* Actions */}
          {notifications.length > 0 && unreadNotifications > 0 && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCheck className="h-4 w-4" />
                Mark all as read
              </Button>
            </div>
          )}

          {/* Notifications list */}
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Inbox className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  No notifications yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "group flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50",
                    !notification.read && "bg-primary/5 border-primary/20",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full shrink-0 cursor-pointer",
                      notification.type === "application_accepted"
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                        : notification.type === "application_rejected"
                          ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                          : "bg-muted text-muted-foreground",
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div
                    className="flex-1 cursor-pointer min-w-0"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium">{notification.title}</h4>
                        {notification.body && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {notification.body}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Conversations list */}
          <div className="space-y-2 lg:col-span-1">
            {conversations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    No conversations yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Start by contacting a project creator
                  </p>
                </CardContent>
              </Card>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={cn(
                    "w-full flex items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-muted/50",
                    selectedConversation?.id === conversation.id &&
                      "bg-muted border-primary/50",
                    conversation.unread_count &&
                      conversation.unread_count > 0 &&
                      "bg-primary/5",
                  )}
                >
                  <OnlineStatusBadge
                    isOnline={isUserOnline(
                      conversation.other_user?.user_id || "",
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium shrink-0">
                      {getInitials(conversation.other_user?.full_name || null)}
                    </div>
                  </OnlineStatusBadge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate">
                        {conversation.other_user?.full_name || "Unknown"}
                      </h4>
                      {conversation.last_message && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(conversation.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    {conversation.posting && (
                      <p className="text-xs text-primary truncate">
                        Re: {conversation.posting.title}
                      </p>
                    )}
                    {conversation.last_message && (
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message.sender_id === currentUserId
                          ? "You: "
                          : ""}
                        {conversation.last_message.content}
                      </p>
                    )}
                  </div>
                  {conversation.unread_count &&
                    conversation.unread_count > 0 && (
                      <Badge
                        variant="destructive"
                        className="h-5 min-w-5 px-1.5"
                      >
                        {conversation.unread_count}
                      </Badge>
                    )}
                </button>
              ))
            )}
          </div>

          {/* Chat area */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="flex flex-col h-[600px]">
                {/* Chat header */}
                <CardHeader className="border-b border-border py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <OnlineStatusBadge
                        isOnline={isUserOnline(
                          selectedConversation.other_user?.user_id || "",
                        )}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {getInitials(
                            selectedConversation.other_user?.full_name || null,
                          )}
                        </div>
                      </OnlineStatusBadge>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {selectedConversation.other_user?.full_name ||
                              "Unknown"}
                          </h4>
                          <OnlineStatus
                            isOnline={isUserOnline(
                              selectedConversation.other_user?.user_id || "",
                            )}
                            showLabel
                            size="sm"
                          />
                        </div>
                        {selectedConversation.posting && (
                          <Link
                            href={`/projects/${selectedConversation.posting_id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            Re: {selectedConversation.posting.title}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {localMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mb-2" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    localMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.sender_id === currentUserId
                            ? "justify-end"
                            : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-4 py-2",
                            message.sender_id === currentUserId
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted",
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              message.sender_id === currentUserId
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground",
                            )}
                          >
                            {formatDate(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="border-t border-border px-4 py-2">
                    <TypingIndicator userName={otherUserName} />
                  </div>
                )}

                {/* Message input */}
                <div className="border-t border-border p-4">
                  <div className="flex gap-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        if (e.target.value.length > 0) {
                          setIsTyping(true);
                        } else {
                          setIsTyping(false);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          setIsTyping(false);
                          handleSendMessage();
                        }
                      }}
                      onBlur={() => setIsTyping(false)}
                      placeholder="Type a message..."
                      rows={1}
                      className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <Button
                      onClick={() => {
                        setIsTyping(false);
                        handleSendMessage();
                      }}
                      disabled={!newMessage.trim() || isSendingMessage}
                    >
                      {isSendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {/* Connection status */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    {isConnected ? (
                      <>
                        <Wifi className="h-3 w-3 text-green-500" />
                        <span>Connected</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-red-500" />
                        <span>Connecting...</span>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="flex flex-col items-center justify-center h-[600px]">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  Select a conversation to start messaging
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <InboxPageContent />
    </Suspense>
  );
}
