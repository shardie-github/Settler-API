# TypeScript Typecheck Setup

This document describes the automated typecheck setup that prevents TypeScript errors from reaching production.

## Overview

We have multiple layers of protection to ensure TypeScript errors are caught early:

1. **Pre-commit hook** - Runs typecheck before every commit
2. **Pre-push hook** - Runs typecheck before every push (extra safety net)
3. **CI workflow** - Runs typecheck before build in CI/CD
4. **Deploy workflows** - Run typecheck before build in preview and production deployments
5. **Turbo pipeline** - Automatically runs typecheck before build

## How It Works

### Pre-commit Hook

Located at `.husky/pre-commit`, this hook:
- Runs `npm run typecheck` before allowing commits
- Provides clear error messages if type errors are found
- Runs lint-staged for formatting and linting after typecheck passes

### Pre-push Hook

Located at `.husky/pre-push`, this hook:
- Runs `npm run typecheck` before allowing pushes
- Catches any errors that might have slipped through pre-commit
- Provides a final safety check before code reaches remote

### CI/CD Workflows

#### CI Workflow (`.github/workflows/ci.yml`)
- Has a dedicated `lint-and-typecheck` job
- Runs before the build job
- Ensures all type errors are caught in pull requests

#### Deploy Preview (`.github/workflows/deploy-preview.yml`)
- Runs typecheck before build
- Prevents deploying preview environments with type errors

#### Deploy Production (`.github/workflows/deploy-production.yml`)
- Runs typecheck before build
- Prevents deploying production with type errors

### Turbo Pipeline

The `turbo.json` configuration ensures:
- `build` task depends on `typecheck`
- Typecheck automatically runs before build when using turbo
- Dependencies are respected (typecheck runs after dependency builds)

## Usage

### Run Typecheck Locally

```bash
# Check all packages
npm run typecheck

# Check specific package
cd packages/api && npm run typecheck
cd packages/web && npm run typecheck
```

### Run All Checks

```bash
# Run typecheck and lint
npm run verify
```

### Bypass Hooks (Not Recommended)

If you absolutely need to bypass hooks (e.g., for WIP commits):

```bash
# Skip pre-commit hook
git commit --no-verify

# Skip pre-push hook
git push --no-verify
```

**⚠️ Warning**: Only bypass hooks for work-in-progress commits. Never bypass for production code.

## Troubleshooting

### Typecheck Fails in Pre-commit

1. Run `npm run typecheck` locally to see detailed errors
2. Fix the TypeScript errors
3. Try committing again

### Typecheck Passes Locally but Fails in CI

1. Ensure you're using the same Node.js version (check `.nvmrc` or `package.json` engines)
2. Run `npm ci` to ensure dependencies match CI
3. Check for differences in TypeScript configuration

### Typecheck is Slow

- Turbo caches typecheck results
- Only changed packages are re-checked
- First run will be slower, subsequent runs use cache

## Configuration Files

- `.husky/pre-commit` - Pre-commit hook
- `.husky/pre-push` - Pre-push hook
- `turbo.json` - Turbo pipeline configuration
- `.github/workflows/*.yml` - CI/CD workflows
- `tsconfig.json` - Root TypeScript configuration
- `packages/*/tsconfig.json` - Package-specific TypeScript configurations

## Benefits

1. **Early Detection** - Errors caught before commit
2. **Consistent Checks** - Same checks locally and in CI
3. **Faster Feedback** - Developers see errors immediately
4. **Prevents Broken Builds** - No more surprise build failures
5. **Better Code Quality** - Type safety enforced automatically

## Maintenance

These hooks and workflows are automatically maintained. If you need to modify them:

1. Update the hook files in `.husky/`
2. Update workflow files in `.github/workflows/`
3. Test locally before pushing
4. Document any changes in this file
