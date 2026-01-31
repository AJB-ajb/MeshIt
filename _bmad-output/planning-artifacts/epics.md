---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
inputDocuments:
  - planning-artifacts/prd.md
  - planning-artifacts/architecture.md
  - planning-artifacts/pm-handoff.md
---

# MeshIt - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for MeshIt, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can sign up/login via Google, GitHub, LinkedIn, Slack, or Discord OAuth
FR2: System auto-creates profile record on first OAuth login
FR3: Users can create profile via text input (natural language description)
FR4: AI extracts structured data (skills, interests, availability, experience, collaboration style) from text
FR5: Users can edit AI-extracted profile data
FR6: System extracts GitHub profile data (languages, repos, activity) on GitHub OAuth
FR7: System merges GitHub data with text profile
FR8: System generates embedding vectors for profiles
FR9: Users can create projects via natural language description
FR10: AI extracts project requirements (skills, team size, timeline, commitment)
FR11: Users must set project expiration date
FR12: System auto-expires projects past expiration date
FR13: Users can reactivate expired projects
FR14: System generates embedding vectors for projects
FR15: System matches profiles to projects via pgvector cosine similarity
FR16: System generates LLM explanations for why matches occurred
FR17: Project creators can invite matched users
FR18: Matched users can apply or decline
FR19: Project creators can accept or decline applications
FR20: System sends real-time in-app notifications for matches
FR21: System displays notification bell with unread count
FR22: System shows toast notifications for new matches
FR23: System sends email notifications via Resend
FR24: Accepted matches unlock messaging
FR25: Users can send real-time messages via WebSocket
FR26: Users can share external platform links (Slack/Discord)

### NonFunctional Requirements

NFR1: Matching latency < 30 seconds from project post to matches displayed
NFR2: Embedding generation < 5 seconds per profile/project
NFR3: System uptime 99%
NFR4: Support 100+ concurrent users
NFR5: Mobile responsive (PWA)
NFR6: All database operations protected by RLS policies
NFR7: API routes require authentication

### Additional Requirements

- Next.js 15 with App Router, TypeScript, Tailwind CSS
- shadcn/ui component library
- Supabase PostgreSQL with pgvector extension
- Supabase Auth for all OAuth providers (Google, GitHub, LinkedIn, Slack, Discord)
- Supabase Realtime for WebSocket (notifications + messages)
- LangChain.js for AI pipeline
- Gemini 2.0 Flash for extraction
- OpenAI text-embedding-3-small (1536 dimensions)
- Resend for email
- Vercel deployment
- PostHog analytics, Sentry error tracking

### FR Coverage Map

| FR | Epic | Story |
|----|------|-------|
| FR1 | E1 | E1-S5 to E1-S10 |
| FR2 | E1 | E1-S10 |
| FR3 | E3 | E3-S5 |
| FR4 | E3 | E3-S1, E3-S3 |
| FR5 | E3 | E3-S6 |
| FR6 | E2 | E2-S1 to E2-S3 |
| FR7 | E2 | E2-S4 |
| FR8 | E3 | E3-S2, E3-S7 |
| FR9 | E4 | E4-S3 |
| FR10 | E4 | E4-S1 |
| FR11 | E4 | E4-S3 |
| FR12 | E5 | E5-S8 |
| FR13 | E4 | E4-S2 |
| FR14 | E4 | E4-S6 |
| FR15 | E5 | E5-S1, E5-S2 |
| FR16 | E5 | E5-S3 |
| FR17 | E5 | E5-S7 |
| FR18 | E5 | E5-S7 |
| FR19 | E5 | E5-S7 |
| FR20 | E6 | E6-S1, E6-S2 |
| FR21 | E6 | E6-S3 |
| FR22 | E6 | E6-S5 |
| FR23 | E6 | E6-S6 to E6-S8 |
| FR24 | E7 | E7-S1 |
| FR25 | E7 | E7-S1, E7-S2 |
| FR26 | E7 | E7-S5 |

