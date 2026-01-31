/**
 * Match Scoring Utilities
 * Implements weighted geometric mean for combining multi-dimensional match scores
 */

import type { ScoreBreakdown } from "@/lib/supabase/types";

/**
 * Default weights for each dimension
 * Based on spec: Critical (1.0), Important (0.7), Supplementary (0.4)
 */
export interface DimensionWeights {
  semantic: number;        // 0.4 - Most important for relevance
  skills_overlap: number;  // 0.3 - Important for practical fit
  experience_match: number; // 0.15 - Important but flexible
  commitment_match: number; // 0.15 - Important but flexible
}

export const DEFAULT_WEIGHTS: DimensionWeights = {
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
  ];

  // Calculate product of (score^weight) for each dimension
  let product = 1.0;
  let totalWeight = 0.0;

  for (const dimension of dimensions) {
    const score = breakdown[dimension];
    const weight = weights[dimension];

    // Skip zero-weight dimensions
    if (weight <= 0) continue;

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
    const scores = dimensions.map((d) => breakdown[d]);
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
  };
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
