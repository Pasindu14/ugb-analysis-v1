#!/usr/bin/env bash
# Validate a generated HRIS feature compiles without TypeScript errors.
# Usage:
#   bash .claude/skills/hris-feature-generator/scripts/validate.sh
#   bash .claude/skills/hris-feature-generator/scripts/validate.sh department
#
# With a feature name: also checks that all 8 expected layer directories exist.

set -euo pipefail

FEATURE="${1:-}"

# ── 1. TypeScript check ────────────────────────────────────────────────────────
echo "==> Running TypeScript type check..."
npx tsc --noEmit 2>&1

tsc_exit=$?

if [ $tsc_exit -ne 0 ]; then
  echo ""
  echo "✗ TypeScript errors found. Fix all errors before proceeding."
  exit $tsc_exit
fi

echo "✓ TypeScript passed."

# ── 2. Layer presence check (optional — only when feature name is given) ───────
if [ -n "$FEATURE" ]; then
  echo ""
  echo "==> Checking layer structure for feature: $FEATURE"

  FEATURE_DIR="features/$FEATURE"
  MISSING=0

  check_dir() {
    if [ -d "$FEATURE_DIR/$1" ]; then
      echo "  ✓ $FEATURE_DIR/$1/"
    else
      echo "  ✗ MISSING: $FEATURE_DIR/$1/"
      MISSING=1
    fi
  }

  check_dir "schemas"
  check_dir "repositories"
  check_dir "services"
  check_dir "actions"
  check_dir "hooks"
  check_dir "store"
  check_dir "components/forms"
  check_dir "components/dialogs"
  check_dir "components/tables"
  check_dir "components/pages"

  APP_ROUTE="app/(protected)/${FEATURE}s"
  if [ -d "$APP_ROUTE" ] || [ -d "app/(protected)/$FEATURE" ]; then
    echo "  ✓ app route exists"
  else
    echo "  ✗ MISSING: app/(protected)/${FEATURE}s/page.tsx"
    MISSING=1
  fi

  if [ $MISSING -ne 0 ]; then
    echo ""
    echo "✗ Some layers are missing. Generate all 8 layers before declaring complete."
    exit 1
  fi

  echo ""
  echo "✓ All layers present for feature: $FEATURE"
fi

echo ""
echo "✓ Feature validation passed."
