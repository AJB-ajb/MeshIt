import { NextResponse } from "next/server";
import { isProduction, getEnvironmentName, isTestMode } from "@/lib/environment";

/**
 * Debug endpoint to check environment configuration.
 * This helps diagnose issues with production mode detection.
 * 
 * Usage: Visit /api/debug/env in your browser
 * 
 * SECURITY: Remove or protect this endpoint before going live!
 */
export async function GET() {
  const envInfo = {
    // Environment detection results
    computed: {
      isProduction: isProduction(),
      isTestMode: isTestMode(),
      environmentName: getEnvironmentName(),
    },
    // Raw environment variables (safe ones only)
    raw: {
      NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL || "undefined",
      VERCEL_URL: process.env.VERCEL_URL || "undefined",
      VERCEL: process.env.VERCEL || "undefined",
      NODE_ENV: process.env.NODE_ENV || "undefined",
    },
    // Diagnostic info
    diagnostic: {
      timestamp: new Date().toISOString(),
      productionUrl: "mesh-it.vercel.app",
      // Expected values for production
      expectedForProduction: {
        NEXT_PUBLIC_VERCEL_URL: "mesh-it.vercel.app",
        VERCEL_URL: "mesh-it.vercel.app",
      },
      // Instructions
      fix: isProduction() 
        ? "✅ Production mode is correctly detected"
        : "⚠️  Not in production mode. If this is your production deployment at mesh-it.vercel.app:\n" +
          "1. Run: pnpm vercel env add NEXT_PUBLIC_VERCEL_URL\n" +
          "2. Value: mesh-it.vercel.app\n" +
          "3. Environment: Production ONLY (not Preview/Development)\n" +
          "4. Redeploy: pnpm vercel --prod"
    }
  };

  return NextResponse.json(envInfo, {
    headers: {
      "Content-Type": "application/json",
      // Don't cache this response
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
