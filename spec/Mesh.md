# Mesh

Project collaboration matching platform for small teams (2-5 people).

## Problem
- Finding collaborators requires high effort (scanning Slack/WhatsApp channels) 
- Large communities don't scale for individual matching
- Skill levels and personal compatibility are rarely explicit

- Project first approach
- Fast setup first approach
- Natural language interface

### Key Issues
- Adoption, fast usability
- Very low rate of old project, high responsiveness of users

## Scope
- Primary: Small teams (2-5 people)
- Secondary: Medium teams (5-15 people)
- Focus on projects; leisure / socializing also supported
- Don't artificially limit applicability

### Particular Use Cases
- Hackathon teammates
- Course project partners
- Spontaneous project events
- Mentor / mentee matching
- Finding people that want to work on a project among friends
  - Friends mode: only find project matches among friends 

## Features


### UX
- Setup profile page
  - Enter personal profile via simple text description or transcript from voice (30s to 1min, possibly prompts that the person can answer)
  - Profiles / Projects can be exported to text / markdown for easy sharing in other platforms
  - Project has expiration date; can be reactivated
  
- Create project page
  - Fully automated project creation from Slack/WhatsApp paste or voice transcript
  - auto-create project thumbnail from transcript (Gemini / nano-banana)
- Filter/find projects page
  - filter via natural language / voice transcript
  - approve projects: "I would like to collaborate on this project"
- Match page:
  - Go through approvals from other users to have an application mechanic

- Messaging page:
  - Basic instant messaging
  - People can share their whatsapp / slack / telegram / discord links via button for direct integration
- Notifications:
  - LangChain for NLP processing
    - Extracting project information from voice / text
    - Filling a project with details (e.g. web search for APIs / places / etc.)
  - For time-critical projects, instant notifications
  - Daily digest for other projects
    - Possibly AI-generated digest

- Cursor / Antigravity for development
- n8n for notifications 
- v0: UI prototyping 
  - extract screenshots if UI looks good
- Miro for planning


### Verification
- Connecting with GitHub, LinkedIn for professional verification
  - possibly AI checking profiles agree
  - possibly using Playwright
  
### Use Cases
- Find collaborators for a project
- Find mentors for a project
- Find mentees for a project
- Find friends for a project (more person focus)


### Matching
See [Matching.md](Matching.md) for detailed matching algorithm considerations.

### Core
- Fast posting (paste from Slack/WhatsApp, AI extracts features)
- Project keywords for similarity matching
- One-click OAuth login, no setup required
- Notifications: daily digest + instant for high matches

### Future
- Calendar integration (auto-suggest time slots / auto update availability)
- Location suggestions
- Friend-based filtering
- Rating system (1-5 scale, post-project reviews)
- AI-based user interface
  - navigate, search and filter via natural language
  - this automatically translates to UI actions

- Extension: Preferential approval
  - I.e. rate projects, if multiple dates are there, the first one is matched preferentially / "Super-like"

## Rating System
- No visible aggregate scores
- Objective phrasing (e.g. "Punctuality: 90% on time")
- Compatibility scores derived from ratings
- Goal: honest feedback for growth, not reputation gaming

## Design Principles
- Minimal friction
- No required configuration
- Strong filters available (location, skill level)

## Motivation
- Collaboration is a core human need
- Small teams (2-4) outperform large groups for most tasks
- Current tools (Slack, WhatsApp) don't scale for matching
- Pair work is undervalued and underutilized

## Competitors
- Meetup.com, Facebook groups: focus on large groups, high friction

## Monetization
- Free tier (full functionality)
- Business tier (company usage)
- Premium: analytics, internal rating access

## Tech Stack

### Core
- **Next.js 16** (TypeScript, App Router)
- **React 19**
- **pnpm** (package manager)
- **fnm** (Node.js version manager)

### Database
- **PostgreSQL** with **Prisma 7**
- **@prisma/adapter-pg** (connection adapter)
- **@prisma/extension-accelerate** (connection pooling)

### Authentication
- **NextAuth.js v5** (Google OAuth)
- **@auth/prisma-adapter**

### Testing
- **Playwright** (E2E testing)
- **Vitest** (unit/integration testing)

### Deployment
- **Vercel**

## Development

### Approach
- Specification-driven

### Key Challenges
- Matching algorithm design


### Hackathon MVP
- PWA website
- Google OAuth
- Weighted matching
- Free tier only
- No availability-based matching (only time commitment)