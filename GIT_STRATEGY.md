# HealthSync Git Branching Strategy

## Branches
- main        → production only, protected
- develop     → active development, all PRs merge here
- feature/*   → new features (e.g. feature/auth, feature/metrics)
- fix/*       → bug fixes (e.g. fix/token-expiry)
- release/*   → pre-release staging (e.g. release/v1.0.0)
- hotfix/*    → urgent production fixes

## Commit Convention (Conventional Commits)
- feat: new feature
- fix: bug fix
- chore: tooling/config changes
- docs: documentation
- refactor: code restructure without behavior change
- test: adding tests
- perf: performance improvement

## Examples
  git checkout -b feature/health-metrics
  git commit -m "feat: add health metric time-series API"
  git checkout -b fix/jwt-refresh-token-expiry
  git commit -m "fix: correct refresh token expiry calculation"

## PR Rules
- All PRs target develop branch
- Minimum 1 review before merge
- CI must pass before merge
- Delete branch after merge
