/**
 * Match Scoring Utilities
 * Implements weighted geometric mean for combining multi-dimensional match scores
 */

import type { ScoreBreakdown, HardFilters } from "@/lib/supabase/types";
import { haversineDistance } from "./similarity";

/**
 * Default weights for each dimension
 * Adjusted to include location and filter dimensions
 */
export interface DimensionWeights {
  semantic: number;         // 0.30 - Most important for relevance
  skills_overlap: number;   // 0.25 - Important for practical fit
  experience_match: number; // 0.10 - Important but flexible
  commitment_match: number; // 0.10 - Important but flexible
  location_match: number;   // 0.10 - Location compatibility
  filter_match: number;     // 0.15 - Hard filter compliance
}

export const DEFAULT_WEIGHTS: DimensionWeights = {
  semantic: 0.30,
  skills_overlap: 0.25,
  experience_match: 0.10,
  commitment_match: 0.10,
  location_match: 0.10,
  filter_match: 0.15,
};

/**
 * Legacy weights for backward compatibility
 * Used when location_match and filter_match are not available
 */
export const LEGACY_WEIGHTS: Omit<DimensionWeights, "location_match" | "filter_match"> = {
  semantic: 0.4,
  skills_overlap: 0.3,
  experience_match: 0.15,
  commitment_match: 0.15,
};

/**
 * Computes weighted geometric mean of dimension scores
 * Formula: score = Π(sᵢ^wᵢ)^(1/Σwᵢ)
 * 
 * Where:
 * - sᵢ = score for dimension i (0-1)
 * - wᵢ = weight for dimension i
 * 
 * Behavior:
 * - Low scores hurt multiplicatively (0.9 × 0.9 × 0.3 → 0.24)
 * - Zero in any weighted dimension → zero overall
 * 
 * @param breakdown Per-dimension scores
 * @param weights Dimension weights (defaults to DEFAULT_WEIGHTS)
 * @returns Combined score (0-1)
 */
export function computeWeightedScore(
  breakdown: ScoreBreakdown,
  weights: DimensionWeights = DEFAULT_WEIGHTS
): number {
  const dimensions: (keyof ScoreBreakdown)[] = [
    "semantic",
    "skills_overlap",
    "experience_match",
    "commitment_match",
    "location_match",
    "filter_match",
  ];

  // Calculate product of (score^weight) for each dimension
  let product = 1.0;
  let totalWeight = 0.0;

  for (const dimension of dimensions) {
    const score = breakdown[dimension];
    const weight = weights[dimension];

    // Skip zero-weight dimensions or undefined scores
    if (weight <= 0 || score === undefined) continue;

    // If score is 0, return 0 (multiplicative property)
    if (score <= 0) {
      return 0.0;
    }

    // Add to product: score^weight
    product *= Math.pow(score, weight);
    totalWeight += weight;
  }

  // If no weights, return average
  if (totalWeight === 0) {
    const scores = dimensions.map((d) => breakdown[d]).filter((s) => s !== undefined);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  // Return geometric mean: (product)^(1/totalWeight)
  return Math.pow(product, 1 / totalWeight);
}

/**
 * Normalizes weights so they sum to 1
 * Useful for ensuring consistent scaling
 */
export function normalizeWeights(
  weights: DimensionWeights
): DimensionWeights {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total === 0) return weights;

  return {
    semantic: weights.semantic / total,
    skills_overlap: weights.skills_overlap / total,
    experience_match: weights.experience_match / total,
    commitment_match: weights.commitment_match / total,
    location_match: weights.location_match / total,
    filter_match: weights.filter_match / total,
  };
}

// ============================================
// FILTER SCORING UTILITIES
// ============================================

/**
 * Calculates filter match score based on hard filters
 * Returns 1.0 if no filters are set, or a penalized score if filters are violated
 * 
 * @param filters Hard filters to apply
 * @param distanceKm Distance in km (null if unknown)
 * @param commitmentHours Commitment hours of the counterparty
 * @param availabilityHours Availability hours of the counterparty
 * @param languages Languages spoken by the counterparty
 * @returns Score between 0 and 1
 */
export function calculateFilterScore(
  filters: HardFilters | null,
  distanceKm: number | null,
  commitmentHours: number | null,
  availabilityHours: number | null,
  languages: string[] | null
): number {
  if (!filters) {
    return 1.0;
  }

  let distanceScore = 1.0;
  let hoursScore = 1.0;
  let languageScore = 1.0;

  // Distance filter
  if (filters.max_distance_km !== undefined && distanceKm !== null) {
    if (distanceKm > filters.max_distance_km) {
      // Penalize based on how much it exceeds the limit
      distanceScore = Math.max(0, 
        1 - (distanceKm - filters.max_distance_km) / filters.max_distance_km
      );
    }
  }

  // Hours filter (for profile filtering projects)
  if (commitmentHours !== null) {
    if (filters.min_hours !== undefined && commitmentHours < filters.min_hours) {
      hoursScore = Math.min(hoursScore, commitmentHours / filters.min_hours);
    }
    if (filters.max_hours !== undefined && commitmentHours > filters.max_hours) {
      hoursScore = Math.min(hoursScore, filters.max_hours / commitmentHours);
    }
  }

  // Hours filter (for project filtering profiles)
  if (availabilityHours !== null) {
    if (filters.min_hours !== undefined && availabilityHours < filters.min_hours) {
      hoursScore = Math.min(hoursScore, availabilityHours / filters.min_hours);
    }
    if (filters.max_hours !== undefined && availabilityHours > filters.max_hours) {
      hoursScore = Math.min(hoursScore, filters.max_hours / availabilityHours);
    }
  }

  // Language filter
  if (filters.languages && filters.languages.length > 0 && languages) {
    const matchingLanguages = filters.languages.filter(
      (lang) => languages.includes(lang)
    ).length;
    languageScore = matchingLanguages / filters.languages.length;
  } else if (filters.languages && filters.languages.length > 0 && !languages) {
    // Required languages but counterparty has none set
    languageScore = 0;
  }

  // Combine multiplicatively
  return distanceScore * hoursScore * languageScore;
}

/**
 * Calculates distance between two profiles/locations
 */
export function calculateDistance(
  lat1: number | null,
  lng1: number | null,
  lat2: number | null,
  lng2: number | null
): number | null {
  return haversineDistance(lat1, lng1, lat2, lng2);
}

/**
 * Formats a score (0-1) as a percentage string
 */
export function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * Gets a color variant for a score based on thresholds
 * - >= 0.7: success (green)
 * - >= 0.5: warning (yellow)
 * - < 0.5: destructive (red)
 */
export function getScoreColorVariant(score: number): "success" | "warning" | "destructive" {
  if (score >= 0.7) return "success";
  if (score >= 0.5) return "warning";
  return "destructive";
}
