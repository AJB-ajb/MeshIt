# GitHub Workflow Guide for Agile Development Teams
## Best Practices from Senior Product Management & Engineering Leadership

**Author Role**: Senior Manager, Product Manager, Product Owner  
**Target Audience**: 3-Developer Agile Teams  
**Last Updated**: January 31, 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Philosophy & Principles](#philosophy--principles)
3. [Repository Setup & Architecture](#repository-setup--architecture)
4. [Branch Strategy](#branch-strategy)
5. [Epic & Story Management](#epic--story-management)
6. [Complete Development Workflow](#complete-development-workflow)
7. [Testing Strategy](#testing-strategy)
8. [Code Review Process](#code-review-process)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Deployment Strategy](#deployment-strategy)
11. [Team Collaboration](#team-collaboration)
12. [Advanced Git Techniques](#advanced-git-techniques)
13. [Troubleshooting](#troubleshooting)
14. [Metrics & KPIs](#metrics--kpis)
15. [Quick Reference](#quick-reference)

---

## Executive Summary

This document outlines enterprise-grade Git workflows optimized for small, high-velocity teams. As a senior product leader, I've synthesized best practices from Spotify, GitLab, GitHub, and Atlassian's development methodologies.

**Core Philosophy**: 
> "Ship fast, break nothing. Test everything, deploy confidently."

**Key Metrics We Optimize For**:
- Deployment frequency: Multiple times per day
- Lead time for changes: < 1 day
- Mean time to recovery: < 1 hour
- Change failure rate: < 5%

---

## Philosophy & Principles

### The 10 Commandments of Git Workflow

1. **Main is Sacred** - Always production-ready, always deployable
2. **Feature Isolation** - One feature = one branch = one PR
3. **Test Before Merge** - All tests pass, no exceptions
4. **Review Everything** - No code reaches main without review
5. **Commit Often** - Small, atomic, reversible changes
6. **Document Why** - Commit messages explain reasoning, not just what
7. **Automate Relentlessly** - If you do it twice, automate it
8. **Fail Fast** - Catch issues in CI, not production
9. **Communicate Continuously** - Over-communicate blockers and progress
10. **Measure Everything** - What gets measured gets improved

### Why This Matters from a Product Perspective

**Business Impact**:
- Faster time-to-market for features
- Reduced technical debt accumulation
- Lower defect escape rate to production
- Improved team velocity and predictability
- Better work-life balance (fewer weekend firefights)

**Technical Impact**:
- Cleaner git history enables better debugging
- Isolated features reduce blast radius of bugs
- Comprehensive testing catches issues early
- Automated pipelines free developers for creative work

---

## Repository Setup & Architecture

### Initial Repository Structure

```bash
project-root/
├── .github/
│   ├── workflows/           # GitHub Actions CI/CD
│   │   ├── ci.yml
│   │   ├── deploy-staging.yml
│   │   └── deploy-production.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── story.md
│   └── CODEOWNERS          # Auto-assign reviewers
├── frontend/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── README.md
├── backend/
│   ├── src/
│   ├── tests/
│   ├── requirements.txt
│   └── README.md
├── docs/
│   ├── architecture.md
│   ├── api-documentation.md
│   └── deployment-guide.md
├── scripts/
│   ├── setup-dev-environment.sh
│   └── run-all-tests.sh
├── .gitignore
├── .editorconfig           # Consistent coding styles
├── .pre-commit-config.yaml # Pre-commit hooks
├── docker-compose.yml      # Local development environment
├── README.md
└── CONTRIBUTING.md
```

### Critical Configuration Files

#### `.gitignore`

```gitignore
# Dependencies
node_modules/
venv/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python

# Environment variables - CRITICAL: Never commit secrets
.env
.env.local
.env.*.local
*.key
*.pem
secrets/

# Build outputs
build/
dist/
*.egg-info/
.next/
out/

# IDE and Editor
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Testing
coverage/
.coverage
htmlcov/
.pytest_cache/
.tox/

# Logs
*.log
logs/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
Thumbs.db
.DS_Store
desktop.ini
```

#### `README.md` Template

```markdown
# Project Name

## Quick Start

\`\`\`bash
# Clone repository
git clone https://github.com/your-team/project-name.git
cd project-name

# Run setup script
./scripts/setup-dev-environment.sh

# Start development servers
docker-compose up
\`\`\`

## Team
- **Product Owner**: [Name] - Strategic direction
- **Tech Lead**: [Name] - Architecture decisions
- **Frontend Lead**: [Name] - UI/UX implementation
- **Backend Lead**: [Name] - API and data layer

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind
- **Backend**: Node.js, Express, PostgreSQL
- **DevOps**: Docker, GitHub Actions, AWS

## Documentation
- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api-documentation.md)
- [Contributing Guide](CONTRIBUTING.md)

## Support
- Slack: #project-name
- Issues: GitHub Issues
- Wiki: [Project Wiki](link)
```

### Branch Protection Rules (GitHub Settings)

**For `main` branch**:

```yaml
Protection Rules:
  ✅ Require pull request reviews before merging
     - Required approvals: 1
     - Dismiss stale reviews when new commits are pushed
     - Require review from Code Owners
  
  ✅ Require status checks to pass before merging
     - Require branches to be up to date before merging
     - Required checks:
       - CI/Build
       - Unit Tests
       - Integration Tests
       - Linting
       - Security Scan
  
  ✅ Require conversation resolution before merging
  
  ✅ Require signed commits (for high-security projects)
  
  ✅ Include administrators (no exceptions)
  
  ✅ Restrict pushes that create matching branches
  
  ✅ Allow force pushes: DISABLED
  
  ✅ Allow deletions: DISABLED
```

---

## Branch Strategy

### Branch Types & Naming Conventions

#### Main Branches

1. **`main`** (Production)
   - Always deployable
   - Reflects current production state
   - Protected, requires PR
   - All tests must pass
   - **Lifetime**: Permanent

2. **`staging`** (Optional - Pre-Production)
   - Integration testing environment
   - Mirror of production setup
   - Merged from feature branches before main
   - **Lifetime**: Permanent
   - **Use case**: Teams needing additional QA step

### Temporary Branches

#### Feature Branches

```
feature/<issue-number>-<brief-description>
```

**Examples**:
- `feature/123-user-authentication`
- `feature/456-payment-integration`
- `feature/789-dashboard-analytics`

**Characteristics**:
- Branch from: `main`
- Merge into: `main`
- Lifetime: Until feature complete and merged
- Naming: Lowercase, hyphens, descriptive

#### Bugfix Branches

```
fix/<issue-number>-<brief-description>
```

**Examples**:
- `fix/234-login-validation-error`
- `fix/567-memory-leak-api`
- `fix/890-broken-css-mobile`

#### Hotfix Branches

```
hotfix/<issue-number>-<brief-description>
```

**Examples**:
- `hotfix/999-critical-security-patch`
- `hotfix/888-production-down`

**Characteristics**:
- Branch from: `main` (current production)
- Merge into: `main`
- Priority: CRITICAL
- Can bypass some checks if emergency

### Branch Naming Best Practices

**DO**:
- Use lowercase letters
- Use hyphens for separation
- Include issue/ticket number
- Be descriptive but concise (< 50 characters)

**DON'T**:
- Use spaces or special characters
- Make them too long
- Use vague descriptions like `fix-bug`

---

## Complete Development Workflow

### The Perfect Feature Development Cycle

```
1. Planning → 2. Branch Creation → 3. Development → 
4. Local Testing → 5. Push → 6. Pull Request → 
7. Code Review → 8. CI/CD Checks → 9. Merge → 
10. Deploy → 11. Monitor → 12. Cleanup
```

### Step-by-Step Workflow

#### Step 1: Planning & Story Refinement

**Developer Actions**:
1. Review story in sprint planning
2. Ask clarifying questions
3. Estimate effort
4. Identify dependencies
5. Assign to yourself

---

#### Step 2: Environment Setup & Branch Creation

**Pre-flight Checklist**:
- [ ] Local environment up to date
- [ ] Dependencies installed
- [ ] Tests passing on main
- [ ] Story assigned to you
- [ ] Understand acceptance criteria

**Commands**:

```bash
# 1. Make sure you're on main branch
git checkout main

# 2. Pull latest changes from remote
git pull origin main

# 3. Verify everything is clean
git status
# Should show: "nothing to commit, working tree clean"

# 4. Run tests to ensure main is stable
npm test  # or your test command
# All tests should pass

# 5. Create new feature branch
git checkout -b feature/123-user-authentication

# Alternative newer syntax
git switch -c feature/123-user-authentication

# 6. Verify you're on new branch
git branch
# Should show: * feature/123-user-authentication

# 7. Push branch to remote immediately (sets up tracking)
git push -u origin feature/123-user-authentication
```

**Why push empty branch immediately?**
- Sets up remote tracking
- Makes branch visible to team
- Enables early collaboration
- Allows work-in-progress discussion

---

#### Step 3: Development

**Best Practices**:
- Write tests FIRST (TDD approach)
- Commit frequently (every 30-60 minutes)
- Use meaningful commit messages
- Keep changes focused on the story
- Update documentation as you go

**Commit Message Format** (Conventional Commits):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting)
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance
- `ci`: CI/CD changes

**Examples**:

```bash
# Simple commit
git commit -m "feat(auth): add login form component #123"

# Detailed commit with body
git commit -m "feat(auth): implement JWT token generation #123

- Add jsonwebtoken library
- Create token signing function
- Set expiration to 24 hours
- Include user ID and email in payload

Closes #123"

# Bug fix
git commit -m "fix(auth): resolve password validation error #456"

# Breaking change
git commit -m "feat(api)!: change authentication endpoint structure #123

BREAKING CHANGE: /api/login now requires email instead of username"
```

**Development Loop**:

```bash
# 1. Write code
# ... edit files ...

# 2. Check what changed
git status
git diff

# 3. Stage specific files (recommended)
git add src/components/LoginForm.jsx
git add src/api/auth.js
git add tests/auth.test.js

# 4. Review what you're about to commit
git diff --staged

# 5. Commit with message
git commit -m "feat(auth): add login form component #123"

# 6. Push to remote periodically (every few commits)
git push
```

**How Often to Commit?**

| Scenario | Commit Frequency |
|----------|------------------|
| Working on complex feature | Every 30-60 minutes |
| Quick bug fix | After fix complete |
| Refactoring | After each logical change |
| Adding tests | After each test suite |
| End of work session | ALWAYS |

---

#### Step 4: Local Testing

**Testing Checklist Before Pushing**:

```bash
# 1. Run linter
npm run lint
# Fix all linting errors

# 2. Run unit tests
npm test
# All tests must pass

# 3. Run integration tests (if applicable)
npm run test:integration

# 4. Check test coverage
npm run test:coverage
# Ensure coverage > 80%

# 5. Build the project
npm run build
# Must build without errors

# 6. Manual testing
npm run dev
# Test your changes in browser/app

# 7. Check for console errors
# Open browser dev tools

# 8. Test edge cases
# - Empty inputs
# - Invalid data
# - Network failures
```

**Local Testing Script** (Create `scripts/pre-push-checks.sh`):

```bash
#!/bin/bash
set -e  # Exit on first error

echo "🔍 Running pre-push checks..."

echo "📝 Linting..."
npm run lint

echo "🧪 Running unit tests..."
npm test

echo "🔨 Building..."
npm run build

echo "✅ All checks passed! Safe to push."
```

---

#### Step 5: Keeping Branch Updated

**Why Keep Branch Updated?**
- Reduces merge conflicts
- Catches integration issues early
- Ensures you're working with latest code
- Makes final merge easier

**Frequency**: At least daily

**Method 1: Rebase (Recommended for Clean History)**:

```bash
# 1. Fetch latest from remote
git fetch origin

# 2. Stash any uncommitted work (if needed)
git stash

# 3. Rebase your branch on top of main
git rebase origin/main

# If conflicts occur:
# a. Git will pause and show conflicted files
# b. Open each file and resolve conflicts
#    Look for markers:
#    <<<<<<< HEAD
#    Your changes
#    =======
#    Changes from main
#    >>>>>>> commit-hash
# c. Edit files to keep correct code
# d. Stage resolved files
git add <resolved-files>

# e. Continue rebase
git rebase --continue

# If you make a mistake:
git rebase --abort  # Start over

# 4. Restore stashed work (if any)
git stash pop

# 5. Force push (required after rebase)
git push --force-with-lease

# --force-with-lease is safer than --force
```

**Method 2: Merge (Simpler, Creates Merge Commits)**:

```bash
# 1. Fetch latest from remote
git fetch origin

# 2. Merge main into your branch
git merge origin/main

# If conflicts occur:
# a. Resolve conflicts in each file
# b. Stage resolved files
git add <resolved-files>

# c. Complete merge
git commit -m "merge: resolve conflicts with main"

# 3. Push to remote
git push
```

**Rebase vs Merge - When to Use**:

| Scenario | Use Rebase | Use Merge |
|----------|-----------|-----------|
| Clean history desired | ✅ | ❌ |
| Team uses rebase workflow | ✅ | ❌ |
| Unfamiliar with rebase | ❌ | ✅ |
| Hackathon/tight deadline | ❌ | ✅ |
| Solo developer | ✅ | Either |

---

#### Step 6: Create Pull Request

**Pre-PR Checklist**:

- [ ] All acceptance criteria met
- [ ] All tests passing locally
- [ ] Linting passes
- [ ] Code builds successfully
- [ ] Branch is up to date with main
- [ ] Commit messages are clean
- [ ] No console errors
- [ ] Documentation updated
- [ ] No sensitive data in commits

**Pull Request Template**:

```markdown
## Description
Brief description of changes

## Related Issue
Closes #123

## Type of Change
- [ ] 🐛 Bug fix
- [x] ✨ New feature
- [ ] 💥 Breaking change
- [ ] 📝 Documentation update
- [ ] ♻️ Code refactoring

## Changes Made
- Added LoginForm component with validation
- Implemented JWT token generation
- Created authentication middleware
- Added comprehensive unit tests

## Testing Completed
- [x] Unit tests added/updated
- [x] Integration tests added/updated
- [x] Manual testing in dev environment
- [x] Tested edge cases

**Test Coverage**: 85%

## Security Considerations
- [ ] No security implications
- [x] Input validation present
- [x] Authentication implemented
- [x] SQL injection protected

## Deployment Notes
- [ ] Standard deployment
- [x] Requires environment variable: `JWT_SECRET`

## Checklist
- [x] Code follows project style guidelines
- [x] Self-review completed
- [x] Documentation updated
- [x] Tests added and passing
- [x] Branch is up to date with main

## For Reviewers

**Testing Instructions**:
1. Checkout this branch: `git checkout feature/123-user-authentication`
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Start dev server: `npm run dev`
5. Test with valid/invalid credentials

**Review Focus Areas**:
- Security: Password handling
- Validation: Input sanitization
- Error handling: User-friendly messages
```

---

#### Step 7: Code Review Process

**As PR Author**:

1. **Create comprehensive PR description**
2. **Assign reviewers** (minimum 1)
3. **Add labels** (type, component, priority)
4. **Link to Issue** (use "Closes #123")
5. **Respond to feedback promptly** (within 4 hours)
6. **Don't take feedback personally**

**As Code Reviewer**:

1. **Review within 4 hours**
2. **Checkout and test locally**:

```bash
# Fetch PR
git fetch origin pull/123/head:pr-123
git checkout pr-123

# Or use GitHub CLI
gh pr checkout 123

# Test it
npm install
npm test
npm run dev
```

3. **Review checklist**:
   - [ ] Code meets acceptance criteria
   - [ ] Tests are comprehensive
   - [ ] No obvious bugs
   - [ ] Follows code style
   - [ ] No security vulnerabilities
   - [ ] Documentation updated

4. **Leave constructive feedback**

✅ **GOOD**:
```
This validation logic could be simplified:

Instead of:
if (password.length < 8) {
  return false;
} else {
  return true;
}

Consider:
return password.length >= 8;

Reason: More concise and easier to read.
```

❌ **BAD**:
```
This code is terrible. Fix it.
```

---

#### Step 8: CI/CD Pipeline Validation

**What Happens Automatically**:

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  pull_request:
    branches: [ main ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
```

**Pipeline Stages**:
1. **Linting** - Code style check
2. **Unit Tests** - Component tests
3. **Integration Tests** - API tests
4. **Build** - Production build
5. **Security Scan** - Vulnerability check

**If Pipeline Fails**:

```bash
# 1. Click on failed check in PR
# 2. View logs
# 3. Fix locally
npm run lint  # If linting failed
npm test      # If tests failed
npm run build # If build failed

# 4. Commit and push
git add .
git commit -m "fix(ci): resolve build error"
git push
# Pipeline will automatically re-run
```

---

#### Step 9: Merge to Main

**Pre-Merge Final Checklist**:

- [ ] ✅ At least 1 approval
- [ ] ✅ All conversations resolved
- [ ] ✅ All CI checks passing
- [ ] ✅ Branch up to date with main
- [ ] ✅ No merge conflicts

**Merge Strategies**:

**1. Squash and Merge (Recommended)**

```
Pros:
✅ Clean, linear history
✅ One commit per feature
✅ Easy to revert
✅ Easier to read git log

When to use:
- Feature branches
- Multiple WIP commits
- Want clean history
```

**2. Rebase and Merge**

```
Pros:
✅ Linear history
✅ Preserves individual commits
✅ Can cherry-pick commits

When to use:
- Well-organized commits
- Want to preserve commit details
```

**3. Create a Merge Commit**

```
Pros:
✅ Preserves complete history
✅ Shows integration points

Cons:
❌ Cluttered history

When to use:
- Need full historical context
```

**After Merge**:

```bash
# 1. Delete remote branch (GitHub UI or CLI)
git push origin --delete feature/123-user-auth

# 2. Switch to main locally
git checkout main

# 3. Pull merged changes
git pull origin main

# 4. Delete local branch
git branch -d feature/123-user-auth

# 5. Close related Issue
# Add comment: "Resolved in PR #45"
```

---

## Testing Strategy

### Testing Pyramid

```
        /\
       /E2E\        <- 10% End-to-End
      /------\
     /Integr..\     <- 20% Integration
    /----------\
   /   Unit     \   <- 70% Unit Tests
  /--------------\
```

### Test Types

#### Unit Tests

**What**: Test individual functions/components in isolation

**Coverage Target**: 80%+

**Example**:

```javascript
// src/utils/validation.js
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// tests/utils/validation.test.js
describe('isValidEmail', () => {
  test('returns true for valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });
  
  test('returns false for invalid email', () => {
    expect(isValidEmail('invalid')).toBe(false);
  });
});
```

#### Integration Tests

**Example**:

```javascript
describe('POST /api/auth/login', () => {
  test('returns token for valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'ValidPassword123!'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
  
  test('returns 401 for invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword'
      });
    
    expect(response.status).toBe(401);
  });
});
```

---

## Advanced Git Techniques

### Git Aliases

**Setup** (~/.gitconfig):

```bash
[alias]
  # Shortcuts
  co = checkout
  br = branch
  ci = commit
  st = status
  
  # Useful commands
  unstage = reset HEAD --
  last = log -1 HEAD --stat
  undo = reset --soft HEAD~1
  amend = commit --amend --no-edit
  
  # Pretty logs
  lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
  
  # Branch management
  cleanup = "!git branch --merged | grep -v '\\*\\|main' | xargs -n 1 git branch -d"
  
  # Sync with main
  sync = !git fetch origin && git rebase origin/main
  
  # Push force safely
  force = push --force-with-lease
```

### Git Stash

```bash
# Save current work
git stash
git stash save "Work in progress on login feature"

# List stashes
git stash list

# Apply most recent stash
git stash apply

# Apply and remove from stash
git stash pop

# Delete stash
git stash drop stash@{0}
```

### Git Reflog

**Recover deleted commits or branches**:

```bash
# View reflog
git reflog

# Recover deleted commit
git reflog  # Find commit hash
git checkout -b recovery abc1234

# Undo rebase
git reflog  # Find pre-rebase commit
git reset --hard abc1234
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Merge Conflicts

**Symptom**:
```
CONFLICT (content): Merge conflict in src/app.js
```

**Solution**:

```bash
# 1. Check which files have conflicts
git status

# 2. Open conflicted file
# Look for markers:
<<<<<<< HEAD
Your changes
=======
Their changes
>>>>>>> branch-name

# 3. Edit file to resolve

# 4. Stage resolved file
git add src/app.js

# 5. Complete merge
git commit -m "merge: resolve conflicts with main"
```

#### Issue 2: Accidentally Committed to Wrong Branch

**Solution**:

```bash
# IF NOT PUSHED YET:

# 1. Create new branch from current state
git branch feature/correct-branch

# 2. Reset main to previous state
git reset --hard HEAD~1

# 3. Switch to new branch
git checkout feature/correct-branch
```

#### Issue 3: Need to Undo Last Commit

```bash
# Undo commit, keep changes staged
git reset --soft HEAD~1

# Undo commit, keep changes unstaged
git reset HEAD~1

# Undo commit, discard changes (DANGEROUS)
git reset --hard HEAD~1

# Amend last commit
git commit --amend
```

#### Issue 4: Pushed Sensitive Data

**IMMEDIATE ACTIONS**:

```bash
# 1. IMMEDIATELY rotate credentials
# 2. Add to .gitignore
echo ".env" >> .gitignore

# 3. Remove from history
# Use BFG Repo-Cleaner
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# 4. Notify team to re-clone
```

#### Issue 5: Can't Pull Due to Local Changes

```bash
# Option 1: Stash changes
git stash
git pull
git stash pop

# Option 2: Commit changes
git add .
git commit -m "wip: work in progress"
git pull

# Option 3: Discard changes (CAREFUL!)
git reset --hard
git pull
```

---

## Quick Reference

### Essential Commands

```bash
# BRANCH MANAGEMENT
git checkout main                    # Switch to main
git checkout -b feature/new         # Create new branch
git branch -d feature/old           # Delete local branch
git push origin --delete feature    # Delete remote branch

# SYNCING
git pull origin main                # Pull latest
git fetch origin                    # Fetch without merging
git rebase origin/main              # Rebase on main
git merge origin/main               # Merge main

# COMMITTING
git add .                           # Stage all
git add src/app.js                  # Stage specific file
git commit -m "feat: message"       # Commit
git commit --amend                  # Amend last commit
git push                            # Push
git push --force-with-lease         # Force push safely

# UNDOING
git reset --soft HEAD~1             # Undo commit, keep staged
git reset HEAD~1                    # Undo commit, keep unstaged
git reset --hard HEAD~1             # Undo commit, discard
git revert <commit>                 # Revert commit

# STASHING
git stash                           # Save changes
git stash pop                       # Apply and remove
git stash list                      # List stashes
git stash apply stash@{0}           # Apply specific stash

# VIEWING
git status                          # Check status
git log --oneline                   # View commits
git diff                            # View changes
git show <commit>                   # View commit
```

### Commit Message Convention

```
<type>(<scope>): <subject>

TYPES:
feat     - New feature
fix      - Bug fix
docs     - Documentation
style    - Formatting
refactor - Restructuring
perf     - Performance
test     - Tests
chore    - Maintenance

EXAMPLES:
feat(auth): implement JWT tokens #123
fix(api): resolve race condition #456
docs(readme): update instructions
```

### PR Review Checklist

```markdown
- [ ] Code meets acceptance criteria
- [ ] Tests are comprehensive
- [ ] No obvious bugs
- [ ] Follows code style
- [ ] No security vulnerabilities
- [ ] Documentation updated
- [ ] No hardcoded values
- [ ] Error handling present
```

---

## Conclusion

This guide represents best practices from enterprise development, adapted for agile 3-person teams. Key principles:

1. **Main is sacred** - Always production-ready
2. **Test everything** - Catch bugs early
3. **Review all code** - Share knowledge
4. **Automate relentlessly** - Let CI/CD handle tasks
5. **Communicate continuously** - Over-communicate blockers

---

**Remember**: The goal is to ship quality code fast, not just fast code.

Good luck with your development! 🚀
