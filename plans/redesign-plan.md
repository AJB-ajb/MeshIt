# MeshIt Application Redesign Plan

## Context

MeshIt is being redesigned from a **developer-project matching platform** (two personas: developer vs project owner) to an **idea-based social platform** for quickly finding people to do things with — projects, activities, and spontaneous plans are all first-class.

### Reference Documents
- `spec/Mesh.md` — product spec (updated)
- `spec/Matching.md` — matching algorithm spec (updated, simplified)
- `spec/UseCases.md` — use cases and example postings

### Key Spec Changes
- "Project" is now "Posting" — a posting can be a project, activity, or social plan
- No more developer vs project-owner personas — everyone is both a poster and a responder
- Primary scope: small groups (2-5), especially pairs
- Social activities (concerts, sports, spontaneous plans) elevated to first-class
- **Friend-ask mode**: select and order friends, send sequential requests until one accepts
- **Open mode**: browse postings, express interest, poster reviews
- Matching simplified from 6 dimensions (weighted geometric mean) to 4 dimensions (weighted average)
- Person dimensions reduced to 3 core: Skill Level, Location Mode, Availability
- Location mode simplified from 0-100% slider to 3-way enum (remote / in-person / either)
- Availability simplified from numeric hours to binary time slots (weekly patterns + specific blocks)

---

## Current Code Quality Issues

These problems exist in the current codebase and should be fixed during or after the redesign.

### 1. API routes return HTTP 200 with error bodies
All routes under `src/app/api/matches/` return `NextResponse.json({ error: ... }, { status: 200 })` instead of proper HTTP status codes (404, 422, etc.). The codebase already has `apiError()` and `apiSuccess()` helpers in `src/lib/errors.ts` but they are not used consistently.

**Files to audit:**
- `src/app/api/matches/for-me/route.ts`
- `src/app/api/matches/for-project/[id]/route.ts`
- `src/app/api/matches/[id]/accept/route.ts`
- `src/app/api/matches/[id]/apply/route.ts`
- `src/app/api/matches/[id]/decline/route.ts`
- `src/app/api/extract/project/route.ts`
- `src/app/api/profile/save/route.ts`
- `src/app/api/github/sync/route.ts`

### 2. No retry logic for AI API calls
Raw `fetch()` calls to OpenAI and Gemini APIs with no retries on failure.

**Files:**
- `src/lib/matching/explanation.ts` (Gemini API, lines 68-94)
- `src/lib/ai/embeddings.ts` (OpenAI API)
- `src/app/api/extract/project/route.ts` (OpenAI API, lines 94-134)
- `src/app/api/extract/profile/route.ts`

**Fix:** Create `src/lib/ai/fetch-with-retry.ts` with exponential backoff (3 retries, 1s base backoff). Use it in all AI fetch calls.

### 3. No rate limiting on AI endpoints
No protection against excessive AI API calls from rapid user requests.

**Fix:** Create `src/lib/api/rate-limit.ts` (in-memory token bucket or Vercel rate limiting). Apply to `/api/extract/*` and `/api/matches/for-me`.

### 4. N+1 query pattern in matching
Individual `supabase.rpc("compute_match_breakdown")` calls per match result, wrapped in `Promise.all`. For 10 matches this means 10 separate RPC calls.

**Files:**
- `src/lib/matching/profile-to-project.ts` (lines 95-145)
- `src/lib/matching/project-to-profile.ts` (lines 95-151)

**Fix:** Create batch RPC `compute_match_breakdowns_batch()` or compute breakdowns in the application layer using already-fetched data instead of N individual RPC calls.

### 5. Near-duplicate matching files
`src/lib/matching/profile-to-project.ts` (149 lines) and `src/lib/matching/project-to-profile.ts` (210 lines) share ~80% identical logic. They should be merged into a single generic function parameterized by direction.

