import { Metadata } from "next";
import { Search, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Messages",
};

// Mock conversations
const conversations = [
  {
    id: "1",
    projectTitle: "AI Recipe Generator",
    participants: [
      { name: "Alex Chen", initials: "AC" },
      { name: "Sarah Johnson", initials: "SJ" },
    ],
    lastMessage: {
      sender: "Alex Chen",
      content: "Great, let's sync tomorrow at 3pm!",
      time: "5 min ago",
    },
    unread: 2,
  },
  {
    id: "2",
    projectTitle: "Climate Data Visualization",
    participants: [
      { name: "Sam Wilson", initials: "SW" },
    ],
    lastMessage: {
      sender: "Sam Wilson",
      content: "I've shared the design mockups in the repo.",
      time: "2 hours ago",
    },
    unread: 0,
  },
];

export default function MessagesPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col lg:flex-row">
      {/* Conversations sidebar */}
      <div className="w-full border-b border-border lg:w-80 lg:border-b-0 lg:border-r">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search conversations..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="space-y-1 p-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50"
            >
              {/* Avatar stack */}
              <div className="relative flex -space-x-2">
                {conversation.participants.slice(0, 2).map((p, i) => (
                  <div
                    key={p.name}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium"
                    style={{ zIndex: 2 - i }}
                  >
                    {p.initials}
                  </div>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium">
                    {conversation.projectTitle}
                  </p>
                  {conversation.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                      {conversation.unread}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {conversation.lastMessage.sender}:{" "}
                  {conversation.lastMessage.content}
                </p>
                <p className="text-xs text-muted-foreground">
                  {conversation.lastMessage.time}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {conversations.length > 0 ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                AC
              </div>
              <div>
                <h2 className="font-medium">AI Recipe Generator</h2>
                <p className="text-sm text-muted-foreground">
                  Alex Chen, Sarah Johnson
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Sample messages */}
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  AC
                </div>
                <div className="rounded-lg bg-muted p-3 max-w-[80%]">
                  <p className="text-sm">
                    Hey! Welcome to the project. I&apos;m excited to work with you
                    on this recipe app!
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Yesterday at 2:30 PM
                  </p>
                </div>
              </div>

              <div className="flex gap-3 flex-row-reverse">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  ME
                </div>
                <div className="rounded-lg bg-primary/10 p-3 max-w-[80%]">
                  <p className="text-sm">
                    Thanks Alex! I&apos;ve been looking at the design mockups. The
                    ingredient recognition feature looks challenging but fun!
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Yesterday at 3:15 PM
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  AC
                </div>
                <div className="rounded-lg bg-muted p-3 max-w-[80%]">
                  <p className="text-sm">
                    Great, let&apos;s sync tomorrow at 3pm!
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    5 min ago
                  </p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-border p-4">
              <form className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit">
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">
                For extended collaboration, consider moving to Slack or Discord.
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              title="No messages yet"
              description="Your conversations with project teams will appear here."
            />
          </div>
        )}
      </div>
    </div>
  );
}
