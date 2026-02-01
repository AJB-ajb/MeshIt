# Credit Optimization Strategy

**Goal**: Maximize your €200 Deepgram credit, save €50 OpenAI credit for final testing

---

## 💰 Your Credits Breakdown

| Service | Credit | Value | Usage Strategy |
|---------|--------|-------|----------------|
| **Deepgram** | €200 | ~46,500 minutes STT | ✅ **PRIMARY - Use heavily** |
| **OpenAI** | €50 | ~800 minutes STT | ⚠️ **BACKUP ONLY - Save for final testing** |
| **ElevenLabs** | Pay-as-you-go | Check balance | 💵 **Use for TTS** |
| **Google Gemini** | FREE | Unlimited (15 RPM) | ✅ **Use for conversation AI** |

---

## 🎯 Optimized Configuration

### Current Setup (Optimized)

```env
# PRIMARY: Use Deepgram heavily (€200 credit)
PRIMARY_STT_PROVIDER=deepgram

# TTS: ElevenLabs (pay-as-you-go)
PRIMARY_TTS_PROVIDER=elevenlabs

# Conversation: GPT-4o-mini (uses OpenAI €50 credit)
# TODO: Switch to Gemini to save OpenAI credit
```

### Cost Per 3-Minute Conversation

| Service | Provider | Cost | Credit Used |
|---------|----------|------|-------------|
| **STT** | Deepgram | €0.0129 | €200 credit ✅ |
| **TTS** | ElevenLabs | €0.075 | Pay-as-you-go 💵 |
| **LLM** | GPT-4o-mini | €0.005 | €50 credit ⚠️ |
| **Total** | | **€0.09** | |

---

## 📊 Credit Usage Projections

### With Current Configuration

**Using Deepgram (€200 credit):**
- Cost per minute: €0.0043
- Total minutes: €200 ÷ €0.0043 = **46,500 minutes**
- Per conversation (3 min): 46,500 ÷ 3 = **15,500 conversations**

**Using OpenAI for conversation (€50 credit):**
- Cost per conversation: €0.005
- Total conversations: €50 ÷ €0.005 = **10,000 conversations**

**Bottleneck**: OpenAI will run out first at 10,000 conversations

### Optimized Strategy

**Switch to Gemini for conversation (FREE):**
- Deepgram STT: 15,500 conversations (€200)
- Gemini conversation: Unlimited (FREE)
- OpenAI: Saved for final testing (€50)

**Result**: Can do **15,500+ conversations** before running out!

---

## 🔧 Implementation Steps

### Step 1: Keep Current Setup for Development ✅

**Why**: Already configured and working
- Deepgram: Primary STT (using €200 credit)
- OpenAI: Conversation (using €50 credit sparingly)
- ElevenLabs: TTS (pay-as-you-go)

**When to switch**: After initial testing phase

### Step 2: Monitor Credit Usage

**Check Deepgram Usage**:
```bash
# Visit: https://console.deepgram.com/billing
# Monitor: Minutes used / €200 remaining
```

**Check OpenAI Usage**:
```bash
# Visit: https://platform.openai.com/usage
# Monitor: Credits used / €50 remaining
```

**Check ElevenLabs Balance**:
```bash
# Visit: https://elevenlabs.io/app/usage
# Monitor: Characters used / Balance
```

### Step 3: Switch to Gemini (When Ready)

**Benefits**:
- FREE conversation AI (no credit usage)
- Saves entire €50 OpenAI credit
- Similar quality to GPT-4o-mini

**Implementation**:
1. Update `src/lib/ai/voice-agent.ts` to use Gemini
2. Keep OpenAI as fallback
3. Test thoroughly before deploying

---

## 💡 Cost Optimization Tips

### 1. Use Deepgram Heavily (€200 Credit)

**Do**:
- ✅ Use for all development testing
- ✅ Use for all user onboarding
- ✅ Enable real-time streaming for better UX
- ✅ Use word-level timestamps
- ✅ Enable speaker diarization if needed

**Don't**:
- ❌ Don't switch to Whisper unless Deepgram fails
- ❌ Don't worry about "wasting" Deepgram credit - you have plenty

### 2. Save OpenAI Credit (€50)

**Current Usage**:
- GPT-4o-mini for conversation: ~€0.005 per conversation
- Can do 10,000 conversations before running out

**Optimization**:
- Switch to Gemini (FREE) for conversation
- Save OpenAI credit for:
  - Final production testing
  - Backup STT (Whisper)
  - Emergency fallback

### 3. Monitor ElevenLabs Usage

**Cost**: €0.30 per 1,000 characters

**Optimization**:
- ✅ Use Turbo v2 model (fastest, cheapest)
- ✅ Cache common phrases (future enhancement)
- ✅ Keep responses concise
- ❌ Don't use Multilingual v2 unless needed (more expensive)

### 4. Use Gemini for Free

**Benefits**:
- FREE conversation AI
- 15 RPM limit (enough for most use cases)
- Similar quality to GPT-4o-mini

**Limitations**:
- 15 requests per minute (not an issue for voice onboarding)
- Slightly slower than GPT-4o-mini

---

## 📈 Scaling Strategy

### Phase 1: Development (Current)
- **Users**: 0-100
- **Strategy**: Use current setup, monitor usage
- **Cost**: ~€9 (100 users × €0.09)