### 6. `.env.example` references NextAuth.js
`.env.example` includes `NEXTAUTH_SECRET` and `NEXTAUTH_URL` but the codebase uses Supabase Auth. Missing required variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_AI_API_KEY`.

### 7. No unit tests
Vitest is configured (`vitest.config.ts`) but there are zero unit tests in `src/`. Only Playwright E2E tests exist in `tests/`.

**Priority test targets after redesign:**
- `src/lib/matching/scoring.ts` — weighted average computation, edge cases
- `src/lib/matching/similarity.ts` — haversine, cosine similarity
- New availability/skill/location score functions
- `src/lib/errors.ts` — apiError/apiSuccess helpers

### 8. Missing input validation
- Location coordinates not range-checked (lat should be [-90,90], lng [-180,180])
- Embedding dimensions not asserted (should be 1536)
- Weights not validated (all >= 0, at least one > 0)
- `parseList()` in `src/lib/types/profile.ts` is naive — splits by comma without handling quoted values

### 9. Loose typing
`(row: any)` casts in matching RPC handlers, `(app: any)` / `(match: any)` / `(msg: any)` in `src/app/(dashboard)/dashboard/page.tsx`.

**Fix:** Define RPC return types in `src/lib/supabase/rpc-types.ts`. Replace all `any` casts.

### 10. No structured logging
Scattered `console.log` / `console.error` calls with no consistent format. Should have structured JSON logging with timestamp, level, and context.

### 11. Constants scattered
Magic numbers and config values scattered across `src/lib/constants.ts` and hardcoded in various files. Should be centralized under namespaced objects.

### 12. No Suspense/Error boundaries
No React Suspense or Error Boundary components wrapping dashboard pages.

---

## Phase 1: Data Model & Schema

**Goal:** Update the database schema and TypeScript types to match the new spec. This unblocks all other phases.

### 1.1 Update TypeScript types

**File:** `src/lib/supabase/types.ts`

**Rename `Project` interface to `Posting`** with these field changes:

| Action | Field | Details |
|--------|-------|---------|
| Add | `category` | `'study' \| 'hackathon' \| 'personal' \| 'professional' \| 'social' \| null` |
| Add | `context_identifier` | `string \| null` — e.g., hackathon name, course code |
| Add | `tags` | `string[]` — free-form tags for semantic matching |
| Add | `capacity` | `number` — how many people needed (default 1) |
| Add | `mode` | `'open' \| 'friend_ask'` |
| Add | `location_mode` | `'remote' \| 'in_person' \| 'either' \| null` |
| Add | `natural_language_criteria` | `string \| null` |
| Add | `estimated_time` | `string \| null` — free-form: "2 hours", "10-20h/week" |
| Add | `skill_level_min` | `number \| null` — 0-10, optional |
| Rename | `required_skills` → `skills` | `string[]` |
| Remove | `team_size` | Replaced by `capacity` |
| Remove | `commitment_hours` | Replaced by `estimated_time` |
| Remove | `timeline` | Replaced by `expires_at` (already exists) |
| Remove | `experience_level` | Replaced by `skill_level_min` |
| Add status | `'paused'` | To existing status union |

**Update `ScoreBreakdown`** from 6 to 4 dimensions:
```typescript
interface ScoreBreakdown {
  semantic: number;       // pgvector cosine similarity (0-1)
  availability: number;   // time slot overlap fraction (0-1)
  skill_level: number;    // 1 - |levelA - levelB| / 10 (0-1)
  location: number;       // 1.0 compatible, 0.5 partial, 0.0 incompatible
}
```

Remove: `skills_overlap`, `experience_match`, `commitment_match`, `filter_match`.

**Update `Match`:** rename `project_id` → `posting_id`, add `'interested'` to status union.

**Update `Profile`:**

| Action | Field | Details |
|--------|-------|---------|
| Add | `skill_levels` | `Json` — `{ "programming": 7, "design": 3 }` domain→0-10 |
| Add | `location_mode` | `'remote' \| 'in_person' \| 'either'` |
| Add | `availability_slots` | `Json` — weekly patterns + specific date blocks, binary |
| Deprecate | `experience_level` | Keep column, replaced by `skill_levels` |
| Deprecate | `remote_preference` | Keep column, replaced by `location_mode` |
| Deprecate | `availability_hours` | Keep column, replaced by `availability_slots` |
| Rename | `project_preferences` | → `posting_preferences` |

**Add new types:**
```typescript
interface FriendAsk {
  id: string;
  posting_id: string;
  target_user_id: string;
  ask_order: number;
  status: 'pending' | 'sent' | 'accepted' | 'declined' | 'expired';
  sent_at: string | null;
  responded_at: string | null;
  created_at: string;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}
