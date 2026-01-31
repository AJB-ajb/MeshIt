import { describe, it, expect } from "vitest";
import {
  cosineSimilarity,
  cosineDistance,
  distanceToSimilarity,
  normalizeVector,
  euclideanDistance,
  findTopMatches,
  averageSimilarity,
  meetsThreshold,
  categorizeMatch,
} from "../similarity";

describe("similarity", () => {
  describe("cosineSimilarity", () => {
    it("returns 1 for identical vectors", () => {
      const a = [1, 2, 3];
      const b = [1, 2, 3];
      expect(cosineSimilarity(a, b)).toBeCloseTo(1, 10);
    });

    it("returns -1 for opposite vectors", () => {
      const a = [1, 2, 3];
      const b = [-1, -2, -3];
      expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 10);
    });

    it("returns 0 for orthogonal vectors", () => {
      const a = [1, 0];
      const b = [0, 1];
      expect(cosineSimilarity(a, b)).toBeCloseTo(0, 10);
    });

    it("returns same result regardless of magnitude", () => {
      const a = [1, 2, 3];
      const b = [2, 4, 6]; // Same direction, 2x magnitude
      expect(cosineSimilarity(a, b)).toBeCloseTo(1, 10);
    });

    it("handles normalized vectors correctly", () => {
      const a = normalizeVector([1, 2, 3]);
      const b = normalizeVector([1, 2, 3]);
      expect(cosineSimilarity(a, b)).toBeCloseTo(1, 10);
    });

    it("throws error for mismatched dimensions", () => {
      const a = [1, 2, 3];
      const b = [1, 2];
      expect(() => cosineSimilarity(a, b)).toThrow("Vector dimensions must match");
    });

    it("throws error for empty vectors", () => {
      expect(() => cosineSimilarity([], [])).toThrow("Vectors cannot be empty");
    });

    it("handles zero vectors", () => {
      const a = [0, 0, 0];
      const b = [1, 2, 3];
      expect(cosineSimilarity(a, b)).toBe(0);
    });

    it("calculates similarity for high-dimensional vectors", () => {
      // Simulate 1536-dimensional embedding vectors
      const a = new Array(1536).fill(0).map((_, i) => Math.sin(i));
      const b = new Array(1536).fill(0).map((_, i) => Math.sin(i + 0.1));
      
      const similarity = cosineSimilarity(a, b);
      expect(similarity).toBeGreaterThan(0.99); // Very similar vectors
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it("matches expected values for known test case", () => {
      // Known test case: vectors at 45 degrees
      const a = [1, 0];
      const b = [1, 1];
      // cos(45°) ≈ 0.7071
      expect(cosineSimilarity(a, b)).toBeCloseTo(Math.SQRT1_2, 5);
    });
  });

  describe("cosineDistance", () => {
    it("returns 0 for identical vectors", () => {
      const a = [1, 2, 3];
      const b = [1, 2, 3];
      expect(cosineDistance(a, b)).toBeCloseTo(0, 10);
    });

    it("returns 2 for opposite vectors", () => {
      const a = [1, 2, 3];
      const b = [-1, -2, -3];
      expect(cosineDistance(a, b)).toBeCloseTo(2, 10);
    });

    it("returns 1 for orthogonal vectors", () => {
      const a = [1, 0];
      const b = [0, 1];
      expect(cosineDistance(a, b)).toBeCloseTo(1, 10);
    });
  });

  describe("distanceToSimilarity", () => {
    it("converts distance 0 to similarity 1", () => {
      expect(distanceToSimilarity(0)).toBe(1);
    });

    it("converts distance 1 to similarity 0", () => {
      expect(distanceToSimilarity(1)).toBe(0);
    });

    it("converts distance 2 to similarity -1", () => {
      expect(distanceToSimilarity(2)).toBe(-1);
    });

    it("handles fractional distances", () => {
      expect(distanceToSimilarity(0.25)).toBe(0.75);
      expect(distanceToSimilarity(0.5)).toBe(0.5);
    });
  });

  describe("normalizeVector", () => {
    it("normalizes to unit length", () => {
      const vector = [3, 4]; // 3-4-5 triangle
      const normalized = normalizeVector(vector);
      
      // Check unit length
      const magnitude = Math.sqrt(normalized[0] ** 2 + normalized[1] ** 2);
      expect(magnitude).toBeCloseTo(1, 10);
      
      // Check direction preserved
      expect(normalized[0]).toBeCloseTo(0.6, 10);
      expect(normalized[1]).toBeCloseTo(0.8, 10);
    });

    it("handles already normalized vectors", () => {
      const vector = [1, 0];
      const normalized = normalizeVector(vector);
      expect(normalized).toEqual([1, 0]);
    });

    it("handles zero vector", () => {
      const vector = [0, 0, 0];
      const normalized = normalizeVector(vector);
      expect(normalized).toEqual([0, 0, 0]);
    });

    it("throws error for empty vector", () => {
      expect(() => normalizeVector([])).toThrow("Vector cannot be empty");
    });

    it("normalizes high-dimensional vectors", () => {
      const vector = new Array(1536).fill(1);
      const normalized = normalizeVector(vector);
      
      const magnitude = Math.sqrt(normalized.reduce((sum, v) => sum + v * v, 0));
      expect(magnitude).toBeCloseTo(1, 10);
    });
  });

  describe("euclideanDistance", () => {
    it("returns 0 for identical vectors", () => {
      const a = [1, 2, 3];
      const b = [1, 2, 3];
      expect(euclideanDistance(a, b)).toBe(0);
    });

    it("calculates correct distance for 2D vectors", () => {
      const a = [0, 0];
      const b = [3, 4];
      expect(euclideanDistance(a, b)).toBe(5); // 3-4-5 triangle
    });

    it("throws error for mismatched dimensions", () => {
      const a = [1, 2, 3];
      const b = [1, 2];
      expect(() => euclideanDistance(a, b)).toThrow("Vector dimensions must match");
    });
  });

  describe("findTopMatches", () => {
    const target = [1, 0, 0];
    const candidates = [
      { id: "a", embedding: [1, 0, 0] },      // Identical
      { id: "b", embedding: [0.9, 0.1, 0] },  // Very similar
      { id: "c", embedding: [0, 1, 0] },      // Orthogonal
      { id: "d", embedding: [-1, 0, 0] },     // Opposite
      { id: "e", embedding: null },           // No embedding
    ];

    it("returns matches sorted by similarity", () => {
      const matches = findTopMatches(target, candidates);
      
      expect(matches).toHaveLength(4); // Excludes null embedding
      expect(matches[0].item.id).toBe("a");
      expect(matches[0].similarity).toBeCloseTo(1, 5);
      expect(matches[1].item.id).toBe("b");
      expect(matches[3].item.id).toBe("d");
    });

    it("respects limit parameter", () => {
      const matches = findTopMatches(target, candidates, 2);
      expect(matches).toHaveLength(2);
    });

    it("excludes items with null embeddings", () => {
      const matches = findTopMatches(target, candidates);
      const ids = matches.map((m) => m.item.id);
      expect(ids).not.toContain("e");
    });

    it("handles empty candidates", () => {
      const matches = findTopMatches(target, []);
      expect(matches).toEqual([]);
    });

    it("handles all null embeddings", () => {
      const nullCandidates = [
        { id: "a", embedding: null },
        { id: "b", embedding: null },
      ];
      const matches = findTopMatches(target, nullCandidates);
      expect(matches).toEqual([]);
    });
  });

  describe("averageSimilarity", () => {
    it("calculates average for multiple vectors", () => {
      const target = [1, 0];
      const others = [
        [1, 0],  // similarity = 1
        [0, 1],  // similarity = 0
      ];
      expect(averageSimilarity(target, others)).toBeCloseTo(0.5, 10);
    });

    it("returns 0 for empty array", () => {
      const target = [1, 0];
      expect(averageSimilarity(target, [])).toBe(0);
    });

    it("returns similarity for single vector", () => {
      const target = [1, 0];
      const others = [[1, 0]];
      expect(averageSimilarity(target, others)).toBeCloseTo(1, 10);
    });
  });

  describe("meetsThreshold", () => {
    it("returns true for similarity above threshold", () => {
      expect(meetsThreshold(0.8, 0.7)).toBe(true);
    });

    it("returns true for similarity equal to threshold", () => {
      expect(meetsThreshold(0.7, 0.7)).toBe(true);
    });

    it("returns false for similarity below threshold", () => {
      expect(meetsThreshold(0.6, 0.7)).toBe(false);
    });

    it("uses default threshold of 0.7", () => {
      expect(meetsThreshold(0.7)).toBe(true);
      expect(meetsThreshold(0.69)).toBe(false);
    });
  });

  describe("categorizeMatch", () => {
    it("categorizes excellent matches (>= 0.9)", () => {
      expect(categorizeMatch(0.95)).toBe("excellent");
      expect(categorizeMatch(0.9)).toBe("excellent");
      expect(categorizeMatch(1)).toBe("excellent");
    });

    it("categorizes good matches (>= 0.75, < 0.9)", () => {
      expect(categorizeMatch(0.85)).toBe("good");
      expect(categorizeMatch(0.75)).toBe("good");
      expect(categorizeMatch(0.89)).toBe("good");
    });

    it("categorizes fair matches (>= 0.5, < 0.75)", () => {
      expect(categorizeMatch(0.6)).toBe("fair");
      expect(categorizeMatch(0.5)).toBe("fair");
      expect(categorizeMatch(0.74)).toBe("fair");
    });

    it("categorizes poor matches (< 0.5)", () => {
      expect(categorizeMatch(0.3)).toBe("poor");
      expect(categorizeMatch(0.49)).toBe("poor");
      expect(categorizeMatch(0)).toBe("poor");
      expect(categorizeMatch(-1)).toBe("poor");
    });
  });
});

describe("similarity - real-world scenarios", () => {
  // Simulate realistic embedding scenarios
  
  it("similar skills have high similarity", () => {
    // Simulated embeddings for similar skill sets
    // In reality, these would come from OpenAI
    const reactDeveloper = normalizeVector(
      new Array(1536).fill(0).map((_, i) => Math.sin(i * 0.01) + 0.5)
    );
    const nextjsDeveloper = normalizeVector(
      new Array(1536).fill(0).map((_, i) => Math.sin(i * 0.01) + 0.52)
    );
    
    const similarity = cosineSimilarity(reactDeveloper, nextjsDeveloper);
    expect(similarity).toBeGreaterThan(0.95);
  });

  it("different skills have lower similarity", () => {
    // Simulated embeddings for different skill sets
    const frontendDeveloper = normalizeVector(
      new Array(1536).fill(0).map((_, i) => Math.sin(i * 0.01))
    );
    const dataSentist = normalizeVector(
      new Array(1536).fill(0).map((_, i) => Math.cos(i * 0.01))
    );
    
    const similarity = cosineSimilarity(frontendDeveloper, dataSentist);
    // Different but not completely unrelated
    expect(similarity).toBeLessThan(0.5);
  });

  it("handles batch matching performance", () => {
    // Test that matching is efficient for realistic batch sizes
    const target = normalizeVector(new Array(1536).fill(0).map(() => Math.random()));
    const candidates = Array.from({ length: 100 }, (_, i) => ({
      id: `user-${i}`,
      embedding: normalizeVector(new Array(1536).fill(0).map(() => Math.random())),
    }));

    const startTime = performance.now();
    const matches = findTopMatches(target, candidates, 10);
    const endTime = performance.now();

    expect(matches).toHaveLength(10);
    expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
  });
});
