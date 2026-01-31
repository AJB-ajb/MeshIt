# Data Model Documentation

> **Important:** Keep this document updated when making database schema changes.
> See `.agents` for instructions.

## Overview

This document describes the database schema for the Meshit application. It covers all tables, their fields, relationships, and JSONB structures.

---

## Tables

### profiles

User profile information including skills, preferences, and matching-related data.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `user_id` | uuid | NO | - | Primary key, references `auth.users(id)` |
| `full_name` | text | YES | null | User's display name |
| `headline` | text | YES | null | Short professional headline |
| `bio` | text | YES | null | Longer biography/description |
| `location` | text | YES | null | **Legacy:** Human-readable location string for display |
| `location_lat` | double precision | YES | null | Latitude coordinate for matching |
| `location_lng` | double precision | YES | null | Longitude coordinate for matching |
| `experience_level` | text | YES | null | One of: junior, intermediate, senior, lead |
| `collaboration_style` | text | YES | null | **Legacy:** One of: async, sync, hybrid. Kept for UI display |
| `remote_preference` | integer | YES | null | 0-100 percentage (0=on-site, 100=fully remote) |
| `availability_hours` | integer | YES | null | Hours per week available |
| `skills` | text[] | YES | null | Array of skill strings |
| `interests` | text[] | YES | null | Array of interest strings |
| `languages` | text[] | YES | null | Spoken languages (ISO codes: en, de, es, etc.) |
| `portfolio_url` | text | YES | null | Link to portfolio |
| `github_url` | text | YES | null | Link to GitHub profile |
| `project_preferences` | jsonb | NO | '{}' | See JSONB structure below |
| `hard_filters` | jsonb | YES | null | See JSONB structure below |
| `embedding` | vector(1536) | YES | null | OpenAI embedding for semantic matching |
| `is_test_data` | boolean | NO | true | Flag for test/mock data (true) vs production data (false) |
| `created_at` | timestamptz | NO | now() | Record creation timestamp |
| `updated_at` | timestamptz | NO | now() | Last update timestamp (auto-updated) |

**RLS Policies:**
- Users can view, insert, and update only their own profile

---

### projects

Project listings created by users seeking collaborators.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `creator_id` | uuid | NO | - | References `profiles.user_id` |
| `title` | text | NO | - | Project title |
| `description` | text | NO | - | Project description |
| `required_skills` | text[] | NO | '{}' | Skills needed for the project |
| `team_size` | integer | NO | 3 | Target team size |
| `experience_level` | text | YES | null | Required level: any, beginner, intermediate, advanced, junior, senior, lead |
| `commitment_hours` | integer | YES | null | Expected hours per week |
| `timeline` | text | YES | null | One of: weekend, 1_week, 1_month, ongoing |
| `hard_filters` | jsonb | YES | null | See JSONB structure below |
| `embedding` | vector(1536) | YES | null | OpenAI embedding for semantic matching |
| `status` | text | NO | 'open' | One of: open, closed, filled, expired |
| `is_test_data` | boolean | NO | true | Flag for test/mock data (true) vs production data (false) |
| `created_at` | timestamptz | NO | now() | Record creation timestamp |
| `updated_at` | timestamptz | NO | now() | Last update timestamp (auto-updated) |
| `expires_at` | timestamptz | NO | - | Project expiration date |

**RLS Policies:**
- Open projects are viewable by everyone
- Creators can view all their projects regardless of status
- Only creators can insert, update, and delete their projects

---

### matches

Matches between users and projects, including scores and status.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `project_id` | uuid | NO | - | References `projects.id` |
| `user_id` | uuid | NO | - | References `profiles.user_id` |
| `similarity_score` | float | NO | - | Overall match score (0-1) |
| `explanation` | text | YES | null | Human-readable match explanation |
| `score_breakdown` | jsonb | YES | null | See JSONB structure below |
| `status` | text | NO | 'pending' | One of: pending, applied, accepted, declined |
| `created_at` | timestamptz | NO | now() | Record creation timestamp |
| `responded_at` | timestamptz | YES | null | When user/owner responded |
| `updated_at` | timestamptz | NO | now() | Last update timestamp (auto-updated) |

