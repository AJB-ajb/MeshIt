# Epic 3: Profile Management

**Status:** Ready for Development  
**Priority:** P0  
**Dependencies:** E1 (Foundation)  
**Blocks:** E4 (Project Management)  
**Parallel With:** E2, E8

## Epic Goal

Profile CRUD operations, AI extraction from text, embedding generation for matching.

## Stories

| Story | Title | Status | Dependencies |
|-------|-------|--------|--------------|
| 3.1 | Implement Gemini Extraction Service | ready-for-dev | API key only |
| 3.2 | Implement OpenAI Embedding Service | ready-for-dev | API key only |
| 3.3 | Create Profile Extraction API Route | ready-for-dev | 3.1, E1-S10 |
| 3.4 | Create Profile CRUD API Routes | ready-for-dev | E1-S4, E1-S10 |
| 3.5 | Build Text-Based Onboarding Page | ready-for-dev | 3.3, 3.4 |
| 3.6 | Build Profile Edit Page | ready-for-dev | 3.4 |
| 3.7 | Store Profile Embeddings | ready-for-dev | 3.2, E1-S4 |

## FR Coverage

- FR3: Users can create profile via text input
- FR4: AI extracts structured data from text
- FR5: Users can edit AI-extracted profile data
- FR8: System generates embedding vectors for profiles

## Estimated Effort

~9.5 hours total
