# Epic 5: Matching Engine

**Status:** Ready for Development  
**Priority:** P0  
**Dependencies:** E3 (Profile embeddings), E4 (Project embeddings)  
**Blocks:** E6 (Notifications), E7 (Messaging)  
**Parallel With:** None (critical path)

## Epic Goal

Semantic matching between profiles and projects using pgvector cosine similarity.

## Stories

| Story | Title | Status | Dependencies |
|-------|-------|--------|--------------|
| 5.1 | Implement Profile-to-Project Matching | ready-for-dev | E3-S7, E4-S6 |
| 5.2 | Implement Project-to-Profile Matching | ready-for-dev | E3-S7, E4-S6 |
| 5.3 | Create Match API Routes | ready-for-dev | 5.1, 5.2 |
| 5.4 | Build Match Results Page | ready-for-dev | 5.3 |
| 5.5 | Build Match Detail Page | ready-for-dev | 5.3 |
| 5.6 | Generate Match Explanations | ready-for-dev | 5.1, 5.2 |

## FR Coverage

- FR14: System matches profiles to projects using semantic similarity
- FR15: Match results show similarity score (0-100%)
- FR16: System generates text explanation for each match
- FR17: Users can browse matches for their profile

## Estimated Effort

~8 hours total
