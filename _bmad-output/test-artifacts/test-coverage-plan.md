# MeshIt - Test Automation Coverage Plan

**Generated**: 2026-01-31  
**Test Architect**: Murat (TEA Agent)  
**Framework**: Playwright + Vitest  
**Mode**: BMad-Integrated  
**Coverage Target**: Comprehensive (Critical Paths + Key Scenarios)

---

## Executive Summary

Comprehensive test automation plan covering **9 epics** and **73 stories** with risk-based prioritization. Test coverage spans:

- **API/Integration Tests**: Service layer, database operations, AI pipelines
- **E2E Tests**: Critical user journeys, auth flows, matching workflows
- **Unit Tests**: Business logic, utilities, data transformations
- **Component Tests**: UI components, form validation, interactions

### Coverage by Epic

| Epic | Stories | P0 Tests | P1 Tests | P2 Tests | Total Tests |
|------|---------|----------|----------|----------|-------------|
| E1 - Foundation | 15 | 45 | 20 | 10 | 75 |
| E2 - GitHub Enrichment | 6 | 18 | 12 | 6 | 36 |
| E3 - Profile Management | 7 | 28 | 15 | 8 | 51 |
| E4 - Project Management | 7 | 28 | 15 | 8 | 51 |
| E5 - Matching Engine | 8 | 40 | 20 | 10 | 70 |
| E6 - Notifications | 8 | 32 | 16 | 8 | 56 |
| E7 - Messaging | 5 | 20 | 10 | 5 | 35 |
| E8 - UI/UX | 9 | 27 | 18 | 9 | 54 |
| E9 - Voice Agent | 8 | 24 | 16 | 8 | 48 |
| **TOTAL** | **73** | **262** | **142** | **72** | **476** |

### Test Level Distribution

| Level | Count | Percentage | Purpose |
|-------|-------|------------|---------|
| **API/Integration** | 210 | 44% | Service contracts, data flows, business logic |
| **E2E** | 115 | 24% | Critical user journeys, workflows |
| **Unit** | 95 | 20% | Pure functions, utilities, transformations |
| **Component** | 56 | 12% | UI components, forms, interactions |

---

## Epic 1: Foundation (15 Stories)

**Risk Profile**: P0 - Critical path, blocks all other epics  
**Test Coverage**: 75 tests (45 P0, 20 P1, 10 P2)

### Test Strategy

- **Auth Flow**: E2E multi-provider OAuth, session management, RLS policies
- **Database**: API integration tests for all tables, migration validation
- **Infrastructure**: Environment config, error boundaries, middleware

### Story-Level Coverage

| Story | Tests | Levels | Priority | Focus Areas |
|-------|-------|--------|----------|-------------|
| 1.1 - Next.js Init | 3 | E2E | P0 | Dev server start, TypeScript compile, Tailwind load |
| 1.2 - shadcn/ui | 4 | Component | P1 | Component imports, theme tokens |
| 1.3 - Supabase Project | 5 | API | P0 | Connection, pgvector, schema |
| 1.4 - Database Schema | 12 | API | P0 | All tables, RLS policies, indexes |
| 1.5 - Google OAuth | 5 | E2E | P0 | OAuth flow, callback, session |
| 1.6 - GitHub OAuth | 5 | E2E | P0 | OAuth flow, callback, session |
| 1.7 - LinkedIn OAuth | 5 | E2E | P1 | OAuth flow, callback, session |
| 1.8 - Slack OAuth | 5 | E2E | P1 | OAuth flow, callback, session |
| 1.9 - Discord OAuth | 5 | E2E | P1 | OAuth flow, callback, session |
| 1.10 - Auth Flow | 10 | API+E2E | P0 | Profile creation, session persistence, logout |
| 1.11 - Basic Layout | 6 | E2E+Component | P0 | Navigation, header, responsive |
| 1.12 - Environment Variables | 3 | API | P0 | Config loading, secret management |
| 1.13 - Error Handling | 5 | API | P0 | Global error boundary, API errors |
| 1.14 - Vitest Setup | 2 | Unit | P2 | Test runner config |
| 1.15 - Playwright Setup | 3 | E2E | P2 | Test framework config |

