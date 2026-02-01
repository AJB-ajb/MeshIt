/**
 * TypeScript types for GitHub integration
 * Used for profile enrichment and analysis
 */

// ============================================
// GITHUB API RESPONSE TYPES
// ============================================

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  size: number;
  fork: boolean;
  archived: boolean;
  disabled: boolean;
  topics: string[];
  visibility: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  type: 'file' | 'dir';
  content?: string; // Base64 encoded content
  encoding?: string;
}

// ============================================
// EXTRACTION TYPES
// ============================================

export interface GitHubExtraction {
  user: GitHubUser;
  repos: GitHubRepo[];
  languages: Record<string, number>; // Language -> bytes
  topics: string[];
  commitMessages: string[];
  codeSnippets: CodeSnippet[];
  readmeContents: ReadmeContent[];
}

export interface CodeSnippet {
  repoName: string;
  filePath: string;
  language: string;
  content: string;
  commitMessage: string;
}

export interface ReadmeContent {
  repoName: string;
  content: string;
}

// ============================================
// ANALYSIS TYPES
// ============================================

export interface GitHubAnalysisInput {
  username: string;
  languages: string[];
  topics: string[];
  recentCommits: string[];
  codeSnippets: CodeSnippet[];
  readmeSnippets: string[];
  repoDescriptions: string[];
  repoCount: number;
  totalStars: number;
  accountAge: number; // in years
}

export interface GitHubAnalysisOutput {
  inferredSkills: string[];
  inferredInterests: string[];
  codingStyle: string;
  collaborationStyle: 'async' | 'sync' | 'hybrid';
  experienceLevel: 'junior' | 'intermediate' | 'senior' | 'lead';
  experienceSignals: string[];
  suggestedBio: string;
}

// ============================================
// PROFILE DATA TYPES
// ============================================

export interface GitHubProfileData {
  // GitHub user info
  githubId: string;
  githubUsername: string;
  githubUrl: string;
  avatarUrl: string;
  
  // Extracted data
  primaryLanguages: string[];
  topics: string[];
  repoCount: number;
  totalStars: number;
  
  // Inferred data (from LLM analysis)
  inferredSkills: string[];
  inferredInterests: string[];
  codingStyle: string;
  collaborationStyle: 'async' | 'sync' | 'hybrid';
  experienceLevel: 'junior' | 'intermediate' | 'senior' | 'lead';
  experienceSignals: string[];
  suggestedBio: string;
  
  // Activity metrics
  activityLevel: 'low' | 'medium' | 'high';
  lastActiveAt: string;
  
  // Raw data for future analysis
  rawRepos: GitHubRepo[];
  
  // Sync metadata
  lastSyncedAt: string;
  syncStatus: 'pending' | 'syncing' | 'completed' | 'failed';
  syncError?: string;
}

// ============================================
// DATABASE TYPES
// ============================================

export interface GitHubProfileRow {
  user_id: string;
  github_id: string;
  github_username: string;
  github_url: string;
  avatar_url: string;
  primary_languages: string[];
  topics: string[];
  repo_count: number;
  total_stars: number;
  inferred_skills: string[];
  inferred_interests: string[];
  coding_style: string;
  collaboration_style: string;
  experience_level: string;
  experience_signals: string[];
  suggested_bio: string;
  activity_level: string;
  last_active_at: string;
  raw_repos: GitHubRepo[];
  last_synced_at: string;
  sync_status: string;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface GitHubProfileInsert {
  user_id: string;
  github_id: string;
  github_username: string;
  github_url: string;
  avatar_url: string;
  primary_languages?: string[];
  topics?: string[];
  repo_count?: number;
  total_stars?: number;
  inferred_skills?: string[];
  inferred_interests?: string[];
  coding_style?: string;
  collaboration_style?: string;
  experience_level?: string;
  experience_signals?: string[];
  suggested_bio?: string;
  activity_level?: string;
  last_active_at?: string;
  raw_repos?: GitHubRepo[];
  last_synced_at?: string;
  sync_status?: string;
  sync_error?: string | null;
}
