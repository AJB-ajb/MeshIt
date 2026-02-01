/**
 * Test Script: Gemini Live Voice Agent
 * Run: GOOGLE_API_KEY=xxx ELEVENLABS_API_KEY=xxx npx tsx scripts/test-gemini-voice.ts
 * Or: Set environment variables in your shell first
 */

import {
  startGeminiVoiceConversation,
  processGeminiVoiceTurn,
  completeGeminiVoiceConversation,
} from '../src/lib/ai/gemini-voice-agent';
import * as fs from 'fs';
import * as path from 'path';

// Verify environment variables
function checkEnv() {
  const required = ['GOOGLE_API_KEY', 'ELEVENLABS_API_KEY'];
  const missing = required.filter((key) => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    console.error('\nPlease set them in your shell or .env file:');
    console.error('  export GOOGLE_API_KEY=your_key');
    console.error('  export ELEVENLABS_API_KEY=your_key');
    console.error('\nOr run with:');
    console.error('  GOOGLE_API_KEY=xxx ELEVENLABS_API_KEY=xxx npx tsx scripts/test-gemini-voice.ts');
    process.exit(1);
  }
}

async function testGeminiVoice() {
  // Check environment first
  checkEnv();
  
  console.log('🧪 Testing Gemini Live Voice Agent\n');
  console.log('='.repeat(50));

  try {
    // Step 1: Start conversation
    console.log('\n📍 Step 1: Starting conversation...');
    const { sessionId, greeting, audio } = await startGeminiVoiceConversation();
    console.log(`✅ Session ID: ${sessionId}`);
    console.log(`🤖 Greeting: "${greeting}"`);
    console.log(`🔊 Audio size: ${audio.byteLength} bytes`);

    // Save greeting audio for manual verification
    const greetingPath = path.join(process.cwd(), 'test-greeting.mp3');
    fs.writeFileSync(greetingPath, Buffer.from(audio));
    console.log(`💾 Greeting audio saved to: ${greetingPath}`);

    // Step 2: Simulate user responses
    const mockConversation = [
      "I'm a full-stack developer. I work with React, TypeScript, and Node.js",
      "I have about 5 years of experience in web development",
      "I can commit around 10-15 hours per week to side projects",
      "I'm really interested in AI applications and developer tools",
      "I'm flexible - I can do both sync and async work depending on the project",
    ];

    console.log('\n📍 Step 2: Processing conversation turns...\n');

    for (let i = 0; i < mockConversation.length; i++) {
      const userInput = mockConversation[i];
      console.log(`\n--- Turn ${i + 1} ---`);
      console.log(`👤 User: "${userInput}"`);

      const response = await processGeminiVoiceTurn(sessionId, userInput);

      console.log(`🤖 Agent: "${response.nextQuestion}"`);
      console.log(`📊 Extracted data:`, JSON.stringify(response.extractedData, null, 2));
      console.log(`✅ Complete: ${response.completed}`);
      console.log(`🔊 Audio size: ${response.audio?.length || 0} chars (base64)`);

      if (response.completed) {
        console.log('\n🎉 Conversation marked as complete!');
        break;
      }

      // Small delay between turns
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Step 3: Complete conversation
    console.log('\n📍 Step 3: Completing conversation...');
    const { profile, summary } = await completeGeminiVoiceConversation(sessionId);

    console.log(`\n✅ Completion summary: "${summary}"`);
    console.log('\n📋 Final Profile:');
    console.log(JSON.stringify(profile, null, 2));

    // Validate profile
    console.log('\n📍 Step 4: Validating profile...');
    const required = [
      'skills',
      'experience_years',
      'role',
      'interests',
      'availability_hours',
      'collaboration_style',
    ];

    const missing = required.filter((field) => !profile[field]);
    if (missing.length > 0) {
      console.warn(`⚠️  Missing fields: ${missing.join(', ')}`);
    } else {
      console.log('✅ All required fields present!');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Test completed successfully!\n');

    // Summary
    console.log('📊 Summary:');
    console.log(`   - Session ID: ${sessionId}`);
    console.log(`   - Skills: ${profile.skills?.join(', ') || 'N/A'}`);
    console.log(`   - Experience: ${profile.experience_years || 'N/A'} years`);
    console.log(`   - Role: ${profile.role || 'N/A'}`);
    console.log(`   - Interests: ${profile.interests?.join(', ') || 'N/A'}`);
    console.log(`   - Availability: ${profile.availability_hours || 'N/A'} hours/week`);
    console.log(`   - Style: ${profile.collaboration_style || 'N/A'}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run test
testGeminiVoice();