## Epic List

| Epic | Title | Goal | Stories |
|------|-------|------|---------|
| E1 | Foundation | Project setup, Supabase config, auth flow | 12 |
| E2 | GitHub Enrichment | Auto-extract profile from GitHub repos | 6 |
| E3 | Profile Management | Profile CRUD, AI extraction, embeddings | 7 |
| E4 | Project Management | Project CRUD, AI extraction, embeddings | 6 |
| E5 | Matching Engine | Vector search, match generation, explanations | 8 |
| E6 | Notifications | Real-time in-app + email notifications | 8 |
| E7 | Messaging | Basic chat, platform handoff | 5 |
| E8 | UI/UX | Component library, pages, responsive design | 9 |

**POST-MVP:**
| E9 | Voice Agent | Conversational onboarding via Whisper + ElevenLabs | 8 |

---

## Epic 1: Foundation

**Goal:** Project scaffolding, Supabase setup, all OAuth providers working, basic layout

### Story 1.1: Initialize Next.js Project

As a developer,
I want the Next.js 15 project initialized with pnpm, TypeScript, and Tailwind,
So that I have a working development environment.

**Acceptance Criteria:**

**Given** a fresh project directory
**When** I run `pnpm dev`
**Then** the app starts on localhost:3000
**And** TypeScript compilation succeeds
**And** Tailwind CSS is configured

---

### Story 1.2: Set Up shadcn/ui Component Library

As a developer,
I want shadcn/ui installed and configured,
So that I can use pre-built accessible components.

**Acceptance Criteria:**

**Given** the Next.js project from E1-S1
**When** I run `npx shadcn-ui@latest init`
**Then** the components.json is created
**And** I can import Button, Input, Card components
**And** the theme uses project design tokens

---

### Story 1.3: Create Supabase Project

As a developer,
I want a Supabase project created with pgvector enabled,
So that I have database and auth infrastructure.

**Acceptance Criteria:**

**Given** a Supabase account
**When** I create a new project
**Then** the project dashboard is accessible
**And** pgvector extension is enabled via SQL editor
**And** connection strings are available

---

### Story 1.4: Run Database Schema

As a developer,
I want all database tables created with RLS policies,
So that the data layer is ready.

**Acceptance Criteria:**

**Given** the Supabase project from E1-S3
**When** I run the schema SQL from architecture.md
**Then** profiles, projects, matches, messages, notifications, github_profiles tables exist
**And** all RLS policies are active
**And** pgvector indexes are created

---

### Story 1.5: Configure Google OAuth

As a user,
I want to sign in with Google,
So that I can quickly create an account.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I click "Sign in with Google"
**Then** I am redirected to Google OAuth
**And** after approval, I am redirected back to the app
**And** my session is created

---

### Story 1.6: Configure GitHub OAuth

As a user,
I want to sign in with GitHub,
So that I can quickly create an account and share my dev profile.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I click "Sign in with GitHub"
**Then** I am redirected to GitHub OAuth
**And** after approval, I am redirected back to the app
**And** my session is created

---

### Story 1.7: Configure LinkedIn OAuth

As a user,
I want to sign in with LinkedIn,
So that I can quickly create an account.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I click "Sign in with LinkedIn"
**Then** I am redirected to LinkedIn OAuth
**And** after approval, I am redirected back to the app
**And** my session is created

---

### Story 1.8: Configure Slack OAuth

As a user,
I want to sign in with Slack,
So that I can quickly create an account and share my Slack for collaboration.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I click "Sign in with Slack"
**Then** I am redirected to Slack OAuth
**And** after approval, I am redirected back to the app
**And** my session is created

---

### Story 1.9: Configure Discord OAuth

