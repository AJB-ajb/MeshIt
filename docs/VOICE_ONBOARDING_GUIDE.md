# Voice Onboarding - Complete Guide

**Date:** January 31, 2026  
**Status:** ✅ Implemented & Ready to Test

---

## 🎯 Quick Start - URLs to Test

### 1. **Voice Onboarding Page**
```
http://localhost:3000/onboarding/voice
```

**What happens:**
1. You see two options: "Voice Onboarding" or "Text Onboarding"
2. Click "Voice Onboarding"
3. Allow microphone access
4. AI agent greets you with voice
5. Have a natural conversation (4-5 questions)
6. Your profile gets auto-filled from the conversation

### 2. **Text Onboarding Page** (Fallback)
```
http://localhost:3000/onboarding/text
```
*Note: This route exists in the code but the form page hasn't been created yet*

### 3. **Match Audio Explanations**
```
http://localhost:3000/matches
```

**What happens:**
- Each match card shows a "Listen" button
- Click to hear AI explain why you matched
- Audio generated on-demand using ElevenLabs

---

## 📋 Profile Fields Comparison

### ✅ Currently Collected by Voice Agent (6 fields)

| Field | Type | Example | Status |
|-------|------|---------|--------|
| `skills` | string[] | `["React", "TypeScript", "Node.js"]` | ✅ Collected |
| `experience_years` | number | `5` | ✅ Collected |
| `role` | string | `"full-stack developer"` | ✅ Collected |
| `interests` | string[] | `["AI", "fintech", "education"]` | ✅ Collected |
| `availability_hours` | number/string | `10` or `"10-15"` | ✅ Collected |
| `collaboration_style` | string | `"flexible"`, `"sync"`, `"async"` | ✅ Collected |

### ❌ Missing from Voice Agent (13 fields)

#### General Information (5 missing)
| Field | Type | Example | Status |
|-------|------|---------|--------|
| `full_name` | string | `"Alex Johnson"` | ❌ Not collected |
| `headline` | string | `"Full-stack developer"` | ❌ Not collected |
| `about` | string | `"I enjoy building..."` | ❌ Not collected |
| `location` | string | `"Lagos, Remote"` | ❌ Not collected |
| `experience_level` | enum | `"Beginner"`, `"Intermediate"`, `"Advanced"` | ❌ Not collected |

#### Links (2 missing)
| Field | Type | Example | Status |
|-------|------|---------|--------|
| `portfolio_link` | string | `"https://your-portfolio.com"` | ❌ Not collected |
| `github_link` | string | `"https://github.com/username"` | ❌ Not collected |

#### Project Preferences (6 missing)
| Field | Type | Example | Status |
|-------|------|---------|--------|
| `project_types` | string[] | `["SaaS", "hackathon", "open source"]` | ❌ Not collected |
| `preferred_roles` | string[] | `["Frontend", "Backend", "PM"]` | ❌ Not collected |
| `preferred_tech_stack` | string[] | `["React", "Node", "Postgres"]` | ❌ Not collected |
| `time_commitment` | string | `"10 hrs/week"` | ❌ Not collected |
| `timeline_preference` | string | `"1 month"` | ❌ Not collected |
| `project_goals` | string | `"Learn new tech"` | ❌ Not collected |

---

## 🔄 Current Conversation Flow

The voice agent asks **6 questions** in this order:

### Turn 1: Greeting + Skills
**Agent:** "Hi! I'm excited to help you get started on MeshIt. What programming languages or technologies do you work with?"

**User:** "I work with React, TypeScript, and Node.js"

**Extracted:** `skills: ["React", "TypeScript", "Node.js"]`

---

### Turn 2: Experience
**Agent:** "Great! React, TypeScript, and Node.js - that's a solid stack. How many years of professional experience do you have?"

**User:** "I have 5 years of experience"

**Extracted:** `experience_years: 5`, `role: "full-stack developer"` (inferred)

---

### Turn 3: Availability
**Agent:** "Nice! 5 years is great experience. How many hours per week are you looking to contribute to projects?"

**User:** "About 10-15 hours per week"

**Extracted:** `availability_hours: "10-15"`

---