```

**Update joined types:** `MatchWithProject` → `MatchWithPosting`, `MatchResponse.project` → `MatchResponse.posting`.

Also create `PostingInsert`, `PostingUpdate`, `FriendAskInsert`, `FriendshipInsert` types.

### 1.2 Database migrations

**New file:** `supabase/migrations/YYYYMMDD_redesign_postings.sql`

```sql
-- Rename projects → postings
ALTER TABLE public.projects RENAME TO postings;

-- Add new columns
ALTER TABLE public.postings
  ADD COLUMN category text CHECK (category IN ('study','hackathon','personal','professional','social')),
  ADD COLUMN context_identifier text,
  ADD COLUMN tags text[] DEFAULT '{}',
  ADD COLUMN capacity integer DEFAULT 1,
  ADD COLUMN mode text DEFAULT 'open' CHECK (mode IN ('open','friend_ask')),
  ADD COLUMN location_mode text CHECK (location_mode IN ('remote','in_person','either')),
  ADD COLUMN natural_language_criteria text,
  ADD COLUMN estimated_time text,
  ADD COLUMN skill_level_min integer CHECK (skill_level_min >= 0 AND skill_level_min <= 10);

-- Migrate data from old columns
UPDATE public.postings SET capacity = team_size WHERE team_size IS NOT NULL;
UPDATE public.postings SET estimated_time = commitment_hours::text || ' hrs/week' WHERE commitment_hours IS NOT NULL;

-- Drop old columns (or keep for rollback safety)
ALTER TABLE public.postings DROP COLUMN IF EXISTS team_size;
ALTER TABLE public.postings DROP COLUMN IF EXISTS commitment_hours;
ALTER TABLE public.postings DROP COLUMN IF EXISTS timeline;

-- Rename required_skills → skills
ALTER TABLE public.postings RENAME COLUMN required_skills TO skills;

-- Update status check
ALTER TABLE public.postings DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.postings ADD CONSTRAINT postings_status_check
  CHECK (status IN ('open','closed','filled','expired','paused'));

-- Rename matches.project_id → posting_id
ALTER TABLE public.matches RENAME COLUMN project_id TO posting_id;

-- Add profile columns
ALTER TABLE public.profiles
  ADD COLUMN skill_levels jsonb DEFAULT '{}',
  ADD COLUMN location_mode text DEFAULT 'either' CHECK (location_mode IN ('remote','in_person','either')),
  ADD COLUMN availability_slots jsonb;

-- Create friend_asks table
CREATE TABLE public.friend_asks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id uuid REFERENCES public.postings(id) ON DELETE CASCADE NOT NULL,
  target_user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  ask_order integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','sent','accepted','declined','expired')),
  sent_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(posting_id, target_user_id)
);

-- Create friendships table
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  friend_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- RLS policies for new tables
ALTER TABLE public.friend_asks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- friend_asks: users can see asks targeting them or asks on their postings
CREATE POLICY "Users can view their own friend asks" ON public.friend_asks
  FOR SELECT USING (
    target_user_id = auth.uid() OR
    posting_id IN (SELECT id FROM public.postings WHERE creator_id = auth.uid())
  );

CREATE POLICY "Posting creators can insert friend asks" ON public.friend_asks
  FOR INSERT WITH CHECK (
    posting_id IN (SELECT id FROM public.postings WHERE creator_id = auth.uid())
  );

CREATE POLICY "Target users can update friend ask status" ON public.friend_asks
  FOR UPDATE USING (target_user_id = auth.uid());

-- friendships: users can see their own friendships
CREATE POLICY "Users can view own friendships" ON public.friendships
  FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can create friendships" ON public.friendships
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own friendships" ON public.friendships
  FOR UPDATE USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Indexes