**Quality Gates**:
- ✅ All OAuth providers functional in E2E tests
- ✅ RLS policies prevent unauthorized access (verified via API tests)
- ✅ Session persists across page reloads
- ✅ Error boundaries catch and display errors gracefully

---

## Epic 2: GitHub Enrichment (6 Stories)

**Risk Profile**: P1 - Important but not critical path  
**Test Coverage**: 36 tests (18 P0, 12 P1, 6 P2)

### Test Strategy

- **API Integration**: GitHub API client, rate limiting, error handling
- **Data Extraction**: Language parsing, skill inference, activity scoring
- **Profile Merge**: Logic for combining GitHub + text profile data

### Story-Level Coverage

| Story | Tests | Levels | Priority | Focus Areas |
|-------|-------|--------|----------|-------------|
| 2.1 - GitHub API Client | 6 | API+Unit | P0 | Fetch repos, rate limits, errors |
| 2.2 - Language Extraction | 5 | Unit | P0 | Top languages, repo count, stars |
| 2.3 - Profile Inference | 7 | Unit | P0 | Experience level, project types, activity |
| 2.4 - Profile Merger | 6 | Unit | P0 | Skill dedup, level resolution, interest merge |
| 2.5 - GitHub Profile Storage | 6 | API | P0 | CRUD operations, last_synced_at |
| 2.6 - GitHub Sync on OAuth | 6 | E2E+API | P1 | Auto-sync on login, async processing |

**Quality Gates**:
- ✅ GitHub API client handles rate limits gracefully
- ✅ Language extraction accurate for top 5 languages
- ✅ Profile merger preserves user edits over auto-extracted data
- ✅ Sync completes within 10 seconds for typical user

---

## Epic 3: Profile Management (7 Stories)

**Risk Profile**: P0 - Critical for matching engine  
**Test Coverage**: 51 tests (28 P0, 15 P1, 8 P2)

### Test Strategy

- **AI Services**: Gemini extraction, OpenAI embeddings, error handling
- **API Layer**: Profile CRUD, extraction endpoint, embedding generation
- **UI Flows**: Text onboarding, profile edit, preview/confirm

### Story-Level Coverage

| Story | Tests | Levels | Priority | Focus Areas |
|-------|-------|--------|----------|-------------|
| 3.1 - Gemini Extraction | 8 | API+Unit | P0 | Structured extraction, edge cases, errors |
| 3.2 - OpenAI Embeddings | 6 | API+Unit | P0 | Vector generation, consistency, errors |
| 3.3 - Profile Extraction API | 7 | API | P0 | Auth required, extraction accuracy |
| 3.4 - Profile CRUD APIs | 10 | API | P0 | GET/PATCH, RLS enforcement, validation |
| 3.5 - Text Onboarding Page | 8 | E2E | P0 | Text input, preview, edit, save |
| 3.6 - Profile Edit Page | 6 | E2E | P1 | Edit fields, validation, save |
| 3.7 - Store Embeddings | 6 | API | P0 | Vector storage, index usage, retrieval |

**Quality Gates**:
- ✅ Gemini extraction >90% accuracy on structured fields
- ✅ Embedding generation <5 seconds per profile
- ✅ Profile CRUD enforces RLS (users can only access own profile)
- ✅ Onboarding flow completes in <30 seconds

---

## Epic 4: Project Management (7 Stories)

**Risk Profile**: P0 - Critical for matching engine  
**Test Coverage**: 51 tests (28 P0, 15 P1, 8 P2)

### Test Strategy

- **AI Services**: Project extraction, embedding generation
- **API Layer**: Project CRUD, expiration logic, validation
- **UI Flows**: Project creation, listing, detail pages

### Story-Level Coverage

