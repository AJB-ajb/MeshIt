import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { SkipLink } from "@/components/ui/skip-link";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <SkipLink />
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main 
          id="main-content" 
          className={cn("flex-1 p-6", className)}
          role="main"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
