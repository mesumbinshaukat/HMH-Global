#!/usr/bin/env bash
set -euo pipefail

# Resolve repo root as the parent of this script directory, regardless of where it's run from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Create logs directory and timestamped log file at repo root
mkdir -p "$REPO_ROOT/logs"
TS="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$REPO_ROOT/logs/verification-$TS.log"

# Tee all stdout/stderr to log file
exec > >(tee -a "$LOG_FILE") 2>&1

# Ensure we operate from repo root
cd "$REPO_ROOT"

echo "============================================================"
echo "HMH Global: Reference Verification Script (Forked)"
echo "Started at: $(date)"
echo "Repo root: $(pwd)"
echo "Log file:  $LOG_FILE"
echo "============================================================"

# Helper: print a section header
section() {
  echo
  echo "------------------------------------------------------------"
  echo "[SECTION] $1"
  echo "------------------------------------------------------------"
}

# Helper: cross-platform recursive search
xsearch() {
  local pattern="$1"; shift
  local path="$1"; shift || true
  local grep_opts="$*"

  if command -v grep >/dev/null 2>&1; then
    grep -Rin ${grep_opts:-} -- "$pattern" "$path" || true
  elif command -v findstr >/dev/null 2>&1; then
    case "$pattern" in
      *"|"*)
        IFS='|' read -r -a PARTS <<<"$pattern"
        for p in "${PARTS[@]}"; do
          findstr /s /i /n "$p" "$path" 2>nul || true
        done
        ;;
      *)
        findstr /s /i /n "$pattern" "$path" 2>nul || true
        ;;
    esac
  else
    echo "WARN: Neither grep nor findstr found on PATH. Skipping search for pattern: $pattern"
  fi
}

# Verify paths
section "Verifying key paths exist"
ls -la || true
[ -d "Frontend/hmh-global-frontend/src" ] && echo "Found Frontend src" || echo "Frontend src NOT found"
[ -d "Backend" ] && echo "Found Backend" || echo "Backend NOT found"

# 1) Contact Frontend usage
section "Contact Frontend: search for ContactPage references"
xsearch "ContactPage" "Frontend/hmh-global-frontend/src" -E

# 2) Contact Backend usage
section "Contact Backend: routes"
xsearch "ContactRoutes" "Backend" -E

section "Contact Backend: controller"
xsearch "ContactController" "Backend" -E

section "Contact Backend: model path usage"
xsearch "models/Contact|models\\\\Contact" "Backend" -E

# 3) Duplicate Scraper refs
section "Duplicate scraper references (enhancedNorthwestScraper)"
xsearch "enhancedNorthwestScraper" "." -E

# 4) Specific scripts references
section "Specific scripts references"
for pat in \
  "importProducts.js" \
  "updateProductVisibility_fixed.js" \
  "testSuite.js" \
  "scrapeNorthwestCosmetics.js" \
  "create-indexes.js" \
  "verify-production.js" \
  "ensureCartIndexes.js" \
; do
  echo "-- Searching for: $pat"
  xsearch "$pat" "." -E
  echo
 done

# 5) List Backend/scripts directory
section "Listing Backend/scripts directory"
if [ -d "Backend/scripts" ]; then
  ls -la "Backend/scripts" || true
else
  echo "Backend/scripts not found"
fi

# 6) Show package.json files (root and backend)
section "package.json (root)"
if [ -f "package.json" ]; then
  cat package.json
else
  echo "package.json not found in root"
fi

section "package.json (backend)"
if [ -f "Backend/package.json" ]; then
  cat Backend/package.json
else
  echo "Backend/package.json not found"
fi

section "Completed"
echo "Finished at: $(date)"
echo "Full log saved to: $LOG_FILE"