| Story | Tests | Levels | Priority | Focus Areas |
|-------|-------|--------|----------|-------------|
| 4.1 - Project Extraction | 8 | API+Unit | P0 | Skill extraction, team size, timeline |
| 4.2 - Project CRUD APIs | 10 | API | P0 | CRUD operations, RLS, validation |
| 4.3 - Project Creation Page | 8 | E2E | P0 | Form validation, extraction, save |
| 4.4 - Project Listing Page | 6 | E2E | P1 | Display projects, filters, pagination |
| 4.5 - Project Detail Page | 7 | E2E | P1 | View details, edit, delete |
| 4.6 - Store Project Embeddings | 6 | API | P0 | Vector storage, index usage |
| 4.7 - Auto-Expire Projects | 6 | API | P0 | Cron job, status updates, notifications |

**Quality Gates**:
- ✅ Project extraction >85% accuracy on required_skills
- ✅ Expiration date enforced (projects auto-expire)
- ✅ RLS prevents unauthorized project edits
- ✅ Embedding generation <5 seconds per project

---

## Epic 5: Matching Engine (8 Stories)

**Risk Profile**: P0 - Core product value  
**Test Coverage**: 70 tests (40 P0, 20 P1, 10 P2)

### Test Strategy

- **Matching Logic**: Profile→Project and Project→Profile similarity
- **Score Calculation**: Cosine similarity, breakdown components
- **API Layer**: Match endpoints, status updates, explanations
- **UI Flows**: Match results, detail pages, apply/accept flows

### Story-Level Coverage

| Story | Tests | Levels | Priority | Focus Areas |
|-------|-------|--------|----------|-------------|
| 5.1 - Profile→Project Matching | 10 | API+Unit | P0 | Similarity calculation, top N results |
| 5.2 - Project→Profile Matching | 10 | API+Unit | P0 | Similarity calculation, top N results |
| 5.3 - Match API Routes | 8 | API | P0 | GET matches, auth, RLS |
| 5.4 - Match Results Page | 8 | E2E | P0 | Display matches, scores, sort/filter |
| 5.5 - Match Detail Page | 7 | E2E | P1 | View match, explanation, apply |
| 5.6 - Match Explanations | 9 | API+Unit | P0 | LLM generation, scoring breakdown |
| 5.7 - Apply/Accept Flow | 10 | API+E2E | P0 | Apply, accept, decline, status updates |
| 5.8 - Auto-Expire Projects | 8 | API | P1 | Cron, status cascade, cleanup |

**Quality Gates**:
- ✅ Matching completes in <30 seconds for typical profile
- ✅ Top match has >70% similarity score
- ✅ Score breakdown shows skill overlap, experience match
- ✅ Apply/accept flow prevents duplicate applications

---

## Epic 6: Notifications (8 Stories)

**Risk Profile**: P1 - Important for user engagement  
**Test Coverage**: 56 tests (32 P0, 16 P1, 8 P2)

### Test Strategy

- **Realtime**: Supabase Realtime subscriptions, WebSocket connections
- **Email**: Resend integration, template rendering, delivery
- **UI Components**: Notification bell, dropdown, toast messages

### Story-Level Coverage

| Story | Tests | Levels | Priority | Focus Areas |
|-------|-------|--------|----------|-------------|
| 6.1 - Realtime Subscription | 8 | API+E2E | P0 | Subscribe, receive, unsubscribe |
| 6.2 - Notification DB Triggers | 6 | API | P0 | Insert triggers, data structure |
| 6.3 - Notification Bell | 6 | E2E+Component | P0 | Unread count, badge display |
| 6.4 - Notification Dropdown | 7 | E2E+Component | P1 | Display list, mark read, navigation |
| 6.5 - Toast Notifications | 5 | E2E+Component | P1 | Display, auto-dismiss, actions |
| 6.6 - Resend Email Setup | 6 | API | P0 | API key, template config, send |
| 6.7 - Match Notification Emails | 9 | API | P0 | Template render, recipient, delivery |
| 6.8 - Acceptance Notification Emails | 9 | API | P0 | Template render, recipient, delivery |

**Quality Gates**:
- ✅ Realtime notifications arrive within 2 seconds
- ✅ Email delivery confirmed via Resend API
- ✅ Unread count updates automatically
- ✅ Toast messages don't block UI interactions