As a user,
I want to sign in with Discord,
So that I can quickly create an account and share my Discord for collaboration.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I click "Sign in with Discord"
**Then** I am redirected to Discord OAuth
**And** after approval, I am redirected back to the app
**And** my session is created

---

### Story 1.10: Implement Auth Flow

As a user,
I want a complete auth flow with session management,
So that I stay logged in and my profile is auto-created.

**Acceptance Criteria:**

**Given** I complete OAuth with any provider
**When** the callback is processed
**Then** a profile record is created in the profiles table
**And** my session persists across page refreshes
**And** I can log out and my session is cleared

---

### Story 1.11: Create Basic Layout

As a user,
I want a consistent layout with header and navigation,
So that I can navigate the app easily.

**Acceptance Criteria:**

**Given** I am logged in
**When** I view any page
**Then** I see a header with logo and navigation
**And** I see my avatar and a dropdown with logout
**And** the layout is consistent across all pages

---

### Story 1.12: Set Up Environment Variables

As a developer,
I want environment variables configured for local and production,
So that secrets are managed properly.

**Acceptance Criteria:**

**Given** the project
**When** I create .env.local with all required keys
**Then** Supabase client connects successfully
**And** Vercel environment variables are configured
**And** .env.example documents all required variables

---

## Epic 2: GitHub Enrichment

**Goal:** Auto-extract profile data from GitHub repos on OAuth login

### Story 2.1: Implement GitHub API Client

As a developer,
I want a GitHub API client that fetches user repos,
So that I can analyze their coding profile.

**Acceptance Criteria:**

**Given** a valid GitHub access token
**When** I call the GitHub API client
**Then** it returns the user's public repos
**And** handles rate limiting gracefully
**And** returns error states appropriately

---

### Story 2.2: Create Repo/Language Extraction

As a system,
I want to extract programming languages from repos,
So that I know what technologies the user works with.

**Acceptance Criteria:**

**Given** a list of user repos
**When** I run the extraction logic
**Then** I get the top 5 languages by usage
**And** I get total repo count
**And** I get star count

---

### Story 2.3: Build Profile Inference

As a system,
I want to infer skill level and project types from repos,
So that I can enrich the user profile.

**Acceptance Criteria:**

**Given** repo data with languages and topics
**When** I run the inference logic
**Then** I get estimated experience level (beginner/intermediate/advanced)
**And** I get inferred project types (web, mobile, ML, etc.)
**And** I get activity level (low/medium/high)

---

### Story 2.4: Create Profile Merger

As a system,
I want to merge GitHub data with text profile data,
So that the user has a complete profile.

**Acceptance Criteria:**

**Given** GitHub extracted data and text profile data
**When** I run the merger
**Then** skills are combined (deduplicated)
**And** experience level uses the higher of the two
**And** interests are merged

---

### Story 2.5: Store GitHub Profile Data

As a system,
I want GitHub profile data stored in the database,
So that it persists and can be refreshed.

**Acceptance Criteria:**

**Given** extracted GitHub data
**When** I save to the database
**Then** github_profiles table is populated
**And** last_synced_at is set
**And** data can be retrieved for the user

---

### Story 2.6: Add GitHub Sync on OAuth Callback

As a user,
I want my GitHub profile auto-extracted on first login,
So that my profile is pre-filled.

**Acceptance Criteria:**

**Given** I log in with GitHub for the first time
**When** the OAuth callback completes
**Then** my repos are fetched and analyzed
**And** my github_profiles record is created
**And** the data is available for profile merge

---

## Epic 3: Profile Management

**Goal:** Profile CRUD, AI extraction from text, embedding generation

### Story 3.1: Implement Gemini Extraction Service

As a developer,
I want a Gemini service that extracts structured data from text,
So that I can parse natural language profiles.

**Acceptance Criteria:**

**Given** a text description like "I'm a backend dev with Python experience..."
**When** I call the extraction service
**Then** I get structured JSON with skills, experience_level, availability_hours, interests, collaboration_style
**And** the extraction handles edge cases gracefully