### Turn 4: Interests
**Agent:** "Perfect, 10-15 hours works well for most projects. What kind of projects interest you most?"

**User:** "I'm interested in AI products and voice interfaces"

**Extracted:** `interests: ["AI", "voice interfaces"]`

---

### Turn 5: Collaboration Style
**Agent:** "AI products and voice interfaces - that's exciting! Do you prefer working synchronously with video calls, or asynchronously with messages?"

**User:** "I'm flexible, but prefer async mostly"

**Extracted:** `collaboration_style: "flexible"` or `"asynchronous"`

---

### Turn 6: Completion
**Agent:** "Awesome! I've got everything I need. Your profile is all set - let me show you some matching projects!"

**Action:** Redirects to dashboard after 2 seconds

---

## 🎨 How It Works - Technical Flow

### 1. User Clicks "Voice Onboarding"

```typescript
// Calls: POST /api/voice-agent/start
// Returns: { sessionId, greeting, audio }
```

### 2. Agent Speaks Greeting

```typescript
// Audio auto-plays (base64 encoded MP3)
// User sees greeting text in chat
```

### 3. User Records Response

```typescript
// Web Audio API captures microphone
// Records up to 30 seconds
// Sends audio blob to server
```

### 4. Server Processes Turn

```typescript
// POST /api/voice-agent/turn
// 1. Transcribe audio (Deepgram or Whisper)
// 2. Extract data with Gemini AI
// 3. Generate next question
// 4. Synthesize speech (ElevenLabs)
// Returns: { transcription, extractedData, nextQuestion, audio, completed }
```

### 5. Repeat Until Complete

```typescript
// Conversation continues for 4-5 turns
// When completed: true, calls POST /api/voice-agent/complete
// Returns full profile data
```

---

## 🚀 How to Expand Voice Agent to Collect All Fields

### Option 1: Extend Current Conversation (Recommended)

**Add 3-4 more conversation turns:**

```typescript
// In src/lib/voice/types.ts - Add to ProfileData interface:
export interface ProfileData {
  // Existing fields
  skills: string[];
  experience_years: number;
  interests: string[];
  availability_hours: number | string;
  role: string;
  collaboration_style: string;
  bio?: string;
  
  // NEW: General Information
  full_name: string;
  headline: string;
  about: string;
  location?: string;
  experience_level: 'Beginner' | 'Intermediate' | 'Advanced';
  
  // NEW: Links
  portfolio_link?: string;
  github_link?: string;
  
  // NEW: Project Preferences
  project_types: string[];
  preferred_roles: string[];
  preferred_tech_stack: string[];
  time_commitment: string;
  timeline_preference: string;
}
```

**Update conversation states:**

```typescript
// In src/lib/voice/types.ts - Add new states:
export type ConversationState =
  | 'greeting'
  | 'name_and_headline'     // NEW: Ask for name and headline
  | 'skills'
  | 'experience'
  | 'location_and_level'    // NEW: Ask for location and experience level
  | 'availability'
  | 'interests'
  | 'project_preferences'   // NEW: Ask about project types and roles
  | 'links'                 // NEW: Ask for portfolio/GitHub (optional)
  | 'collaboration'
  | 'complete';
```

**Update prompts in `src/lib/ai/prompts.ts`:**

```typescript
export const STATE_PROMPTS: Record<ConversationState, string> = {
  greeting: `Greet warmly and ask for their full name and what they'd describe themselves as professionally.
Example: "Hi! Welcome to MeshIt. What's your name, and how would you describe yourself professionally?"`,

  name_and_headline: `Extract their name and headline, then ask about technical skills.
Extract: full_name (string), headline (string)
Example: "Nice to meet you, Alex! A full-stack developer - that's great. What technologies do you work with most?"`,

  skills: `Extract skills and ask about experience and location.
Extract: skills (array)
Example: "React, TypeScript, and Node - solid stack! How many years of experience do you have, and where are you based?"`,

  experience: `Extract experience and ask about their experience level.
Extract: experience_years (number), location (string, optional)
Example: "5 years in Lagos - awesome! Would you describe yourself as a beginner, intermediate, or advanced developer?"`,

  location_and_level: `Extract experience level and ask about availability.
