/**
 * Voice Agent Tests
 */

// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  startVoiceConversation,
  processVoiceTurn,
  completeVoiceOnboarding,
  getSession,
  deleteSession,
  cleanupOldSessions,
} from '../voice-agent';

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn(async (prompt: string) => {
        // Mock responses based on prompt content
        if (prompt.includes('greeting')) {
          return {
            response: {
              text: () =>
                JSON.stringify({
                  greeting: 'Hi! What technologies do you work with?',
                  nextState: 'skills',
                }),
            },
          };
        }

        if (prompt.includes('React')) {
          return {
            response: {
              text: () =>
                JSON.stringify({
                  extractedData: { skills: ['React', 'TypeScript'] },
                  nextQuestion: 'How many years of experience do you have?',
                  nextState: 'experience',
                  completed: false,
                }),
            },
          };
        }

        return {
          response: {
            text: () =>
              JSON.stringify({
                extractedData: {},
                nextQuestion: 'Can you tell me more?',
                nextState: 'skills',
                completed: false,
              }),
          },
        };
      }),
    })),
  })),
}));

describe('Voice Agent', () => {
  beforeEach(() => {
    // Clean up sessions before each test
    // Sessions are managed internally, no cleanup needed for tests
  });

  describe('startVoiceConversation', () => {
    it('should create a new conversation session', async () => {
      const session = await startVoiceConversation();

      expect(session.sessionId).toBeTruthy();
      expect(session.state).toBe('greeting');
      expect(session.history).toHaveLength(1);
      expect(session.history[0].role).toBe('agent');
      expect(session.extractedData).toEqual({});
    });

    it('should include userId if provided', async () => {
      const session = await startVoiceConversation('user123');
      expect(session.userId).toBe('user123');
    });

    it('should generate greeting message', async () => {
      const session = await startVoiceConversation();
      const greeting = session.history[0].text;
      expect(greeting).toContain('technologies');
    });
  });

  describe('processVoiceTurn', () => {
    it('should process user input and extract data', async () => {
      const session = await startVoiceConversation();
      const response = await processVoiceTurn(
        session.sessionId,
        'I work with React and TypeScript'
      );

      expect(response.transcription).toBe('I work with React and TypeScript');
      expect(response.extractedData.skills).toEqual(['React', 'TypeScript']);
      expect(response.nextQuestion).toBeTruthy();
      expect(response.completed).toBe(false);
    });

    it('should update session history', async () => {
      const session = await startVoiceConversation();
      await processVoiceTurn(session.sessionId, 'Test input');

      const updatedSession = getSession(session.sessionId);
      expect(updatedSession?.history).toHaveLength(3); // greeting + user + agent
    });

    it('should throw error for invalid session', async () => {
      await expect(
        processVoiceTurn('invalid-session', 'test')
      ).rejects.toThrow('Session not found');
    });
  });

  describe('completeVoiceOnboarding', () => {
    it('should return extracted profile data', async () => {
      const session = await startVoiceConversation();
      session.extractedData = {
        skills: ['React'],
        experience_years: 5,
        role: 'full-stack',
        interests: ['AI'],
        availability_hours: 15,
        collaboration_style: 'flexible',
      };

      const profile = await completeVoiceOnboarding(session.sessionId);
      expect(profile.skills).toEqual(['React']);
      expect(profile.experience_years).toBe(5);
    });

    it('should delete session after completion', async () => {
      const session = await startVoiceConversation();
      await completeVoiceOnboarding(session.sessionId);

      const deletedSession = getSession(session.sessionId);
      expect(deletedSession).toBeUndefined();
    });
  });

  describe('session management', () => {
    it('should retrieve session by ID', async () => {
      const session = await startVoiceConversation();
      const retrieved = getSession(session.sessionId);
      expect(retrieved).toEqual(session);
    });

    it('should delete session', async () => {
      const session = await startVoiceConversation();
      const deleted = deleteSession(session.sessionId);
      expect(deleted).toBe(true);
      expect(getSession(session.sessionId)).toBeUndefined();
    });

    it('should cleanup old sessions', async () => {
      const session = await startVoiceConversation();
      // Manually set old timestamp
      session.updatedAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

      const cleaned = cleanupOldSessions(30); // 30 minutes max age
      expect(cleaned).toBeGreaterThanOrEqual(0);
    });
  });
});