---

### Story 3.2: Implement OpenAI Embedding Service

As a developer,
I want an embedding service that generates vectors,
So that I can store profile embeddings for matching.

**Acceptance Criteria:**

**Given** a text string
**When** I call the embedding service
**Then** I get a 1536-dimension vector
**And** the service handles errors gracefully
**And** vectors are consistent for similar text

---

### Story 3.3: Create Profile Extraction API Route

As a developer,
I want an API route that extracts profile from text,
So that the frontend can preview before saving.

**Acceptance Criteria:**

**Given** a POST request to /api/profile/extract with description text
**When** the request is processed
**Then** I get structured profile data in response
**And** the route requires authentication
**And** errors return appropriate status codes

---

### Story 3.4: Create Profile CRUD API Routes

As a developer,
I want API routes for profile operations,
So that the frontend can manage profiles.

**Acceptance Criteria:**

**Given** authenticated requests
**When** I call GET /api/profile
**Then** I get my profile data
**When** I call PATCH /api/profile with updates
**Then** my profile is updated
**And** all routes require authentication
**And** RLS policies are enforced

---

### Story 3.5: Build Text-Based Onboarding Page

As a new user,
I want to describe myself in a text box and see what the AI extracted,
So that I can create my profile quickly.

**Acceptance Criteria:**

**Given** I am a new user without a complete profile
**When** I visit /onboarding
**Then** I see a large textarea with placeholder text
**When** I enter my description and click "Extract"
**Then** I see preview cards showing extracted skills, interests, etc.
**And** I can edit any field before saving
**When** I click "Save Profile"
**Then** my profile is saved and I'm redirected to dashboard

---

### Story 3.6: Build Profile Edit Page

As a user,
I want to edit my profile at any time,
So that I can keep it up to date.

**Acceptance Criteria:**

**Given** I am logged in with a profile
**When** I visit /profile
**Then** I see my current profile data in editable form
**When** I make changes and click "Save"
**Then** my profile is updated
**And** my embedding is regenerated

---

### Story 3.7: Store Profile Embeddings

As a system,
I want profile embeddings stored in pgvector,
So that matching can use vector similarity.

**Acceptance Criteria:**

**Given** a profile is saved or updated
**When** the save completes
**Then** an embedding is generated from the profile text
**And** the embedding is stored in the profiles.embedding column
**And** the embedding can be queried with pgvector operators

---

## Epic 4: Project Management

**Goal:** Project CRUD, AI extraction, embedding generation

### Story 4.1: Create Project Extraction Prompts

As a developer,
I want prompts that extract project requirements from text,
So that I can parse natural language project descriptions.

**Acceptance Criteria:**

**Given** a project description like "Building an AI recipe app, need 2 devs with React..."
**When** I call the extraction service
**Then** I get structured JSON with title, required_skills, team_size, experience_level, commitment_hours, timeline
**And** reasonable defaults are used for missing info

---

### Story 4.2: Create Project CRUD API Routes

As a developer,
I want API routes for project operations,
So that the frontend can manage projects.

**Acceptance Criteria:**

