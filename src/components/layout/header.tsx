"use client";

import Link from "next/link";
import { Bell, Search, User, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      {/* Spacer for mobile menu button */}
      <div className="w-10 md:hidden" />

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search projects, skills..."
          className="pl-9 bg-muted/50"
        />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
          {/* Notification badge */}
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* User dropdown */}
        <div className="relative group">
          <Button variant="ghost" size="icon" className="rounded-full">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              U
            </div>
            <span className="sr-only">User menu</span>
          </Button>
          
          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-md border border-border bg-popover p-1 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <div className="my-1 h-px bg-border" />
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
