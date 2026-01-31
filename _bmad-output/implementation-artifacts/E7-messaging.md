# Epic 7: Messaging

**Status:** Ready for Development  
**Priority:** P1  
**Dependencies:** E5 (Matching Engine)  
**Blocks:** None  
**Parallel With:** E6

## Epic Goal

Basic messaging for collaboration handoff to external platforms (Slack, Discord, LinkedIn).

## Stories

| Story | Title | Status | Dependencies |
|-------|-------|--------|--------------|
| 7.1 | Create Message API Routes | ready-for-dev | E1-S4, E1-S10 |
| 7.2 | Build Message Initiation UI | ready-for-dev | 7.1, E5-S5 |
| 7.3 | Build Conversation List Page | ready-for-dev | 7.1 |
| 7.4 | Build Conversation Detail Page | ready-for-dev | 7.1 |
| 7.5 | Add Real-time Message Updates | ready-for-dev | 7.1, E6-S1 |

## FR Coverage

- FR22: Users can initiate contact from a match
- FR23: Basic in-app messaging for handoff
- FR24: Users can share external contact info (Slack, Discord, LinkedIn)
- FR25: Message notifications trigger in-app and email

## Estimated Effort

~6.5 hours total

## Scope Note

Messaging in MVP is intentionally basic - designed for initial contact and handoff to external platforms (Slack, Discord, LinkedIn, etc.). Not a full chat system.