**Given** authenticated requests
**When** I call POST /api/projects with project data
**Then** a project is created with my user as creator
**When** I call GET /api/projects
**Then** I get a list of open projects
**When** I call PATCH /api/projects/:id
**Then** my project is updated (only if I'm the creator)
**When** I call DELETE /api/projects/:id
**Then** my project is closed (only if I'm the creator)
**And** reactivate endpoint works for expired projects

---

### Story 4.3: Build Project Creation Page

As a user,
I want to create a project by describing it,
So that I can find collaborators.

**Acceptance Criteria:**

**Given** I am logged in
**When** I visit /projects/new
**Then** I see a textarea for project description
**And** I see a date picker for expiration date (required)
**When** I enter description and click "Extract"
**Then** I see preview of extracted requirements
**When** I confirm and click "Post Project"
**Then** the project is created and matching begins
**And** I'm redirected to the project detail page

---

### Story 4.4: Build Project Listing Page

As a user,
I want to browse open projects,
So that I can find projects to join.

**Acceptance Criteria:**

**Given** I am logged in
**When** I visit /projects
**Then** I see a list of open projects as cards
**And** each card shows title, skills, team size, timeline
**And** I can filter by skill or timeline
**When** I click a project card
**Then** I'm taken to the project detail page

---

### Story 4.5: Build Project Detail Page

As a user,
I want to see full project details,
So that I can decide if I want to join.

**Acceptance Criteria:**

**Given** I visit /projects/:id
**When** the page loads
**Then** I see full project description
**And** I see required skills, team size, timeline
**And** I see the creator's profile summary
**And** if I'm the creator, I see my matches
**And** if I'm not the creator, I see my match status (if any)

---

### Story 4.6: Store Project Embeddings

As a system,
I want project embeddings stored in pgvector,
So that matching can use vector similarity.

**Acceptance Criteria:**

**Given** a project is created
**When** the creation completes
**Then** an embedding is generated from the project description
**And** the embedding is stored in the projects.embedding column
**And** matching is triggered automatically

---

## Epic 5: Matching Engine

**Goal:** Vector search, match generation, LLM explanations

### Story 5.1: Implement pgvector Similarity Search

As a developer,
I want a function that finds similar profiles for a project,
So that I can generate matches.

**Acceptance Criteria:**

**Given** a project embedding
**When** I call the similarity search function
**Then** I get the top 5 profiles by cosine similarity
**And** results include similarity score
**And** results exclude the project creator

---

### Story 5.2: Create Match Generation Logic

As a system,
I want matches auto-generated when a project is created,
So that creators see candidates immediately.

**Acceptance Criteria:**

**Given** a new project is created
**When** the embedding is stored
**Then** similarity search runs automatically
**And** match records are created for top candidates
**And** match status is set to 'pending'

---

### Story 5.3: Implement Match Explanation Generation

As a system,
I want LLM-generated explanations for matches,
So that users understand why they matched.

**Acceptance Criteria:**

**Given** a match between a profile and project
**When** explanation generation runs
**Then** a 2-3 sentence explanation is generated
**And** the explanation references specific skill overlaps
**And** the explanation is stored in the match record

---

### Story 5.4: Create Match API Routes

As a developer,
I want API routes for match operations,
So that the frontend can display and update matches.

**Acceptance Criteria:**

**Given** authenticated requests
**When** I call GET /api/matches
**Then** I get matches where I'm the matched user
**When** I call GET /api/matches/project/:id (as creator)
**Then** I get all matches for my project
**When** I call PATCH /api/matches/:id with status update
**Then** the match status is updated
**And** notifications are triggered

---

### Story 5.5: Build Match Cards UI Component

As a user,
I want to see match information in a card format,
So that I can quickly evaluate matches.

**Acceptance Criteria:**

**Given** match data
**When** the MatchCard component renders
**Then** I see the user/project avatar and name
**And** I see the match score as a percentage badge
**And** I see skill tags (max 5)
**And** I see the explanation text
**And** I see action buttons (Apply/Decline or Accept/Decline)

---

### Story 5.6: Build Matches Page

As a user,
I want a page showing all my matches,
So that I can manage them in one place.

**Acceptance Criteria:**

**Given** I am logged in
**When** I visit /matches
**Then** I see tabs for "Projects I Matched With" and "My Project Matches"
**And** each tab shows relevant match cards
**And** I can filter by status (pending, applied, accepted)

---

### Story 5.7: Implement Apply/Accept/Decline Flow

As a user,
I want to apply to projects and accept/decline applicants,
So that teams can form.

**Acceptance Criteria:**

**Given** I'm a matched user viewing a project match
**When** I click "Apply"
**Then** the match status changes to 'applied'
**And** the project creator is notified
**Given** I'm a project creator viewing an applicant
**When** I click "Accept"
**Then** the match status changes to 'accepted'
**And** the applicant is notified
**And** messaging is unlocked

---

### Story 5.8: Auto-Expire Old Projects

As a system,
I want projects to auto-expire past their expiration date,
So that stale projects don't clutter the system.

**Acceptance Criteria:**

**Given** projects with expires_at in the past
**When** the expiration job runs (daily cron or trigger)
**Then** those projects' status changes to 'expired'
**And** they no longer appear in project listings
**And** creators can reactivate them with a new expiration date

---

## Epic 6: Notifications

**Goal:** Real-time in-app notifications + email notifications

### Story 6.1: Set Up Supabase Realtime Subscription

As a developer,
I want the client to subscribe to notifications,
So that users see updates instantly.

**Acceptance Criteria:**

**Given** a logged-in user
**When** the app loads
**Then** the client subscribes to notifications table changes
**And** new notifications trigger a callback
**And** the subscription cleans up on logout

---

### Story 6.2: Create Notification DB Triggers

As a system,
I want notifications auto-created on key events,
So that users are informed automatically.

**Acceptance Criteria:**

**Given** a new match is created
**When** the match insert completes
**Then** a notification is created for the matched user
**Given** a match status changes to 'applied'
**When** the update completes
**Then** a notification is created for the project creator
**Given** a match status changes to 'accepted'
**When** the update completes
**Then** a notification is created for the applicant

---

### Story 6.3: Build Notification Bell Component

As a user,
I want to see a notification bell with unread count,
So that I know when I have new notifications.

**Acceptance Criteria:**

**Given** I am logged in
**When** I view the header
**Then** I see a bell icon
**And** if I have unread notifications, I see a count badge
**When** I click the bell
**Then** the notification dropdown opens

---

### Story 6.4: Build Notification Dropdown

As a user,
I want to see my recent notifications in a dropdown,
So that I can quickly review them.

**Acceptance Criteria:**

**Given** I click the notification bell
**When** the dropdown opens
**Then** I see a list of recent notifications
**And** unread notifications are visually distinct
**When** I click a notification
**Then** it's marked as read
**And** I'm navigated to the relevant page

---

### Story 6.5: Implement Toast Notifications

As a user,
I want to see a toast when I get a new notification,
So that I'm alerted in real-time.

**Acceptance Criteria:**

**Given** I am on any page
**When** a new notification arrives via Realtime
**Then** a toast appears with the notification title
**And** the toast auto-dismisses after 5 seconds
**And** I can click the toast to navigate to the relevant page

---

### Story 6.6: Set Up Resend Email Service

As a developer,
I want Resend configured for sending emails,
So that I can send transactional emails.

**Acceptance Criteria:**

**Given** Resend API key is configured
**When** I call the email service
**Then** emails are sent successfully
**And** errors are logged appropriately

---

### Story 6.7: Implement Match Notification Emails

As a user,
I want to receive an email when I get a new match,
So that I'm notified even when not in the app.

**Acceptance Criteria:**

**Given** a new match is created
**When** the notification trigger fires
**Then** an email is sent to the matched user
**And** the email includes project title and match score
**And** the email has a link to view the match

---

### Story 6.8: Implement Acceptance Notification Emails

As a user,
I want to receive an email when my application is accepted,
So that I know I can start collaborating.

**Acceptance Criteria:**

**Given** my application is accepted
**When** the status update completes
**Then** an email is sent to me
**And** the email includes project title
**And** the email has a link to start messaging

---

## Epic 7: Messaging

**Goal:** Basic real-time chat, handoff to external platforms

### Story 7.1: Set Up Supabase Realtime for Messages

As a developer,
I want the client to subscribe to messages,
So that chat is real-time.

**Acceptance Criteria:**

**Given** I'm viewing a conversation
**When** a new message is sent
**Then** it appears instantly without refresh
**And** the subscription is scoped to the project

---

### Story 7.2: Create Message API Routes

As a developer,
I want API routes for sending messages,
So that the frontend can post messages.

**Acceptance Criteria:**

**Given** an authenticated request
**When** I call POST /api/messages with project_id and content
**Then** the message is saved
**And** only accepted match participants can send messages
**And** RLS policies are enforced

---

### Story 7.3: Build Simple Chat UI Component

As a user,
I want a simple chat interface,
So that I can message my matches.

**Acceptance Criteria:**

**Given** I'm in a conversation
**When** the chat component renders
**Then** I see message bubbles (mine on right, theirs on left)
**And** I see a text input and send button
**When** I type and click send
**Then** my message appears in the chat

---

### Story 7.4: Build Messages Page

As a user,
I want a page showing all my conversations,
So that I can manage my chats.

**Acceptance Criteria:**

**Given** I am logged in
**When** I visit /messages
**Then** I see a list of my conversations (accepted matches)
**And** each shows the other person's name and last message
**When** I click a conversation
**Then** the chat opens

---

### Story 7.5: Add Share Slack/Discord Action

As a user,
I want to easily share my Slack/Discord link,
So that we can continue collaboration outside the app.

**Acceptance Criteria:**

**Given** I'm in a chat
**When** I click "Share my Slack" or "Share my Discord"
**Then** my saved link is sent as a message
**And** if I haven't saved a link, I'm prompted to add it in profile

---

## Epic 8: UI/UX

**Goal:** Component library, all pages, responsive design

### Story 8.1: Design System Tokens

As a developer,
I want design tokens defined for colors, typography, spacing,
So that the UI is consistent.

**Acceptance Criteria:**

**Given** the project
**When** I check globals.css or tailwind.config
**Then** CSS variables are defined for primary, secondary, accent colors
**And** typography scale is defined
**And** spacing scale follows a consistent system

---

### Story 8.2: Build Button Variants

As a developer,
I want reusable button components,
So that buttons are consistent across the app.

**Acceptance Criteria:**

**Given** the Button component
**When** I use different variants
**Then** I can render primary, secondary, outline, ghost, destructive buttons
**And** all variants support loading state
**And** all variants are accessible

---

### Story 8.3: Build Form Components

As a developer,
I want reusable form components,
So that forms are consistent.

**Acceptance Criteria:**

**Given** the form components
**When** I build a form
**Then** I can use Input, Textarea, Select, DatePicker
**And** all components support error states
**And** all components are accessible with labels

---

### Story 8.4: Build Card Components

As a developer,
I want reusable card components,
So that content cards are consistent.

**Acceptance Criteria:**

**Given** the card components
**When** I render cards
**Then** I can use ProfileCard, ProjectCard, MatchCard
**And** cards have consistent padding, borders, shadows
**And** cards support hover states

---

### Story 8.5: Build Modal/Dialog Components

As a developer,
I want reusable modal components,
So that dialogs are consistent.

**Acceptance Criteria:**

**Given** the modal components
**When** I trigger a modal
**Then** it renders with backdrop
**And** it can be closed with X button or clicking outside
**And** it supports confirmation dialogs with actions

---

### Story 8.6: Build Landing Page

As a visitor,
I want an attractive landing page,
So that I understand what MeshIt does and want to sign up.

**Acceptance Criteria:**

**Given** I visit the root URL
**When** I'm not logged in
**Then** I see a hero section with tagline and CTA
**And** I see feature highlights (3 cards)
**And** I see social proof or stats
**And** I see clear sign-up buttons

---

### Story 8.7: Build Dashboard Layout

As a user,
I want a dashboard that shows my activity,
So that I can quickly access my projects and matches.

**Acceptance Criteria:**

**Given** I am logged in
**When** I visit /dashboard
**Then** I see my active projects
**And** I see my recent matches
**And** I see quick stats (matches this week, pending applications)
**And** I have quick actions to create project or view matches

---

### Story 8.8: Implement Responsive Breakpoints

As a user,
I want the app to work on mobile,
So that I can use it on any device.

**Acceptance Criteria:**

**Given** the app
**When** I view on mobile (< 768px)
**Then** navigation collapses to hamburger menu
**And** cards stack vertically
**And** forms are full-width
**And** touch targets are at least 44px

---

### Story 8.9: Add Loading States and Skeletons

As a user,
I want to see loading indicators,
So that I know the app is working.

**Acceptance Criteria:**

**Given** data is being fetched
**When** the page loads
**Then** I see skeleton loaders for cards
**And** buttons show loading spinners when submitting
**And** there's no layout shift when data loads

---

## Epic 9: Voice Agent (POST-MVP)

**Goal:** Conversational onboarding via Whisper + ElevenLabs

**Status:** POST-MVP - To be implemented after MVP is tested and stable

### Story 9.1: Implement Whisper Transcription Service

As a developer,
I want a service that transcribes audio to text,
So that I can process voice input.

**Acceptance Criteria:**

**Given** an audio blob from the browser
**When** I call the transcription service
**Then** I get accurate text transcription
**And** the service handles various audio formats
**And** errors are handled gracefully

---

### Story 9.2: Implement ElevenLabs TTS Service

As a developer,
I want a service that converts text to speech,
So that the voice agent can respond audibly.

**Acceptance Criteria:**

**Given** text to speak
**When** I call the TTS service
**Then** I get an audio file/stream
**And** the voice sounds natural
**And** the service handles long text appropriately

---

### Story 9.3: Create Voice Agent State Machine

As a developer,
I want a state machine for the conversation flow,
So that the agent guides users through onboarding.

**Acceptance Criteria:**

**Given** the voice agent starts
**When** it progresses through turns
**Then** it follows the 5-turn structure
**And** it tracks conversation history
**And** it handles interruptions gracefully

---

### Story 9.4: Build Voice Recording UI Component

As a user,
I want a voice recording interface,
So that I can speak to the agent.

**Acceptance Criteria:**

**Given** the voice UI
**When** I click the microphone button
**Then** recording starts with visual feedback
**And** I can stop recording
**And** the audio is sent for processing

---

### Story 9.5: Implement Conversation Turn Handling

As a system,
I want to process each conversation turn,
So that the agent can respond appropriately.

**Acceptance Criteria:**

**Given** user audio input
**When** the turn is processed
**Then** audio is transcribed
**And** the next agent prompt is determined
**And** the agent response is spoken via TTS

---

### Story 9.6: Extract Profile from Conversation

As a system,
I want to extract structured profile from the full conversation,
So that the profile is complete after onboarding.

**Acceptance Criteria:**

**Given** all conversation turns are complete
**When** extraction runs
**Then** structured profile data is generated
**And** all fields are populated from conversation context
**And** the user can review and edit before saving

---

### Story 9.7: Build Voice Onboarding Page

As a user,
I want a dedicated voice onboarding experience,
So that I can create my profile by talking.

**Acceptance Criteria:**

**Given** I choose voice onboarding
**When** I visit /onboarding/voice
**Then** the voice agent greets me
**And** I can respond by voice
**And** the conversation progresses through all turns
**And** I see my extracted profile at the end

---

### Story 9.8: Test Full Voice Onboarding Flow

As a tester,
I want the complete voice flow working end-to-end,
So that we can release it to users.

**Acceptance Criteria:**

**Given** a new user
**When** they complete voice onboarding
**Then** their profile is created with all fields
**And** their embedding is generated
**And** they are redirected to the dashboard
**And** the experience is smooth with no errors
