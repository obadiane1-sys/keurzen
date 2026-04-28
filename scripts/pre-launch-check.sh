#!/usr/bin/env bash
#
# Keurzen — Pre-Launch Check
# Chains the critical health checks before a release in REPORT mode:
# continues even on failure and reports everything at the end.
#
# Steps:
#   [1/4] TypeScript strict check (apps/mobile)
#   [2/4] ESLint                  (apps/mobile)
#   [3/4] Maestro E2E             (iOS simulator)
#   [4/4] Maestro E2E             (Android emulator)
#

set -uo pipefail

# ─── Colors ─────────────────────────────────────────────
if [[ -t 1 ]]; then
  RED=$'\033[0;31m'
  GREEN=$'\033[0;32m'
  YELLOW=$'\033[0;33m'
  BLUE=$'\033[0;34m'
  BOLD=$'\033[1m'
  NC=$'\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; BOLD=''; NC=''
fi

# ─── Paths ──────────────────────────────────────────────
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
MOBILE_DIR="$REPO_ROOT/apps/mobile"
MAESTRO_DIR="$MOBILE_DIR/.maestro"

# ─── Defaults ───────────────────────────────────────────
RUN_IOS=true
RUN_ANDROID=true
IOS_FALLBACK_DEVICE="iPhone 17 Pro"
ANDROID_DEVICE="Keurzen_Test"

# ─── Usage ──────────────────────────────────────────────
usage() {
  cat <<EOF
${BOLD}🚀 Keurzen Pre-Launch Check${NC}

Chains the critical health checks before a release. Report mode: continues
on failure and reports everything at the end.

${BOLD}Usage:${NC}
  ./scripts/pre-launch-check.sh [OPTIONS]

${BOLD}Steps:${NC}
  [1/4] TypeScript strict check (apps/mobile)
  [2/4] ESLint                  (apps/mobile)
  [3/4] Maestro E2E             (iOS simulator)
  [4/4] Maestro E2E             (Android emulator)

${BOLD}Options:${NC}
  (no flag)         Run all four checks
  --skip-maestro    Run only TS + ESLint (skip both Maestro suites)
  --ios-only        TS + ESLint + Maestro iOS
  --android-only    TS + ESLint + Maestro Android
  -h, --help        Show this help

${BOLD}Exit codes:${NC}
  0  All checks ✅ or only warnings/skips ⚠️
  1  At least one ❌ (hard failure)

${BOLD}Examples:${NC}
  ./scripts/pre-launch-check.sh
  ./scripts/pre-launch-check.sh --skip-maestro
  ./scripts/pre-launch-check.sh --ios-only
EOF
}

# ─── Args ───────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-maestro)  RUN_IOS=false; RUN_ANDROID=false ;;
    --ios-only)      RUN_ANDROID=false ;;
    --android-only)  RUN_IOS=false ;;
    -h|--help)       usage; exit 0 ;;
    *)
      printf "${RED}Unknown option: %s${NC}\n\n" "$1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

# ─── Trackers (bash 3.2 compatible) ─────────────────────
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Use indexed arrays — initialized empty
WARNINGS=()
ERRORS=()

now() { printf '%s' "$(date +%s)"; }

elapsed() {
  local start=$1 end
  end=$(now)
  printf '%s' "$((end - start))"
}

print_step() {
  printf "\n${BLUE}[%s/4] %s${NC}\n" "$1" "$2"
}

ok() {
  printf "   ${GREEN}✅ %s${NC}  (%ss)\n" "$1" "$2"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  printf "   ${RED}❌ %s${NC}  (%ss)\n" "$1" "$2"
  FAIL_COUNT=$((FAIL_COUNT + 1))
  ERRORS+=("$3")
}

warn() {
  printf "   ${YELLOW}⚠️  %s${NC}" "$1"
  if [[ -n "${2:-}" ]]; then
    printf "  (%ss)" "$2"
  fi
  printf "\n"
  WARN_COUNT=$((WARN_COUNT + 1))
  WARNINGS+=("$3")
}

note() {
  printf "   ${YELLOW}→ %s${NC}\n" "$1"
}

# ─── Header ─────────────────────────────────────────────
printf "\n${BOLD}🚀 Keurzen Pre-Launch Check${NC}\n"
printf "${BLUE}═══════════════════════════════════════════════${NC}\n"

GLOBAL_START=$(now)

# ─── [1/4] TypeScript ───────────────────────────────────
print_step 1 "TypeScript strict check"
T_START=$(now)

if [[ ! -f "$MOBILE_DIR/tsconfig.json" ]]; then
  warn "Skipped — no tsconfig.json found at apps/mobile" "" \
       "TypeScript: skipped, tsconfig.json missing"
  note "Expected at $MOBILE_DIR/tsconfig.json"