### Phase 2: Beta Testing (Next)
- **Users**: 100-1,000
- **Strategy**: Switch to Gemini for conversation
- **Cost**: ~€70 (1,000 users × €0.07, no LLM cost)

### Phase 3: Production (Future)
- **Users**: 1,000-15,000
- **Strategy**: Full Gemini + Deepgram
- **Cost**: ~€1,050 (15,000 users × €0.07)

### Phase 4: Scale (When Credits Run Out)
- **Users**: 15,000+
- **Strategy**: Pay-as-you-go for all services
- **Cost**: €0.09 per user (current rate)

---

## 🎯 Recommended Actions

### Immediate (Now)

1. ✅ **ElevenLabs MCP configured** - Done!
2. ✅ **Credit strategy documented** - Done!
3. ⏳ **Monitor usage** - Set up tracking

### Short-term (This Week)

1. **Test voice onboarding** with current setup
2. **Monitor Deepgram usage** after 10-20 test conversations
3. **Check OpenAI usage** to see burn rate
4. **Verify ElevenLabs balance** and costs

### Medium-term (Next Week)

1. **Switch to Gemini** for conversation AI
2. **Test Gemini integration** thoroughly
3. **Keep OpenAI as fallback** for errors
4. **Document the switch** in code

### Long-term (Before Launch)

1. **Implement caching** for common TTS phrases
2. **Add usage analytics** to track costs
3. **Set up alerts** for credit thresholds
4. **Plan for pay-as-you-go** when credits run out

---

## 🔍 Usage Monitoring

### Daily Checks (During Development)

```bash
# Check Deepgram
echo "Deepgram: https://console.deepgram.com/billing"

# Check OpenAI
echo "OpenAI: https://platform.openai.com/usage"

# Check ElevenLabs
echo "ElevenLabs: https://elevenlabs.io/app/usage"
```

### Weekly Review

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Conversations tested | 50 | ? | ? |
| Deepgram credit used | <€5 | ? | ? |
| OpenAI credit used | <€1 | ? | ? |
| ElevenLabs cost | <€5 | ? | ? |

### Credit Thresholds

**Deepgram (€200)**:
- 🟢 Green: >€150 remaining (75%+)
- 🟡 Yellow: €50-€150 remaining (25-75%)
- 🔴 Red: <€50 remaining (<25%)

**OpenAI (€50)**:
- 🟢 Green: >€40 remaining (80%+)
- 🟡 Yellow: €20-€40 remaining (40-80%)
- 🔴 Red: <€20 remaining (<40%)

---

## 🚀 Future Enhancements

### 1. Implement Caching Layer

**Goal**: Reduce TTS costs by 50%

**Strategy**:
- Cache common agent responses
- Store audio files in CDN
- Reuse greetings and standard questions

**Savings**: ~€0.035 per conversation

### 2. Switch to Gemini

**Goal**: Save entire €50 OpenAI credit

**Strategy**:
- Use Gemini 2.0 Flash for conversation
- Keep OpenAI as fallback
- Monitor quality and adjust

**Savings**: €0.005 per conversation (100% of LLM cost)

### 3. Optimize Audio Quality

**Goal**: Balance quality vs cost

**Strategy**:
- Test lower bitrate for TTS
- Use shorter responses
- Compress audio files

**Savings**: ~€0.01 per conversation

### 4. Implement Rate Limiting

**Goal**: Prevent abuse and credit waste

**Strategy**:
- Limit conversations per user
- Implement cooldown periods
- Add CAPTCHA for suspicious activity

**Savings**: Prevent unlimited usage

---

## 📋 Quick Reference

### Current Cost Per User
```
STT (Deepgram):     €0.0129  (€200 credit)
TTS (ElevenLabs):   €0.075   (pay-as-you-go)
LLM (GPT-4o-mini):  €0.005   (€50 credit)
────────────────────────────────────────
Total:              €0.09    per 3-min conversation
```

### With Gemini Optimization
```
STT (Deepgram):     €0.0129  (€200 credit)
TTS (ElevenLabs):   €0.075   (pay-as-you-go)
LLM (Gemini):       €0.00    (FREE)
────────────────────────────────────────
Total:              €0.088   per 3-min conversation
Savings:            €0.005   per conversation
```

### Maximum Conversations
```
Current setup:      10,000   (limited by OpenAI €50)
With Gemini:        15,500   (limited by Deepgram €200)
Improvement:        +55%     more conversations
```

---

## 🎉 Summary

### ✅ What's Configured

1. **ElevenLabs MCP** - Added to `.cursor/mcp.json`
2. **Credit strategy** - Documented in `.env`
3. **Provider priorities** - Deepgram primary, OpenAI backup
4. **Cost optimization** - Clear guidelines for scaling

### 🎯 Next Steps

1. **Test current setup** - Verify everything works
2. **Monitor usage** - Track credit consumption
3. **Switch to Gemini** - When ready to optimize
4. **Scale confidently** - You have 15,500+ conversations available!

### 💰 Bottom Line

- **€200 Deepgram credit**: Use heavily for STT ✅
- **€50 OpenAI credit**: Save for final testing ⚠️
- **ElevenLabs**: Pay-as-you-go for quality TTS 💵
- **Gemini**: FREE conversation AI (switch when ready) 🎁

**You're all set to build and test without worrying about credits!** 🚀

---

**Last Updated**: January 31, 2026  
**Status**: Optimized for maximum credit utilization
