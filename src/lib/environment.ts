/**
 * Environment detection utilities for data isolation and feature toggling.
 * 
 * Key behavior:
 * - Production (VERCEL_ENV=production): Shows only real data (is_test_data=false)
 * - Non-production (dev/preview): Shows only test data (is_test_data=true)
 * 
 * This ensures complete isolation between test and production data.
 */

/**
 * Check if the app is running in production (Vercel production environment)
 */
export function isProduction(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    (process.env.VERCEL === "1" && process.env.NODE_ENV === "production")
  );
}

/**
 * Get the value for is_test_data based on current environment.
 * This ensures new records are automatically tagged correctly.
 * 
 * @returns true for non-production (test data), false for production (real data)
 */
export function getTestDataValue(): boolean {
  return !isProduction();
}

/**
 * Check if we're in test mode (showing test data).
 * Used for UI indicators and messaging.
 * 
 * @returns true if in test mode, false if in production mode
 */
export function isTestMode(): boolean {
  return !isProduction();
}

/**
 * Get environment display name for UI and debugging.
 */
export function getEnvironmentName(): string {
  if (process.env.VERCEL_ENV === "production") return "Production";
  if (process.env.VERCEL_ENV === "preview") return "Preview";
  return "Development";
}
