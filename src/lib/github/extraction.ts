/**
 * GitHub Profile Extraction Service
 * Extracts data from GitHub API for profile enrichment
 */

import {
  fetchGitHubUser,
  fetchUserRepos,
  fetchRepoLanguages,
  fetchRepoCommits,
  fetchRepoReadme,
  fetchCommitDetails,
} from './api';
import type {
  GitHubExtraction,
  GitHubRepo,
  CodeSnippet,
  ReadmeContent,
} from './types';

// Configuration
const CONFIG = {
  MAX_REPOS: 10, // Top 10 repos by stars
  MAX_COMMITS_PER_REPO: 5, // Recent commits per repo
  MAX_CODE_SNIPPETS: 10, // Total code snippets to analyze
  MAX_README_LENGTH: 2000, // Max characters per README
  MAX_CODE_SNIPPET_LENGTH: 500, // Max characters per code snippet
  COMMIT_LOOKBACK_DAYS: 180, // 6 months of commits
};

/**
 * File extensions to language mapping
 */
const FILE_EXTENSION_TO_LANGUAGE: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.py': 'Python',
  '.rb': 'Ruby',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.swift': 'Swift',
  '.cs': 'C#',
  '.cpp': 'C++',
  '.c': 'C',
  '.php': 'PHP',
  '.vue': 'Vue',
  '.svelte': 'Svelte',
};

/**
 * Get language from file path
 */
function getLanguageFromPath(filePath: string): string {
  const ext = filePath.substring(filePath.lastIndexOf('.'));
  return FILE_EXTENSION_TO_LANGUAGE[ext] || 'Unknown';
}

/**
 * Truncate text to max length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Sort repos by stars and filter out forks
 */
function getTopRepos(repos: GitHubRepo[], limit: number): GitHubRepo[] {
  return repos
    .filter((repo) => !repo.fork && !repo.archived && !repo.disabled)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, limit);
}

/**
 * Extract all profile data from GitHub
 */
export async function extractGitHubProfile(
  accessToken: string
): Promise<GitHubExtraction> {
  // 1. Fetch user profile
  const user = await fetchGitHubUser(accessToken);

  // 2. Fetch repositories (get more than needed to filter)
  const allRepos = await fetchUserRepos(accessToken, 100);
  const topRepos = getTopRepos(allRepos, CONFIG.MAX_REPOS);

  // 3. Aggregate languages from top repos
  const languageTotals: Record<string, number> = {};
  const languagePromises = topRepos.map(async (repo) => {
    const languages = await fetchRepoLanguages(
      accessToken,
      user.login,
      repo.name
    );
    return { repoName: repo.name, languages };
  });

  const repoLanguages = await Promise.all(languagePromises);
  for (const { languages } of repoLanguages) {
    for (const [lang, bytes] of Object.entries(languages)) {
      languageTotals[lang] = (languageTotals[lang] || 0) + bytes;
    }
  }

  // 4. Extract unique topics
  const allTopics = topRepos.flatMap((repo) => repo.topics || []);
  const uniqueTopics = [...new Set(allTopics)];

  // 5. Fetch commit messages and code snippets from recent commits
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - CONFIG.COMMIT_LOOKBACK_DAYS);
  const sinceISO = sinceDate.toISOString();

  const commitMessages: string[] = [];
  const codeSnippets: CodeSnippet[] = [];

  for (const repo of topRepos) {
    if (codeSnippets.length >= CONFIG.MAX_CODE_SNIPPETS) break;

    try {
      const commits = await fetchRepoCommits(
        accessToken,
        user.login,
        repo.name,
        sinceISO,
        CONFIG.MAX_COMMITS_PER_REPO
      );

      for (const commit of commits) {
        // Add commit message
        const message = commit.commit.message.split('\n')[0]; // First line only
        if (message && message.length > 10) {
          commitMessages.push(message);
        }

        // Get code snippets from latest commit
        if (codeSnippets.length < CONFIG.MAX_CODE_SNIPPETS) {
          try {
            const details = await fetchCommitDetails(
              accessToken,
              user.login,
              repo.name,
              commit.sha
            );

            for (const file of details.files) {
              if (codeSnippets.length >= CONFIG.MAX_CODE_SNIPPETS) break;

              // Only include code files with patches
              const language = getLanguageFromPath(file.filename);
              if (language !== 'Unknown' && file.patch) {
                codeSnippets.push({
                  repoName: repo.name,
                  filePath: file.filename,
                  language,
                  content: truncate(file.patch, CONFIG.MAX_CODE_SNIPPET_LENGTH),
                  commitMessage: message,
                });
              }
            }
          } catch {
            // Skip if can't fetch commit details
            continue;
          }
        }
      }
    } catch {
      // Skip repo if can't fetch commits
      continue;
    }
  }

  // 6. Fetch README contents
  const readmeContents: ReadmeContent[] = [];
  for (const repo of topRepos.slice(0, 5)) {
    // Top 5 READMEs
    try {
      const readme = await fetchRepoReadme(accessToken, user.login, repo.name);
      if (readme) {
        readmeContents.push({
          repoName: repo.name,
          content: truncate(readme, CONFIG.MAX_README_LENGTH),
        });
      }
    } catch {
      // Skip if no README
      continue;
    }
  }

  return {
    user,
    repos: topRepos,
    languages: languageTotals,
    topics: uniqueTopics,
    commitMessages,
    codeSnippets,
    readmeContents,
  };
}

