# Epic 6: Notifications

**Status:** Ready for Development  
**Priority:** P1  
**Dependencies:** E5 (Matching Engine)  
**Blocks:** None  
**Parallel With:** E7

## Epic Goal

Real-time in-app notifications via Supabase Realtime, email notifications via Resend.

## Stories

| Story | Title | Status | Dependencies |
|-------|-------|--------|--------------|
| 6.1 | Set Up Supabase Realtime | ready-for-dev | E1-S4 |
| 6.2 | Create Notification Service | ready-for-dev | 6.1 |
| 6.3 | Build Notification Bell Component | ready-for-dev | 6.2 |
| 6.4 | Create Notification List Page | ready-for-dev | 6.2 |
| 6.5 | Implement Email Notifications | ready-for-dev | 6.2 |
| 6.6 | Trigger Match Notifications | ready-for-dev | 6.2, E5 |
| 6.7 | Implement Match Notification Emails | ready-for-dev | 6.5, E5-S7 |
| 6.8 | Implement Acceptance Notification Emails | ready-for-dev | 6.5, E5-S7 |

## FR Coverage

- FR18: Users receive in-app notifications for new matches
- FR19: Users receive in-app notifications for messages
- FR20: Users can mark notifications as read
- FR21: Users receive email notifications (new match, message)
- FR22: Users receive email when accepted to a project

## Estimated Effort

~9 hours total
