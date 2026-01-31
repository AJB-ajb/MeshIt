/**
 * Vector similarity calculations for matching
 * Pure functions that can be tested without database dependencies
 */

/**
 * Calculates cosine similarity between two vectors
 * Returns a value between -1 and 1, where 1 means identical direction
 * 
 * Formula: cos(θ) = (A · B) / (||A|| × ||B||)
 * 
 * @param a First vector
 * @param b Second vector
 * @returns Cosine similarity score between -1 and 1
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimensions must match: ${a.length} vs ${b.length}`);
  }

  if (a.length === 0) {
    throw new Error("Vectors cannot be empty");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

  if (magnitude === 0) {
    return 0; // Handle zero vectors
  }

  return dotProduct / magnitude;
}

/**
 * Calculates cosine distance between two vectors
 * This is what pgvector uses with the <=> operator
 * 
 * Formula: distance = 1 - cosine_similarity
 * 
 * @param a First vector
 * @param b Second vector
 * @returns Cosine distance (0 = identical, 2 = opposite)
 */
export function cosineDistance(a: number[], b: number[]): number {
  return 1 - cosineSimilarity(a, b);
}

/**
 * Converts cosine distance to similarity score (0-1 range)
 * This matches what the database functions return
 * 
 * @param distance Cosine distance from pgvector
 * @returns Similarity score between 0 and 1
 */
export function distanceToSimilarity(distance: number): number {
  return 1 - distance;
}

/**
 * Normalizes a vector to unit length
 * Useful for ensuring consistent similarity calculations
 * 
 * @param vector Input vector
 * @returns Normalized unit vector
 */
export function normalizeVector(vector: number[]): number[] {
  if (vector.length === 0) {
    throw new Error("Vector cannot be empty");
  }

  let magnitude = 0;
  for (const val of vector) {
    magnitude += val * val;
  }
  magnitude = Math.sqrt(magnitude);

  if (magnitude === 0) {
    return vector.map(() => 0);
  }

  return vector.map((val) => val / magnitude);
}

/**
 * Calculates Euclidean (L2) distance between two vectors
 * Alternative distance metric
 * 
 * @param a First vector
 * @param b Second vector
 * @returns Euclidean distance
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimensions must match: ${a.length} vs ${b.length}`);
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Finds the top N most similar vectors from a list
 * Useful for client-side matching or testing
 * 
 * @param target Target vector to match against
 * @param candidates Array of candidate vectors with IDs
 * @param limit Maximum number of results
 * @returns Sorted array of matches with similarity scores
 */
export function findTopMatches<T extends { id: string; embedding: number[] | null }>(
  target: number[],
  candidates: T[],
  limit: number = 10
): Array<{ item: T; similarity: number }> {
  const results = candidates
    .filter((c) => c.embedding !== null)
    .map((item) => ({
      item,
      similarity: cosineSimilarity(target, item.embedding!),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return results;
}

/**
 * Calculates the average similarity between a target and multiple vectors
 * Useful for evaluating overall match quality
 * 
 * @param target Target vector
 * @param others Array of vectors to compare against
 * @returns Average similarity score
 */
export function averageSimilarity(target: number[], others: number[][]): number {
  if (others.length === 0) {
    return 0;
  }

  const total = others.reduce(
    (sum, other) => sum + cosineSimilarity(target, other),
    0
  );

  return total / others.length;
}

/**
 * Checks if a similarity score meets a minimum threshold
 * 
 * @param similarity Similarity score (0-1)
 * @param threshold Minimum threshold (default: 0.7)
 * @returns True if similarity meets threshold
 */
export function meetsThreshold(similarity: number, threshold: number = 0.7): boolean {
  return similarity >= threshold;
}

/**
 * Categorizes a similarity score into quality tiers
 * 
 * @param similarity Similarity score (0-1)
 * @returns Quality tier: 'excellent' | 'good' | 'fair' | 'poor'
 */
export function categorizeMatch(
  similarity: number
): "excellent" | "good" | "fair" | "poor" {
  if (similarity >= 0.9) return "excellent";
  if (similarity >= 0.75) return "good";
  if (similarity >= 0.5) return "fair";
  return "poor";
}
