# MeshIt Refactoring — Session Context

## Project Overview

Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, shadcn/ui, Supabase (auth + PostgreSQL + pgvector), pnpm 10.28.1. AI services: OpenAI GPT-4o-mini, Google Gemini 2.0 Flash, ElevenLabs TTS, LiveKit voice/video.

## Branch: `newmain`

All refactoring work goes to `newmain` (not `main`). Current state: 148 tests, all passing.

## 6-Phase Plan

Full plan at: `.claude/plans/vectorized-frolicking-parnas.md` (relative to home dir `~/.claude/plans/`)

### Phase 6: CI/CD Pipeline — COMPLETED
- `.github/workflows/ci.yml` — 5 parallel jobs (lint, typecheck, unit-tests, e2e-tests, build)
- `tests/e2e/navigation.spec.ts` — 9 E2E tests
- `.gitignore` fix: changed `.github*` to `.github_copilot*`
- `package.json`: added `test:ci` and `test:e2e:ci` scripts
- Fixed 3 pre-existing test failures (voice-agent-api, voice-agent, matching tests)

### Phase 1: Foundation — COMPLETED
- `src/lib/format.ts` — `formatDate()`, `formatTimeAgo()`, `getInitials()` (extracted from dashboard pages)
- `src/lib/errors.ts` — `AppError`, `apiError()`, `apiSuccess()`, `ErrorCode` type
- `src/lib/constants.ts` — `PRODUCTION_URL`, `VOICE`, `AI_MODELS`, `PAGINATION`
- Updated `src/lib/environment.ts` to import from constants
- Replaced local `getInitials` in 5 dashboard pages, `formatDate`/`formatTimeAgo` in dashboard/page.tsx
- Tests: `format.test.ts` (14), `errors.test.ts` (6), `environment.test.ts` (6)

### Phase 2: Auth Middleware — COMPLETED
- `src/lib/api/with-auth.ts` — HOF wrapping route handlers with auth check, provides `{ user, supabase, params }`
- Refactored all 6 match API routes to use `withAuth`:
  - `src/app/api/matches/[id]/route.ts`
  - `src/app/api/matches/[id]/apply/route.ts`
  - `src/app/api/matches/[id]/accept/route.ts`
  - `src/app/api/matches/[id]/decline/route.ts`
  - `src/app/api/matches/for-me/route.ts`
  - `src/app/api/matches/for-project/[id]/route.ts`
- Tests: `with-auth.test.ts` (6)
- Note: `match-service.ts` extraction was deferred; routes still contain business logic inline.

### Phase 3: Custom Hooks & Page Decomposition (Dashboard + Profile) — COMPLETED
**Goal**: Break the two largest pages into composed components with data-fetching hooks.

#### Profile Page (1679 → ~120 lines)
- Types extracted to `src/lib/types/profile.ts` (`ProfileFormState`, `GitHubSyncStatus`, `defaultFormState`, `parseList`)
- Hooks:
  - `src/lib/hooks/use-profile.ts` — form state, loading/saving, data fetching, submit, provider linking
  - `src/lib/hooks/use-github-sync.ts` — sync status, trigger sync, apply AI suggestions
  - `src/lib/hooks/use-location.ts` — geolocation, autocomplete toggle, location selection
- Components:
  - `src/components/profile/profile-form.tsx` — edit mode form (general info, preferences, filters)
  - `src/components/profile/profile-view.tsx` — read-only view mode
  - `src/components/profile/github-integration-card.tsx` — GitHub enrichment card with AI suggestions
  - `src/components/profile/integrations-section.tsx` — OAuth provider connection list (edit + view modes)

#### Dashboard Page (905 → ~510 lines page + 4 components)
- Components:
  - `src/components/dashboard/stats-overview.tsx` — stats grid with linked cards
  - `src/components/dashboard/quick-actions.tsx` — persona-aware quick action buttons
  - `src/components/dashboard/recommended-projects.tsx` — developer recommended projects
  - `src/components/dashboard/project-performance.tsx` — owner project metrics
- Data-fetching extracted into helper functions: `fetchOwnerStats`, `fetchDeveloperStats`, `fetchRecommendedProjects`, `fetchOwnerProjectMetrics`
- `RecentActivityList` kept as async server component within the page (already well-isolated)

### Phase 4: Voice Component Consolidation — NOT STARTED
**Goal**: Merge 4 overlapping voice interfaces into 1 configurable component.

Key targets (4 voice components, ~4,415 total lines, ~669 lines / 15% duplicated):
- Voice Activity Detection (VAD) logic duplicated across all 4
- Base64 audio conversion duplicated
- Audio playback (AudioContext) duplicated
- MediaRecorder setup duplicated
- Session initialization duplicated
- Error UI and cleanup logic duplicated

Planned artifacts:
- Hooks: `use-voice-session` (audio context, VAD, MediaRecorder, silence detection), `use-voice-agent` (session lifecycle, API, TTS playback)
- Component: `unified-voice-interface.tsx` with `provider` prop (`'livekit' | 'gemini' | 'conversational'`)
- Constants already extracted to `src/lib/constants.ts` (`VOICE.ACTIVITY_THRESHOLD`, `VOICE.SILENCE_DURATION_MS`)

### Phase 5: Page Decomposition (Projects, Inbox, Matches) — NOT STARTED
**Goal**: Decompose remaining large pages following Phase 3 patterns.

Key targets:
- `src/app/(dashboard)/projects/[id]/page.tsx` (~1534 lines) — 20 state vars, 4 inline types, 11 handlers, owner vs non-owner views
- `src/app/(dashboard)/inbox/page.tsx` (~1013 lines) — Tab-based (notifications/messages), 4 useEffect hooks, 2 realtime channels
- `src/app/(dashboard)/projects/page.tsx` — Project listing
- `src/app/(dashboard)/matches/page.tsx` — Matches listing

Planned artifacts:
- Components: `project-detail-header`, `project-info-cards`, `applicant-list`, `matched-profiles-list`, `project-edit-form`, `notification-list`, `conversation-list`, `chat-panel`, `inbox-tabs`
- Hooks: `use-project`, `use-projects`, `use-matches`, `use-conversations`
- Service: `project-service.ts`

## Pending Task

**Specification documents for Phases 3-5 have NOT been written yet.** The previous session gathered exploration data via agents but was interrupted before writing the actual spec files. The next step is either:
1. Write detailed spec documents for Phases 3-5 (to `docs/specs/` or similar), OR
2. Skip specs and proceed directly with implementation

## Key Technical Decisions Made
- `withAuth` HOF pattern for API routes (handles both parameterized and non-parameterized routes)
- Only extracted truly identical utility functions (e.g., `getInitials` from all pages, but NOT `formatDate` variants that differ per page)
- `// @vitest-environment node` per-file directive for tests that use OpenAI SDK (avoids jsdom browser detection)
- Existing hooks to build on: `usePresence` (104 lines), `useRealtimeChat` (163 lines)

## Test Infrastructure
- Vitest with jsdom (default) + node environments, v8 coverage
- Playwright for E2E
- GitHub Actions CI: lint, typecheck, unit-tests, e2e-tests, build (5 parallel jobs)
- Current: 13 test files, 148 tests, all passing (1 pre-existing voice-agent timeout)