---

## Epic 7: Messaging (5 Stories)

**Risk Profile**: P1 - Important for collaboration  
**Test Coverage**: 35 tests (20 P0, 10 P1, 5 P2)

### Test Strategy

- **WebSocket**: Real-time message sending/receiving
- **Database**: Message persistence, retrieval, pagination
- **UI Components**: Chat interface, message bubbles, typing indicators

### Story-Level Coverage

| Story | Tests | Levels | Priority | Focus Areas |
|-------|-------|--------|----------|-------------|
| 7.1 - Realtime Messaging | 10 | API+E2E | P0 | Send, receive, WebSocket stability |
| 7.2 - Message DB Storage | 6 | API | P0 | Persist, retrieve, RLS enforcement |
| 7.3 - Chat Interface | 8 | E2E+Component | P0 | Display messages, send, scroll |
| 7.4 - Message History | 6 | E2E+API | P1 | Load history, pagination, ordering |
| 7.5 - Platform Link Sharing | 5 | E2E | P1 | Share Slack/Discord links, click |

**Quality Gates**:
- ✅ Messages arrive in <1 second over WebSocket
- ✅ Message history loads in <500ms
- ✅ RLS prevents reading other users' messages
- ✅ Chat UI handles rapid message streams

---

## Epic 8: UI/UX (9 Stories)

**Risk Profile**: P1 - User experience critical  
**Test Coverage**: 54 tests (27 P0, 18 P1, 9 P2)

### Test Strategy

- **Component Library**: shadcn/ui components, theme consistency
- **Responsive Design**: Mobile, tablet, desktop viewports
- **Accessibility**: ARIA labels, keyboard navigation, screen readers

### Story-Level Coverage

| Story | Tests | Levels | Priority | Focus Areas |
|-------|-------|--------|----------|-------------|
| 8.1 - Design System Setup | 5 | Component | P1 | Colors, typography, spacing |
| 8.2 - Responsive Layout | 6 | E2E | P0 | Mobile, tablet, desktop |
| 8.3 - Navigation Component | 6 | E2E+Component | P0 | Links, active states, mobile menu |
| 8.4 - Form Components | 7 | Component | P0 | Input, textarea, select, validation |
| 8.5 - Card Components | 5 | Component | P1 | Profile cards, project cards, match cards |
| 8.6 - Modal/Dialog Components | 6 | Component | P1 | Open, close, backdrop, focus trap |
| 8.7 - Loading States | 6 | Component | P1 | Spinners, skeletons, progress |
| 8.8 - Error States | 6 | E2E+Component | P0 | Error messages, retry actions |
| 8.9 - Accessibility | 7 | E2E | P0 | ARIA, keyboard nav, screen reader |

**Quality Gates**:
- ✅ Mobile viewport fully functional (375px width)
- ✅ Keyboard navigation works for all interactive elements
- ✅ Color contrast meets WCAG AA standards
- ✅ Loading states shown for >500ms operations

---

## Epic 9: Voice Agent (8 Stories - Post-MVP)

**Risk Profile**: P2 - Enhancement feature  
**Test Coverage**: 48 tests (24 P0, 16 P1, 8 P2)

### Test Strategy

- **Voice Input**: Whisper transcription, audio recording
- **Voice Output**: ElevenLabs synthesis, audio playback
- **Conversation Flow**: Multi-turn dialogue, context retention

### Story-Level Coverage

| Story | Tests | Levels | Priority | Focus Areas |
|-------|-------|--------|----------|-------------|
| 9.1 - Whisper Transcription | 6 | API | P0 | Audio→text, accuracy, errors |
| 9.2 - ElevenLabs Synthesis | 6 | API | P0 | Text→audio, voice quality, latency |
| 9.3 - Voice Onboarding UI | 8 | E2E | P0 | Record, transcribe, playback |
| 9.4 - Conversation State Management | 7 | Unit+API | P0 | Context, turn tracking, memory |
| 9.5 - Voice Input Component | 6 | Component | P1 | Recording UI, waveform, controls |
| 9.6 - Voice Playback Component | 5 | Component | P1 | Audio player, controls, queue |
| 9.7 - Multi-Turn Dialogue | 6 | E2E | P1 | Follow-up questions, corrections |
| 9.8 - Voice Agent API Routes | 4 | API | P1 | WebSocket endpoints, auth |