else
  TS_OUTPUT=$(cd "$MOBILE_DIR" && npx tsc --noEmit 2>&1)
  TS_EXIT=$?
  T_DUR=$(elapsed "$T_START")
  if [[ $TS_EXIT -eq 0 ]]; then
    ok "No type errors found" "$T_DUR"
  else
    TS_PREVIEW=$(printf "%s\n" "$TS_OUTPUT" | head -20)
    fail "Type errors found" "$T_DUR" \
         "TypeScript:
$TS_PREVIEW"
  fi
fi

# ─── [2/4] ESLint ───────────────────────────────────────
print_step 2 "ESLint"
T_START=$(now)

# Detect ESLint config — support both legacy and flat
HAS_LEGACY_CONFIG=false
HAS_FLAT_CONFIG=false
for f in .eslintrc .eslintrc.js .eslintrc.cjs .eslintrc.json .eslintrc.yaml .eslintrc.yml; do
  if [[ -f "$MOBILE_DIR/$f" || -f "$REPO_ROOT/$f" ]]; then
    HAS_LEGACY_CONFIG=true
    break
  fi
done
for f in eslint.config.js eslint.config.mjs eslint.config.cjs eslint.config.ts; do
  if [[ -f "$MOBILE_DIR/$f" || -f "$REPO_ROOT/$f" ]]; then
    HAS_FLAT_CONFIG=true
    break
  fi
done

if [[ "$HAS_LEGACY_CONFIG" == false && "$HAS_FLAT_CONFIG" == false ]]; then
  warn "Skipped — ESLint config not found" "" \
       "ESLint: skipped, no .eslintrc* or eslint.config.* in apps/mobile or repo root"
  note "Add a config at apps/mobile/.eslintrc.cjs or eslint.config.js to enable this check"
else
  if [[ "$HAS_FLAT_CONFIG" == true ]]; then
    LINT_OUTPUT=$(cd "$MOBILE_DIR" && npx eslint . --ext .ts,.tsx 2>&1)
  else
    LINT_OUTPUT=$(cd "$MOBILE_DIR" && ESLINT_USE_FLAT_CONFIG=false npx eslint . --ext .ts,.tsx 2>&1)
  fi
  LINT_EXIT=$?
  T_DUR=$(elapsed "$T_START")

  # Try to parse counts from ESLint stylish summary line
  # Example: "✖ 5 problems (2 errors, 3 warnings)"
  ERR_NUM=$(printf "%s\n" "$LINT_OUTPUT" | grep -oE '[0-9]+ error' | head -1 | grep -oE '[0-9]+' || true)
  WARN_NUM=$(printf "%s\n" "$LINT_OUTPUT" | grep -oE '[0-9]+ warning' | head -1 | grep -oE '[0-9]+' || true)
  ERR_NUM=${ERR_NUM:-0}
  WARN_NUM=${WARN_NUM:-0}

  if [[ $LINT_EXIT -eq 0 && "$WARN_NUM" -eq 0 ]]; then
    ok "No lint issues" "$T_DUR"
  elif [[ $LINT_EXIT -eq 0 ]]; then
    warn "0 errors, $WARN_NUM warnings" "$T_DUR" \
         "ESLint: $WARN_NUM warnings (run 'npx eslint . --fix' to auto-fix some)"
  else
    LINT_PREVIEW=$(printf "%s\n" "$LINT_OUTPUT" | head -20)
    fail "$ERR_NUM errors, $WARN_NUM warnings" "$T_DUR" \
         "ESLint: $ERR_NUM errors, $WARN_NUM warnings
$LINT_PREVIEW"
  fi
fi

# ─── [3/4] Maestro E2E (iOS) ────────────────────────────
print_step 3 "Maestro E2E (iOS)"
T_START=$(now)

if [[ "$RUN_IOS" == false ]]; then
  warn "Skipped (CLI flag)" "" "Maestro iOS: skipped via --skip-maestro / --android-only"
elif ! command -v maestro >/dev/null 2>&1; then
  warn "Skipped — maestro not in PATH" "" \
       "Maestro iOS: skipped, install via 'curl -Ls https://get.maestro.mobile.dev | bash'"
elif ! command -v xcrun >/dev/null 2>&1; then
  warn "Skipped — xcrun not available" "" \
       "Maestro iOS: skipped, Xcode Command Line Tools not installed"
