/**
 * Voice Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateAudioFile,
  validateAudioBlob,
  estimateCost,
  formatDuration,
  blobToBase64,
  base64ToBlob,
} from '../utils';

describe('Voice Utils', () => {
  describe('validateAudioFile', () => {
    it('should validate supported audio formats', () => {
      const result = validateAudioFile('test.mp3', 1024 * 1024); // 1MB
      expect(result.supported).toBe(true);
      expect(result.format).toBe('.mp3');
    });

    it('should reject unsupported formats', () => {
      const result = validateAudioFile('test.txt', 1024);
      expect(result.supported).toBe(false);
    });

    it('should reject files over 25MB', () => {
      const result = validateAudioFile('test.wav', 30 * 1024 * 1024); // 30MB
      expect(result.sizeOk).toBe(false);
      expect(result.valid).toBe(false);
    });

    it('should validate files under 25MB', () => {
      const result = validateAudioFile('test.wav', 10 * 1024 * 1024); // 10MB
      expect(result.sizeOk).toBe(true);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateAudioBlob', () => {
    it('should validate audio blob', () => {
      const blob = new Blob(['test'], { type: 'audio/wav' });
      const result = validateAudioBlob(blob);
      expect(result.supported).toBe(true);
    });

    it('should reject non-audio blobs', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const result = validateAudioBlob(blob);
      expect(result.supported).toBe(false);
    });
  });

  describe('estimateCost', () => {
    it('should calculate Whisper cost correctly', () => {
      const cost = estimateCost(60, 'whisper'); // 1 minute
      expect(cost.cost_usd).toBe('0.0060');
      expect(cost.duration_minutes).toBe('1.00');
    });

    it('should calculate Deepgram cost correctly', () => {
      const cost = estimateCost(60, 'deepgram'); // 1 minute
      expect(cost.cost_usd).toBe('0.0043');
      expect(cost.duration_minutes).toBe('1.00');
    });

    it('should show Deepgram is cheaper', () => {
      const whisperCost = parseFloat(estimateCost(180, 'whisper').cost_usd);
      const deepgramCost = parseFloat(estimateCost(180, 'deepgram').cost_usd);
      expect(deepgramCost).toBeLessThan(whisperCost);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds correctly', () => {
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(125)).toBe('2:05');
      expect(formatDuration(30)).toBe('0:30');
    });
  });

  describe('base64 conversion', () => {
    it('should convert blob to base64 and back', async () => {
      const originalBlob = new Blob(['test data'], { type: 'audio/mpeg' });
      const base64 = await blobToBase64(originalBlob);
      expect(base64).toBeTruthy();
      expect(typeof base64).toBe('string');

      const convertedBlob = base64ToBlob(base64, 'audio/mpeg');
      expect(convertedBlob.type).toBe('audio/mpeg');
    });
  });
});