CREATE INDEX idx_friend_asks_posting ON public.friend_asks(posting_id);
CREATE INDEX idx_friend_asks_target ON public.friend_asks(target_user_id);
CREATE INDEX idx_friendships_user ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend ON public.friendships(friend_id);
CREATE INDEX idx_postings_category ON public.postings(category);
CREATE INDEX idx_postings_mode ON public.postings(mode);
CREATE INDEX idx_postings_expires ON public.postings(expires_at);
```

### 1.3 Update RPC functions

**New file:** `supabase/migrations/YYYYMMDD_update_matching_rpcs.sql`

- Rename `match_projects_to_user()` → `match_postings_to_user()` — pgvector similarity against postings table
- Rename `match_users_to_project()` → `match_users_to_posting()` — pgvector similarity against profiles
- Update `compute_match_breakdown()` to return 4 dimensions: `semantic`, `availability`, `skill_level`, `location`
- Add `compute_match_breakdowns_batch(user_ids uuid[], posting_id uuid)` for batch scoring
- Rename `expire_old_projects()` → `expire_old_postings()`

---

## Phase 2: Matching Algorithm

**Goal:** Simplify the matching engine from 6-dimension geometric mean to 4-dimension weighted average.

### 2.1 Rewrite scoring

**File:** `src/lib/matching/scoring.ts`

Replace `DimensionWeights` interface (6 fields → 4):
```typescript
export interface DimensionWeights {
  semantic: number;      // default 1.0
  availability: number;  // default 1.0
  skill_level: number;   // default 0.7
  location: number;      // default 0.7
}
```

Replace `computeWeightedScore()` — change from geometric mean to weighted average:
```typescript
// NEW: score = Σ(sᵢ × wᵢ) / Σwᵢ
export function computeWeightedScore(
  breakdown: ScoreBreakdown,
  weights: DimensionWeights = DEFAULT_WEIGHTS
): number {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const score = breakdown[key as keyof ScoreBreakdown];
    if (score !== undefined && weight > 0) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
```

Remove: `LEGACY_WEIGHTS`, `calculateFilterScore()`.
Keep: `formatScore()`, `getScoreColorVariant()`, `calculateDistance()`, `normalizeWeights()`.

### 2.2 New per-dimension score functions

Add to `src/lib/matching/scoring.ts`:

**Availability:**
```typescript
export function calculateAvailabilityScore(
  personSlots: AvailabilitySlots | null,
  postingTime: { weekly?: WeekSlot[]; blocks?: BlockSlot[] } | null
): number {
  // If posting has no time requirement, return 1.0
  // Otherwise: count matching slots / total requested slots
  // Binary overlap check per slot
}
```

**Skill level:**
```typescript
export function calculateSkillLevelScore(
  personLevels: Record<string, number> | null,
  postingSkillMin: number | null,
  postingSkills: string[]
): number {
  // If posting has no skill requirement, return 1.0
  // Match person's skill level in relevant domains against posting minimum
  // Score: 1 - |personLevel - postingMin| / 10 (clamped to 0)
}
```

**Location:**
```typescript
export function calculateLocationScore(
  personMode: 'remote' | 'in_person' | 'either' | null,
  postingMode: 'remote' | 'in_person' | 'either' | null
): number {
  // Both null or either is 'either': 1.0
  // One is 'either': 1.0
  // Both same specific mode: 1.0
  // Mismatched (remote vs in_person): 0.0
}
```

### 2.3 Merge duplicate matching files

**Delete:** `src/lib/matching/profile-to-project.ts`, `src/lib/matching/project-to-profile.ts`

**Create:** `src/lib/matching/match.ts`

```typescript
type MatchDirection = 'postings_for_user' | 'users_for_posting';

export async function findMatches(
  direction: MatchDirection,
  sourceId: string,
  limit: number = 10
): Promise<MatchResponse[]> {
  // 1. Fetch source entity + embedding
  // 2. Generate embedding if missing
  // 3. Call appropriate RPC (match_postings_to_user or match_users_to_posting)
  // 4. Check for existing match records
  // 5. Batch-compute score breakdowns
  // 6. Return MatchResponse[]
}
```

### 2.4 Update match explanation

**File:** `src/lib/matching/explanation.ts`

- Update Gemini prompt to reference the 4 new dimensions (Relevance, Availability, Skill Match, Location) instead of the old 6
- Wrap fetch call in retry logic

### 2.5 Update matching index

**File:** `src/lib/matching/index.ts`

Update exports to reflect new file structure (export from `match.ts` instead of the two deleted files).

---

## Phase 3: Terminology & Routing

**Goal:** Rename "project" to "posting" throughout and remove the developer/project-owner persona split.

### 3.1 Remove persona split

**`src/app/(auth)/onboarding/page.tsx`:**
- Remove the "I'm a developer" vs "I'm looking for developers" selection
- Redirect directly to profile setup page

**`src/app/(auth)/onboarding/developer/page.tsx`:**
- Rename file to `src/app/(auth)/onboarding/profile/page.tsx`
- Remove developer-specific framing in copy and field labels
- Simplify to: name, bio (text/paste/AI extract), optional location, skills, availability

**`src/app/(dashboard)/dashboard/page.tsx`:**
- Remove the `persona` variable and the `if (persona === 'developer')` / `else` branching
- Remove `fetchOwnerStats()` and `fetchDeveloperStats()` — create single `fetchStats()`
- Create unified dashboard view (see Phase 5.5)

**`src/components/dashboard/quick-actions.tsx`:**
- Remove persona-conditional rendering

### 3.2 File renames (project → posting)

| Old Path | New Path |
|----------|----------|
| `src/app/(dashboard)/projects/page.tsx` | `src/app/(dashboard)/postings/page.tsx` |
| `src/app/(dashboard)/projects/new/page.tsx` | `src/app/(dashboard)/postings/new/page.tsx` |
| `src/app/(dashboard)/projects/[id]/page.tsx` | `src/app/(dashboard)/postings/[id]/page.tsx` |
| `src/app/api/matches/for-project/[id]/route.ts` | `src/app/api/matches/for-posting/[id]/route.ts` |
| `src/app/api/extract/project/route.ts` | `src/app/api/extract/posting/route.ts` |
| `src/components/project/project-card.tsx` | `src/components/posting/posting-card.tsx` |
| `src/components/project/index.ts` | `src/components/posting/index.ts` |
| `src/components/dashboard/recommended-projects.tsx` | `src/components/dashboard/recommended-postings.tsx` |
| `src/components/dashboard/project-performance.tsx` | `src/components/dashboard/posting-performance.tsx` |

### 3.3 Update all imports and references

Search-and-replace across codebase:
- `Project` type → `Posting` type
- `project_id` → `posting_id`
- `project` variable names → `posting`
- `projects` table references → `postings`
- Route paths: `/projects` → `/postings`

### 3.4 Update navigation

**File:** `src/components/layout/sidebar.tsx`

- "Projects" nav item → "Browse" (links to `/postings`)
- Add "Create" nav item linking to `/postings/new`
- "New Project" button → "New Posting"

### 3.5 Update all UI copy

Search all `.tsx` files for user-facing strings containing "project":
- "Find your perfect project match" → "Find people to do things with"
- "Create project" → "Create posting"
- "No projects found" → "No postings found"
- All button labels, headings, descriptions, empty states, toast messages

---

## Phase 4: Core Features

**Goal:** Implement the new features from the updated spec.

### 4.1 Friend-Ask Mode

**New files to create:**

API routes:
- `src/app/api/friend-ask/route.ts` — Create/list friend-ask sequences for a posting
- `src/app/api/friend-ask/[id]/send/route.ts` — Send the next ask in sequence
- `src/app/api/friend-ask/[id]/respond/route.ts` — Accept or decline (target user)

Components:
- `src/components/posting/friend-ask-selector.tsx` — UI to select friends and drag-to-order them
- `src/components/posting/friend-ask-status.tsx` — Progress display ("Asked 2 of 5, waiting on Alice")

Hook:
- `src/lib/hooks/use-friend-ask.ts` — Client-side state for friend-ask flow

**Workflow:**
1. Creator creates posting with `mode: 'friend_ask'`
2. Creator selects friends from `friendships` table, drags to set order
3. System stores ordered list in `friend_asks` table
4. On "Start asking", sets `friend_asks[order=1].status = 'sent'` and sends notification
5. If target declines or times out (24h), auto-advance to next friend
6. If target accepts, set posting `status = 'filled'`
7. UI shows progress: current ask, queue remaining, responses received

**Integration:** In posting creation form (`src/app/(dashboard)/postings/new/page.tsx`), add mode toggle. When "Ask Friends" is selected, show friend-ask-selector instead of the standard open-mode fields.

### 4.2 Friendships

**New files:**
- `src/app/api/friendships/route.ts` — List friends, send friend request
- `src/app/api/friendships/[id]/route.ts` — Accept/decline/block
- `src/lib/hooks/use-friendships.ts` — Client hook
- `src/components/friends/friend-list.tsx` — Friend list component

### 4.3 Posting Expiry & Urgency

**File:** `src/components/posting/posting-card.tsx` (renamed from project-card)

Add urgency badge based on `expires_at`:
- Red badge: < 24 hours remaining
- Orange badge: < 3 days remaining
- Yellow badge: < 7 days remaining
- No badge: > 7 days or no expiry

**File:** `src/app/(dashboard)/postings/new/page.tsx`

Add explicit expiry date picker (currently `expires_at` is computed from timeline, should be user-editable).

**New file:** `src/app/api/postings/[id]/reactivate/route.ts`

Sets new `expires_at` and status back to `'open'` on expired postings.

**Infrastructure:** Set up Supabase cron job or Edge Function to call `expire_old_postings()` periodically (e.g., every hour).

### 4.4 Capacity & Auto-Fill

**File:** `src/app/(dashboard)/postings/new/page.tsx`

Replace "Team Size" dropdown with "Looking for" number input (1-10, default 1).

**File:** `src/app/api/matches/[id]/accept/route.ts`

After accepting a match, check if accepted count >= posting capacity. If so, auto-set posting status to `'filled'`.

### 4.5 Express Interest (Open Mode)

**File:** `src/components/posting/posting-card.tsx`

Add "I'm Interested" button on posting cards where `mode === 'open'`.

**File:** `src/app/api/matches/interest/route.ts` (new)

Creates a match record with `status: 'interested'` linking the current user to the posting.

**File:** `src/app/(dashboard)/matches/page.tsx`

Show both computed matches and expressed interests, with clear visual distinction.

### 4.6 Category Filtering

**File:** `src/app/(dashboard)/postings/page.tsx`

Add category chips/tabs at the top of the browse page: All, Study, Hackathon, Personal, Professional, Social. Clicking a chip filters postings by that category.

---

## Phase 5: UI/UX Updates

**Goal:** Update all user-facing interfaces to match the new platform direction.

### 5.1 Landing page

**File:** `src/app/page.tsx`

- Rewrite hero: general "Find people to do things with" messaging
- Update feature highlights to include social activities alongside projects
- Update the 3-step process description
- Include diverse example use cases (hackathon, tennis, concert, study group)

### 5.2 Onboarding simplification

**Flow:** Login (OAuth) → Profile setup → Dashboard

**File:** `src/app/(auth)/onboarding/profile/page.tsx` (renamed from developer)

Simplified form:
- Name, headline, bio (text input or paste for AI extraction)
- Location (optional)
- Skills with level sliders (optional)
- Availability slots (optional)
- "Skip for now" option on everything except name

**File:** `src/lib/ai/prompts.ts`

Update AI extraction prompts from developer-centric language to general profile language.

### 5.3 Profile form simplification

**File:** `src/components/profile/profile-form.tsx`

| Current Field | Action |
|--------------|--------|
| Experience Level dropdown (junior/intermediate/senior/lead) | Replace with domain-specific 0-10 skill sliders |
| Collaboration Style dropdown (sync/async/hybrid) | Demote to optional/advanced section |
| Remote Preference slider (0-100) | Replace with Location Mode toggle (Remote / In-person / Either) |
| Availability (hrs/week) number | Replace with availability slot picker (weekly patterns + date blocks) |
| Project Preferences card (types, roles, stack, commitment, timeline) | Remove entirely |
| Match Filters card (distance, languages, min/max hours) | Simplify to distance and language only |

**New UI components needed:**
- Skill level slider group (domain name + 0-10 slider, add/remove domains)
- Availability slot picker (day-of-week + time range, add/remove; date picker for blocks)
- Location mode toggle (3 options with icons)

### 5.4 Posting creation form

**File:** `src/app/(dashboard)/postings/new/page.tsx`

| Field | Status |
|-------|--------|
| Title | Keep |
| Description | Keep |
| AI extraction (paste from Slack/WhatsApp) | Keep |
| Category selector (chips) | Add |
| Mode toggle (Open / Ask Friends) | Add |
| Capacity number (default 1) | Add (replaces Team Size) |
| Expiry date picker | Add (make explicit) |
| Location mode toggle | Add |
| Context identifier (text, optional) | Add |
| Tags (text input, optional) | Add |
| Skill level requirement (0-10 slider, optional) | Add |
| Estimated time (free text, optional) | Add |
| Collaboration style (optional) | Add (demoted) |
| Team Size dropdown | Remove |
| Time Commitment dropdown | Remove |
| Experience Level Needed dropdown | Remove |

### 5.5 Dashboard unification

**File:** `src/app/(dashboard)/dashboard/page.tsx`

Single dashboard for all users (no persona branching):

- **Stats row:** Active Postings, Interests Received, Your Applications, Conversations
- **Quick actions:** Create Posting, Browse Postings
- **Your Active Postings:** List of user's open postings with interest/application counts
- **Friend-Ask Requests:** Incoming friend-ask requests to respond to
- **Recommended Postings:** Top AI-matched postings for the user
- **Recent Activity:** Latest interests, accepts, messages

### 5.6 Match breakdown

**File:** `src/components/match/match-breakdown.tsx`

Update from 6 dimensions to 4:

| Dimension Key | Display Label | Description |
|--------------|---------------|-------------|
| `semantic` | Relevance | How well your profile aligns with this posting |
| `availability` | Availability | Time slot overlap |
| `skill_level` | Skill Match | Skill level compatibility |
| `location` | Location | Location preference compatibility |

### 5.7 Posting card

**File:** `src/components/posting/posting-card.tsx`

Display fields:
- Title, description (truncated), creator name
- Category badge
- Urgency indicator (color-coded by time remaining)
- Capacity: "Looking for 1 person" / "Looking for 3 people (1 spot left)"
- Location mode icon (remote/in-person/either)
- Estimated time (if set)
- Skills tags
- "Express Interest" button (open mode) or "Friend-Ask in Progress" indicator

Remove: team size display, timeline display, commitment hours display.

---

## Implementation Order

```
Phase 1.1 (TypeScript types)     ← START HERE, unblocks everything
    ↓
Phase 1.2-1.3 (DB migrations)   ← Deploy schema changes
    ↓
Phase 2 (Matching algorithm)     ← Can parallel with Phase 3
    ↓
Phase 3 (Terminology renames)    ← Large but mechanical
    ↓
Phase 4 (New features)           ← Substantive new work
    ↓
Phase 5 (UI updates)             ← Polish and integrate
    ↓
Phase 6 (Code quality)           ← Incremental throughout all phases
```

Phase 6 items (error codes, retry logic, validation, tests) can and should be addressed incrementally during any phase rather than saved for the end.

## Verification

After each phase:
- `pnpm build` — catch type errors and broken imports
- `pnpm test` — run Playwright E2E tests (after Phases 3 and 5)

End-to-end manual testing:
- Create a posting in open mode, browse it from another account, express interest, accept
- Create a posting in friend-ask mode, select friends, send sequential asks, accept
- Verify urgency badges appear correctly based on expiry dates
- Verify all UI copy says "posting" not "project"
- Verify every example from `spec/UseCases.md` can be represented in the posting creation form
- Verify match breakdown shows 4 dimensions with correct scores
