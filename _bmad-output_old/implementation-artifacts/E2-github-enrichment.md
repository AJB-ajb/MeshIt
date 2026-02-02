# Epic 2: GitHub Enrichment

**Status:** Ready for Development  
**Priority:** P1  
**Dependencies:** E1 (Foundation - GitHub OAuth)  
**Blocks:** None (optional merge with E3)  
**Parallel With:** E3, E8

## Epic Goal

Auto-extract profile data from GitHub repos on OAuth login to enrich user profiles.

## Stories

| Story | Title | Status | Dependencies |
|-------|-------|--------|--------------|
| 2.1 | Implement GitHub API Client | ready-for-dev | E1-S6 |
| 2.2 | Create Repo/Language Extraction | ready-for-dev | 2.1 |
| 2.3 | Build Profile Inference | ready-for-dev | 2.2 |
| 2.4 | Create Profile Merger | ready-for-dev | 2.3, E3-S1 |
| 2.5 | Store GitHub Profile Data | ready-for-dev | E1-S4 |
| 2.6 | Add GitHub Sync on OAuth Callback | ready-for-dev | 2.4, 2.5, E1-S10 |

## FR Coverage

- FR6: System extracts GitHub profile data (languages, repos, activity) on GitHub OAuth
- FR7: System merges GitHub data with text profile

## Estimated Effort

~7 hours total