Extract: experience_level (enum)
Example: "Intermediate level with 5 years - that makes sense! How many hours per week can you contribute?"`,

  availability: `Extract availability and ask about project interests.
Extract: availability_hours (number/string)
Example: "10-15 hours is perfect for most projects. What types of projects interest you - SaaS, open source, hackathons?"`,

  interests: `Extract interests and ask about preferred roles and tech.
Extract: interests (array), project_types (array)
Example: "AI and fintech - exciting! What roles do you prefer - frontend, backend, full-stack, or something else?"`,

  project_preferences: `Extract preferred roles and tech stack, ask about timeline.
Extract: preferred_roles (array), preferred_tech_stack (array)
Example: "Full-stack with React and Node - great fit! How long are you looking to commit to a project?"`,

  links: `Extract timeline and optionally ask for portfolio/GitHub links.
Extract: timeline_preference (string), time_commitment (string)
Example: "1-2 months is a good timeline. Do you have a portfolio or GitHub you'd like to share? (Optional - you can say 'skip')"`,

  collaboration: `Extract links (if provided) and ask about collaboration style.
Extract: portfolio_link (optional), github_link (optional)
Example: "Thanks! Last question - do you prefer working sync with video calls, or async with messages?"`,

  complete: `Extract collaboration style and confirm completion.
Extract: collaboration_style (string)
Example: "Perfect! Your profile is all set. Let me find some great projects for you!"`,
};
```

**Result:** Voice conversation becomes 8-10 turns instead of 5-6, collecting all fields naturally.

---

### Option 2: Hybrid Approach (Faster)

**Voice collects core info (current 6 fields), then:**

1. Show a **profile preview** with what was collected
2. Display a **quick form** to fill in missing fields:
   - Name and headline (required)
   - Location (optional)
   - Portfolio/GitHub links (optional)
   - Project preferences (checkboxes)

**Implementation:**

```typescript
// In src/app/(dashboard)/onboarding/voice/page.tsx
// After voice completes, instead of redirecting to dashboard:

if (data.completed) {
  // Don't redirect yet
  setMode('review'); // New mode
  setProfileData(data.profile);
}

// Add new "review" mode that shows:
if (mode === 'review') {
  return (
    <ProfileReviewForm
      voiceData={profileData}
      onComplete={(fullProfile) => {
        // Save to Supabase
        // Then redirect to dashboard
      }}
    />
  );
}
```

**Pros:**
- Faster voice conversation (keeps it under 5 minutes)
- User can skip optional fields easily
- Better for links (typing URLs is easier than speaking them)

**Cons:**
- Not fully voice-based
- Requires building the review form

---

### Option 3: Voice + Auto-Fill from GitHub (Smart)

**Voice collects:**
- Name, skills, experience, interests, availability, collaboration style

**Then auto-fetch from GitHub API:**
- Portfolio link (from GitHub profile)
- Location (from GitHub profile)
- Bio/About (from GitHub bio)
- Preferred tech stack (from most-used languages)
- Experience level (inferred from account age + contributions)

**Implementation:**

```typescript
// After voice completes:
const githubData = await fetchGitHubProfile(username);

const fullProfile = {
  ...voiceCollectedData,
  location: githubData.location || voiceCollectedData.location,
  about: githubData.bio || '',
  portfolio_link: githubData.blog || '',
  github_link: githubData.html_url,
  preferred_tech_stack: githubData.topLanguages, // From repos
};
```

**Pros:**
- Minimal user effort
- Rich profile data automatically
- Validates GitHub username

**Cons:**
- Requires GitHub OAuth or username
- Not all users have GitHub profiles

---

## 📊 Recommended Approach

### **Hybrid Voice + Smart Form** (Best UX)

1. **Voice conversation (5 turns, ~3 minutes):**
   - Name + headline
   - Skills + experience years
   - Availability + interests
   - Collaboration style

2. **Smart profile review form (1 minute):**
   - Auto-filled with voice data
   - User adds:
     - Location (dropdown + search)
     - Experience level (3 buttons: Beginner/Intermediate/Advanced)
     - Portfolio/GitHub links (optional text inputs)
     - Project preferences (multi-select checkboxes)
     - Timeline preference (dropdown: 1 week, 1 month, 3 months, 6+ months)