**Quality Gates**:
- ✅ Transcription accuracy >90% for clear audio
- ✅ Voice synthesis latency <3 seconds
- ✅ Conversation context preserved for 10+ turns
- ✅ Graceful fallback to text when voice fails

---

## Test Infrastructure Requirements

### Fixtures and Factories

**Required Data Factories** (following `data-factories.md`):

```typescript
// test-utils/factories/
- user-factory.ts         // createUser(overrides)
- profile-factory.ts      // createProfile(overrides)
- project-factory.ts      // createProject(overrides)
- match-factory.ts        // createMatch(overrides)
- message-factory.ts      // createMessage(overrides)
- notification-factory.ts // createNotification(overrides)
```

**Playwright Fixtures**:

```typescript
// tests/fixtures/
- auth-fixture.ts         // Authenticated user sessions
- database-fixture.ts     // DB seeding and cleanup
- api-fixture.ts          // API request helpers
- github-fixture.ts       // Mock GitHub API responses
```

### Test Utilities

```typescript
// tests/utils/
- seed-helpers.ts         // API seeding functions
- auth-helpers.ts         // Login, logout, session management
- wait-helpers.ts         // Network-first wait patterns
- assertion-helpers.ts    // Custom matchers
```

### CI/CD Configuration

**GitHub Actions Pipeline**:

```yaml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm test:run
  
  api-tests:
    runs-on: ubuntu-latest
    services:
      supabase: # Local Supabase instance
    steps:
      - run: pnpm test:api
  
  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4] # Parallelize E2E tests
    steps:
      - run: pnpm test:e2e --shard=${{ matrix.shard }}/4
```

**Burn-In Strategy** (following `ci-burn-in.md`):

- P0 tests: Run 3x on PR, 10x nightly
- P1 tests: Run 1x on PR, 3x nightly
- P2 tests: Run 1x weekly

---

## Risk-Based Execution Order

### Pull Request Gate (Fast Feedback - ~10 mins)

1. Unit tests (all P0)
2. API tests (P0 critical paths)
3. E2E smoke tests (auth, onboarding, matching)

### Pre-Merge Gate (Full Validation - ~30 mins)

1. All unit tests
2. All API tests (P0 + P1)
3. E2E critical journeys (P0)
4. Component tests (P0)

### Nightly Regression (Comprehensive - ~90 mins)

1. Full suite (all priorities)
2. Burn-in loops for flaky test detection
3. Visual regression tests
4. Performance benchmarks

---

## Quality Metrics and Success Criteria

### Coverage Targets

- **Unit**: >80% code coverage for business logic
- **API**: 100% endpoint coverage for P0 routes
- **E2E**: 100% coverage of critical user journeys

### Performance Targets

- **Unit tests**: <10ms per test
- **API tests**: <500ms per test
- **E2E tests**: <60s per test

### Reliability Targets

- **Pass rate**: >99% for P0 tests
- **Flake rate**: <1% across all tests
- **False positive rate**: <0.1%

### CI Pipeline Targets

- **PR checks**: Complete in <15 minutes
- **Full regression**: Complete in <90 minutes
- **Test failure triage**: <30 minutes median time

---

## Next Steps

1. **Week 1**: Implement test fixtures and factories for all entities
2. **Week 2**: Generate API test suite for E1, E3, E4, E5 (critical path)
3. **Week 3**: Generate E2E test suite for auth, onboarding, matching
4. **Week 4**: Generate remaining tests for E2, E6, E7, E8
5. **Week 5**: CI/CD integration, burn-in configuration, reporting

---

**Test Architect Sign-Off**: Murat  
**Date**: 2026-01-31  
**Status**: Ready for Implementation
