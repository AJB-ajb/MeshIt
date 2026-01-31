"use client";

import { AlertTriangle } from "lucide-react";
import { isTestMode } from "@/lib/environment";

export function TestModeBanner() {
  // Only show in test mode (non-production)
  if (!isTestMode()) return null;

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
      <div className="flex items-center justify-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-medium">
          Test Mode: Showing test/mock data only. Production data is isolated.
        </span>
      </div>
    </div>
  );
}
