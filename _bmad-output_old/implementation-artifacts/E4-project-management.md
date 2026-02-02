# Epic 4: Project Management

**Status:** Ready for Development  
**Priority:** P0  
**Dependencies:** E1 (Foundation), E3 (Profile - for embeddings)  
**Blocks:** E5 (Matching Engine)  
**Parallel With:** E2, E8

## Epic Goal

Project CRUD operations, AI extraction from project descriptions, embedding generation, expiration logic.

## Stories

| Story | Title | Status | Dependencies |
|-------|-------|--------|--------------|
| 4.1 | Implement Project Extraction Service | ready-for-dev | 3.1 (Gemini) |
| 4.2 | Create Project CRUD API Routes | ready-for-dev | E1-S4, E1-S10 |
| 4.3 | Build Project Creation Page | ready-for-dev | 4.1, 4.2 |
| 4.4 | Build Project List Page | ready-for-dev | 4.2 |
| 4.5 | Build Project Detail Page | ready-for-dev | 4.2 |
| 4.6 | Store Project Embeddings | ready-for-dev | 3.2, E1-S4 |
| 4.7 | Implement Project Expiration | ready-for-dev | E1-S4 |

## FR Coverage

- FR9: Users can create projects via text description
- FR10: AI extracts structured project data
- FR11: Users can edit project details
- FR12: Projects auto-expire after 30 days
- FR13: Users can reactivate expired projects

## Estimated Effort

~9.5 hours total
