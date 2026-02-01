#!/bin/bash

# Credit Usage Monitoring Script
# Run this daily during development to track credit consumption

echo "======================================"
echo "   MeshIt Voice Agent Credits"
echo "======================================"
echo ""

echo "📊 Credit Status:"
echo ""
echo "1. Deepgram (Primary STT)"
echo "   Credit: €200"
echo "   Check: https://console.deepgram.com/billing"
echo "   Usage: Check minutes used / remaining"
echo ""

echo "2. OpenAI (Backup STT + Conversation)"
echo "   Credit: €50"
echo "   Check: https://platform.openai.com/usage"
echo "   Usage: Check API usage / remaining credits"
echo ""

echo "3. ElevenLabs (TTS)"
echo "   Credit: Pay-as-you-go"
echo "   Check: https://elevenlabs.io/app/usage"
echo "   Usage: Check character usage / balance"
echo ""

echo "4. Google Gemini (Conversation - Future)"
echo "   Credit: FREE (15 RPM limit)"
echo "   Check: https://aistudio.google.com/app/apikey"
echo "   Usage: No cost tracking needed"
echo ""

echo "======================================"
echo "   Quick Cost Calculator"
echo "======================================"
echo ""

# Get number of conversations from user
read -p "How many test conversations have you done? " conversations

if [ -z "$conversations" ]; then
  conversations=0
fi

# Calculate costs
deepgram_cost=$(echo "scale=4; $conversations * 0.0129" | bc)
elevenlabs_cost=$(echo "scale=4; $conversations * 0.075" | bc)
openai_cost=$(echo "scale=4; $conversations * 0.005" | bc)
total_cost=$(echo "scale=4; $conversations * 0.09" | bc)

# Calculate remaining
deepgram_remaining=$(echo "scale=2; 200 - $deepgram_cost" | bc)
openai_remaining=$(echo "scale=2; 50 - $openai_cost" | bc)

echo ""
echo "💰 Estimated Usage for $conversations conversations:"
echo ""
echo "   Deepgram:    €$deepgram_cost used (€$deepgram_remaining remaining)"
echo "   ElevenLabs:  €$elevenlabs_cost used"
echo "   OpenAI:      €$openai_cost used (€$openai_remaining remaining)"
echo "   ────────────────────────────────────"
echo "   Total:       €$total_cost"
echo ""

# Calculate how many more conversations possible
deepgram_remaining_conversations=$(echo "scale=0; $deepgram_remaining / 0.0129" | bc)
openai_remaining_conversations=$(echo "scale=0; $openai_remaining / 0.005" | bc)

echo "📈 Remaining Capacity:"
echo ""
echo "   Deepgram:    ~$deepgram_remaining_conversations more conversations"
echo "   OpenAI:      ~$openai_remaining_conversations more conversations"
echo ""

# Determine bottleneck
if [ $(echo "$deepgram_remaining_conversations < $openai_remaining_conversations" | bc) -eq 1 ]; then
  echo "   ⚠️  Deepgram will run out first"
  echo "   💡 Tip: You have plenty of Deepgram credit, use it heavily!"
else
  echo "   ⚠️  OpenAI will run out first"
  echo "   💡 Tip: Switch to Gemini to save OpenAI credit!"
fi

echo ""
echo "======================================"
echo "   Optimization Tips"
echo "======================================"
echo ""
echo "✅ Use Deepgram heavily (€200 credit)"
echo "⚠️  Save OpenAI for final testing (€50 credit)"
echo "💡 Switch to Gemini for FREE conversation AI"
echo "📊 Monitor ElevenLabs balance regularly"
echo ""
echo "See docs/CREDIT_OPTIMIZATION_STRATEGY.md for details"
echo ""
