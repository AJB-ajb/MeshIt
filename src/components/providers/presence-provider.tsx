"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePresence } from "@/lib/hooks/use-presence";
import { createClient } from "@/lib/supabase/client";

type PresenceContextType = {
  onlineUsers: Map<string, { online_at: string }>;
  isUserOnline: (userId: string) => boolean;
  getLastSeen: (userId: string) => string | null;
  currentUserId: string | null;
};

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: new Map(),
  isUserOnline: () => false,
  getLastSeen: () => null,
  currentUserId: null,
});

export function usePresenceContext() {
  return useContext(PresenceContext);
}

type PresenceProviderProps = {
  children: ReactNode;
};

export function PresenceProvider({ children }: PresenceProviderProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const { onlineUsers, isUserOnline, getLastSeen } = usePresence(currentUserId);

  return (
    <PresenceContext.Provider
      value={{
        onlineUsers,
        isUserOnline,
        getLastSeen,
        currentUserId,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}