3. **GitHub integration (optional):**
   - "Import from GitHub" button
   - Auto-fills tech stack, location, bio, links

**Total time:** 4-5 minutes for complete profile

---

## 🎯 Next Steps to Implement Full Profile Collection

### Step 1: Update Type Definitions
```bash
# Edit: src/lib/voice/types.ts
# Add all 13 missing fields to ProfileData interface
```

### Step 2: Extend Conversation States
```bash
# Edit: src/lib/voice/types.ts
# Add 3-4 new states for additional questions
```

### Step 3: Update Prompts
```bash
# Edit: src/lib/ai/prompts.ts
# Add prompts for new states
# Update STATE_PROMPTS with new questions
```

### Step 4: Create Profile Review Component
```bash
# Create: src/components/onboarding/profile-review-form.tsx
# Shows voice-collected data + form for missing fields
```

### Step 5: Update Voice Onboarding Page
```bash
# Edit: src/app/(dashboard)/onboarding/voice/page.tsx
# Add 'review' mode after voice completes
# Integrate ProfileReviewForm component
```

### Step 6: Add GitHub Integration (Optional)
```bash
# Create: src/lib/github/profile-fetcher.ts
# Fetch user data from GitHub API
# Auto-fill missing profile fields
```

### Step 7: Save to Supabase
```bash
# Create: src/lib/supabase/profiles.ts
# Function to save complete profile
# Handle user_id, timestamps, validation
```

---

## 🧪 Testing Checklist

### Voice Onboarding
- [ ] Navigate to `/onboarding/voice`
- [ ] Click "Voice Onboarding"
- [ ] Allow microphone permission
- [ ] Hear agent greeting with voice
- [ ] Record response (speak clearly)
- [ ] See transcription appear
- [ ] Hear agent's next question
- [ ] Complete 5-turn conversation
- [ ] See profile preview with extracted data
- [ ] Verify all 6 current fields collected correctly

### Match Audio
- [ ] Navigate to `/matches`
- [ ] See "Listen" button on match cards
- [ ] Click "Listen"
- [ ] Hear audio explanation
- [ ] Verify play/pause works
- [ ] Check loading and error states

---

## 💡 Pro Tips

### For Best Voice Recognition
1. **Speak clearly** and at normal pace
2. **Use full sentences** (not just keywords)
3. **Pause briefly** between thoughts
4. **Avoid background noise** (close windows, mute music)
5. **Use good microphone** (built-in laptop mic works, but headset is better)

### For Natural Conversation
1. **Be conversational** - "I work with React and TypeScript for about 5 years"
2. **Provide context** - "I'm interested in AI and fintech projects"
3. **Ask for clarification** - "Can you repeat that?" works!
4. **Correct mistakes** - "Actually, I meant 10 hours, not 15"

---

## 🔧 Troubleshooting

### "Microphone permission denied"
**Solution:** Click the "Try Again" button, or manually enable microphone in browser settings

### "Failed to start conversation"
**Solution:** Check that your API keys are set in `.env` (OpenAI, Deepgram, ElevenLabs, Google)

### "No audio playing"
**Solution:** Check browser audio isn't muted, verify ElevenLabs API key is valid

### "Transcription is wrong"
**Solution:** Speak more clearly, reduce background noise, or try Whisper provider (set `PRIMARY_STT_PROVIDER=whisper`)

---

## 📞 Support

**Documentation:**
- Full guide: `docs/VOICE_AGENT.md`
- Quick start: `docs/VOICE_AGENT_QUICK_START.md`
- Implementation summary: `docs/VOICE_AGENT_IMPLEMENTATION_SUMMARY.md`

**API Endpoints:**
- `POST /api/voice-agent/start` - Start conversation
- `POST /api/voice-agent/turn` - Process user turn
- `POST /api/voice-agent/complete` - Finish onboarding
- `POST /api/voice/transcribe` - Transcribe audio
- `POST /api/voice/synthesize` - Generate speech

---

**Status: Voice agent is working! Just needs expansion to collect all 19 profile fields instead of current 6.** ✅