/**
 * Get sorted languages from extraction
 */
export function getSortedLanguages(
  languages: Record<string, number>
): string[] {
  return Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);
}

/**
 * Calculate activity level based on commits and repo updates
 */
export function calculateActivityLevel(
  repos: GitHubRepo[]
): 'low' | 'medium' | 'high' {
  const now = new Date();
  const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
  const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));

  const recentlyUpdated = repos.filter(
    (repo) => new Date(repo.pushed_at) > threeMonthsAgo
  ).length;

  const moderatelyUpdated = repos.filter(
    (repo) =>
      new Date(repo.pushed_at) > sixMonthsAgo &&
      new Date(repo.pushed_at) <= threeMonthsAgo
  ).length;

  if (recentlyUpdated >= 5) return 'high';
  if (recentlyUpdated >= 2 || moderatelyUpdated >= 5) return 'medium';
  return 'low';
}

/**
 * Estimate experience level from raw metrics (before LLM analysis)
 */
export function estimateExperienceFromMetrics(
  repoCount: number,
  totalStars: number,
  accountAgeYears: number
): 'junior' | 'intermediate' | 'senior' | 'lead' {
  // Simple heuristic - LLM will refine this
  const score =
    Math.min(repoCount, 50) * 0.5 +
    Math.min(totalStars, 1000) * 0.01 +
    accountAgeYears * 2;

  if (score >= 40) return 'lead';
  if (score >= 25) return 'senior';
  if (score >= 10) return 'intermediate';
  return 'junior';
}

/**
 * Prepare data for LLM analysis
 */
export function prepareAnalysisInput(extraction: GitHubExtraction) {
  const languages = getSortedLanguages(extraction.languages);
  const totalStars = extraction.repos.reduce(
    (sum, repo) => sum + repo.stargazers_count,
    0
  );
  const accountCreated = new Date(extraction.user.created_at);
  const accountAgeYears =
    (Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24 * 365);

  return {
    username: extraction.user.login,
    languages: languages.slice(0, 10),
    topics: extraction.topics.slice(0, 20),
    recentCommits: extraction.commitMessages.slice(0, 30),
    codeSnippets: extraction.codeSnippets,
    readmeSnippets: extraction.readmeContents.map((r) => r.content).slice(0, 5),
    repoDescriptions: extraction.repos
      .filter((r) => r.description)
      .map((r) => `${r.name}: ${r.description}`)
      .slice(0, 10),
    repoCount: extraction.repos.length,
    totalStars,
    accountAge: Math.round(accountAgeYears * 10) / 10,
  };
}