**Constraints:**
- Unique constraint on `(project_id, user_id)` - one match per user per project

**RLS Policies:**
- Users can view matches where they are the applicant
- Project creators can view matches for their projects
- Authenticated users can create matches
- Users can update their own matches; creators can update matches for their projects

---

## JSONB Structures

### project_preferences (profiles)

Stored in `profiles.project_preferences`:

```typescript
interface ProjectPreferences {
  project_types?: string[];      // e.g., ["web", "mobile", "ai"]
  preferred_roles?: string[];    // e.g., ["frontend", "backend", "fullstack"]
  preferred_stack?: string[];    // e.g., ["react", "node", "python"]
  commitment_level?: string;     // e.g., "5", "10", "15", "20"
  timeline_preference?: string;  // e.g., "weekend", "1_week", "1_month", "ongoing"
}
```

### hard_filters (profiles and projects)

Stored in `profiles.hard_filters` and `projects.hard_filters`:

```typescript
interface HardFilters {
  max_distance_km?: number;      // Maximum distance in kilometers
  min_hours?: number;            // Minimum commitment hours/week
  max_hours?: number;            // Maximum commitment hours/week
  languages?: string[];          // Required spoken languages (ISO codes)
}
```

**Behavior:** Hard filters are integrated into match scoring. Matches violating filters receive penalized scores (approaching 0) but still appear in results, ranked lower.

### score_breakdown (matches)

Stored in `matches.score_breakdown`:

```typescript
interface ScoreBreakdown {
  semantic: number;         // Embedding similarity (0-1)
  skills_overlap: number;   // % of required skills user has (0-1)
  experience_match: number; // Experience level compatibility (0-1)
  commitment_match: number; // Hours alignment (0-1)
  location_match: number;   // Location + remote preference compatibility (0-1)
  filter_match: number;     // Hard filter compliance score (0-1)
}
```

---

## Relationships

```
auth.users
    │
    └── 1:1 ── profiles (user_id)
                   │
                   ├── 1:N ── projects (creator_id)
                   │              │
                   │              └── 1:N ── matches (project_id)
                   │
                   └── 1:N ── matches (user_id)
```

---

## Legacy Fields

Fields kept for backward compatibility but superseded by newer fields:

| Table | Field | Superseded By | Reason Kept |
|-------|-------|---------------|-------------|
| profiles | `location` (text) | `location_lat`, `location_lng` | Human-readable display in UI |
| profiles | `collaboration_style` | `remote_preference` | UI display, different granularity |

---

## Data Isolation

### Test Data Flag

Both `profiles` and `projects` tables include an `is_test_data` flag for complete data isolation between environments:

- **Test/Development/Preview** (`is_test_data = true`): All data in non-production environments
- **Production** (`is_test_data = false`): Real production data only

**Behavior:**
- Production environment only shows and modifies records with `is_test_data = false`
- Test/dev environments only show and modify records with `is_test_data = true`
- New records are automatically flagged based on environment (`VERCEL_ENV`)
- Ensures test environments cannot access or modify production data

**Implementation:**
- Environment detection via `VERCEL_ENV` variable
- All queries filter by `is_test_data` matching current environment
- UI displays "MeshIt - Test" and warning banner in test mode

---

## Indexes

### profiles
- Primary key on `user_id`
- `profiles_is_test_data_idx` on `is_test_data`

### projects
- Primary key on `id`
- `projects_status_idx` on `status`
- `projects_creator_idx` on `creator_id`
- `projects_expires_at_idx` on `expires_at`
- `projects_skills_idx` (GIN) on `required_skills`
- `projects_is_test_data_idx` on `is_test_data`

### matches
- Primary key on `id`
- Unique on `(project_id, user_id)`
- `matches_user_idx` on `user_id`
- `matches_project_idx` on `project_id`
- `matches_status_idx` on `status`
- `matches_user_status_idx` on `(user_id, status)`
- `matches_project_status_idx` on `(project_id, status)`
