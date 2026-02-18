You are performing a weekly automated architecture review of the MeshIt codebase.

## Your Task

Produce a structured architecture review report covering the areas below. Be concise and actionable — flag real issues, not stylistic nitpicks.

## Review Areas

### 1. Spec Adherence
Read every file in `spec/` and compare against the actual implementation in `src/`. Flag:
- Features described in spec but not implemented (check `spec/roadmap.md` for what's planned vs done)
- Implementations that diverge from spec (behavior, naming, data model)
- Spec files that are outdated or contradicted by current code

### 2. Code Quality
- **Dead code**: Unused exports, unreachable branches, commented-out blocks
- **Duplication**: Near-identical logic in multiple files that should be extracted
- **Consistency**: Patterns used inconsistently (e.g., some API routes using `withAuth`, others not; mixed data fetching patterns)

### 3. Dependency Health
Run `pnpm list --depth 0` and review `package.json`. Flag:
- Dependencies that appear unused (not imported anywhere in `src/`)
- Dependencies that duplicate functionality (e.g., two date libraries)
- Missing or misplaced dependencies (devDependencies used in production code or vice versa)

### 4. Architecture Risks
- Circular dependencies or tight coupling between modules
- Components doing too much (god components/files over ~300 lines)
- Missing error boundaries or error handling gaps in critical paths
- Security concerns (exposed secrets, missing auth checks on API routes)

## Output Format

Structure your report as GitHub-flavored markdown with this template:

```
## Architecture Review — {date}

### Summary
{2-3 sentence overview of codebase health}

### Spec Adherence
| Spec File | Status | Notes |
|-----------|--------|-------|
| ... | ... | ... |

### Code Quality Issues
{Bulleted list of findings with file paths and line numbers}

### Dependency Health
{Bulleted list of findings}

### Architecture Risks
{Bulleted list of findings, severity: low/medium/high}

### Recommendations
{Top 3-5 prioritized action items}
```

Be specific — include file paths and line numbers. Do NOT suggest changes, just report findings.
