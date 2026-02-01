/**
 * List Available Gemini Models
 * Run: GOOGLE_API_KEY=xxx npx tsx scripts/list-gemini-models.ts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GOOGLE_API_KEY not set');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log('📋 Listing available Gemini models...\n');
    
    const models = await genAI.listModels();
    
    console.log(`Found ${models.length} models:\n`);
    
    for (const model of models) {
      console.log(`Model: ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Description: ${model.description}`);
      console.log(`  Supported methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Failed to list models:', error);
    process.exit(1);
  }
}

listModels();