else
  IOS_BOOTED_LINE=$(xcrun simctl list devices booted 2>/dev/null | grep "Booted" | head -1 || true)
  if [[ -z "$IOS_BOOTED_LINE" ]]; then
    warn "Skipped — no iOS simulator booted" "" \
         "Maestro iOS: skipped, simulator not running"
    note "Run: open -a Simulator"
  else
    # Strip leading whitespace, then drop "(UUID) (Booted)" tail
    IOS_DEVICE=$(printf '%s' "$IOS_BOOTED_LINE" \
      | sed -E 's/^[[:space:]]+//; s/[[:space:]]*\([^)]*\)[[:space:]]*\(Booted\).*$//')
    [[ -z "$IOS_DEVICE" ]] && IOS_DEVICE="$IOS_FALLBACK_DEVICE"

    printf "   ${BLUE}→ Running on \"%s\"…${NC}\n" "$IOS_DEVICE"
    ( cd "$MOBILE_DIR" && maestro test --device "$IOS_DEVICE" .maestro/ )
    IOS_EXIT=$?
    T_DUR=$(elapsed "$T_START")
    FLOW_COUNT=$(ls "$MAESTRO_DIR"/*.yaml 2>/dev/null | wc -l | tr -d ' ')
    if [[ $IOS_EXIT -eq 0 ]]; then
      ok "$FLOW_COUNT flows passed on \"$IOS_DEVICE\"" "$T_DUR"
    else
      fail "Maestro iOS failed on \"$IOS_DEVICE\"" "$T_DUR" \
           "Maestro iOS: at least one flow failed (see output above; debug at ~/.maestro/tests/)"
    fi
  fi
fi

# ─── [4/4] Maestro E2E (Android) ────────────────────────
print_step 4 "Maestro E2E (Android)"
T_START=$(now)

if [[ "$RUN_ANDROID" == false ]]; then
  warn "Skipped (CLI flag)" "" "Maestro Android: skipped via --skip-maestro / --ios-only"
elif ! command -v maestro >/dev/null 2>&1; then
  warn "Skipped — maestro not in PATH" "" \
       "Maestro Android: skipped, install via 'curl -Ls https://get.maestro.mobile.dev | bash'"
elif ! command -v adb >/dev/null 2>&1; then
  warn "Skipped — adb not in PATH" "" \
       "Maestro Android: skipped, Android SDK platform-tools not in PATH"
else
  AND_BOOTED=$(adb devices 2>/dev/null | grep -E "emulator-[0-9]+[[:space:]]+device" | head -1 || true)
  if [[ -z "$AND_BOOTED" ]]; then
    warn "Skipped — no Android emulator booted" "" \
         "Maestro Android: skipped, emulator not running"
    note "Run: emulator @${ANDROID_DEVICE} &"
  else
    printf "   ${BLUE}→ Running on \"%s\"…${NC}\n" "$ANDROID_DEVICE"
    ( cd "$MOBILE_DIR" && maestro test --device "$ANDROID_DEVICE" .maestro/ )
    AND_EXIT=$?
    T_DUR=$(elapsed "$T_START")
    FLOW_COUNT=$(ls "$MAESTRO_DIR"/*.yaml 2>/dev/null | wc -l | tr -d ' ')
    if [[ $AND_EXIT -eq 0 ]]; then
      ok "$FLOW_COUNT flows passed on \"$ANDROID_DEVICE\"" "$T_DUR"
    else
      fail "Maestro Android failed on \"$ANDROID_DEVICE\"" "$T_DUR" \
           "Maestro Android: at least one flow failed (see output above; debug at ~/.maestro/tests/)"
    fi
  fi
fi

# ─── Summary ────────────────────────────────────────────
TOTAL_DUR=$(elapsed "$GLOBAL_START")

printf "\n${BLUE}═══════════════════════════════════════════════${NC}\n"
printf "${BOLD}Summary:${NC} ${GREEN}%s ✅${NC}  ${RED}%s ❌${NC}  ${YELLOW}%s ⚠️${NC}   (total %ss)\n" \
  "$PASS_COUNT" "$FAIL_COUNT" "$WARN_COUNT" "$TOTAL_DUR"

if [[ ${#WARNINGS[@]} -gt 0 ]]; then
  printf "\n${YELLOW}⚠️  WARNINGS:${NC}\n"
  for w in "${WARNINGS[@]}"; do
    printf "   - %s\n" "$w"
  done
fi

if [[ ${#ERRORS[@]} -gt 0 ]]; then
  printf "\n${RED}❌ ERRORS:${NC}\n"
  for e in "${ERRORS[@]}"; do
    printf '%s\n' "$e" | sed 's/^/   /'
  done
fi

printf "${BLUE}═══════════════════════════════════════════════${NC}\n"

if [[ $FAIL_COUNT -gt 0 ]]; then
  printf "\n${RED}${BOLD}Status: FAIL${NC}\n\n"
  exit 1
elif [[ $WARN_COUNT -gt 0 ]]; then
  printf "\n${YELLOW}${BOLD}Status: PASS WITH WARNINGS${NC}\n\n"
  exit 0
else
  printf "\n${GREEN}${BOLD}Status: ALL GREEN${NC}\n\n"
  exit 0
fi
