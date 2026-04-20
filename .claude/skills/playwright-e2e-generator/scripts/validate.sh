#!/usr/bin/env bash
# Run Playwright E2E tests for the HRIS app.
# Usage: bash .claude/skills/playwright-e2e-generator/scripts/validate.sh [feature]
# Example: bash ... department
# Default: runs all tests

set -euo pipefail

FEATURE="${1:-}"

if [ -n "$FEATURE" ]; then
  echo "==> Running E2E tests for feature: $FEATURE"
  npx playwright test "e2e/features/$FEATURE/" 2>&1
else
  echo "==> Running all E2E tests..."
  npx playwright test 2>&1
fi

exit_code=$?

if [ $exit_code -eq 0 ]; then
  echo ""
  echo "✓ All E2E tests passed."
else
  echo ""
  echo "✗ E2E tests failed (exit code $exit_code)."
  echo "  Tip: run 'npx playwright show-report' in $WEB_DIR to view the HTML report."
fi

exit $exit_code
