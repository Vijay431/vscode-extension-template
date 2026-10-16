#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# VS Code Extension Template — bootstrap
#
# Usage:
#   bash <(curl -fsSL https://raw.githubusercontent.com/Vijay431/vscode-extension-template/main/install.sh)
#   PROJECT_ID=my-extension bash install.sh        # fully non-interactive
#
# Clones the template into ./<project-id>/, fills every {{TOKEN}}, installs
# dependencies and hooks, and makes the first commit.
#
# Inputs
#   Required   Project ID (kebab-case)    prompt, or PROJECT_ID env var
#   Optional   PROJECT_NAME               default: title-cased Project ID
#              GITHUB_USERNAME            default: slug of `git config user.name`
#              PUBLISHER                  default: GITHUB_USERNAME
#              AUTHOR_NAME, AUTHOR_EMAIL  default: `git config user.name/email`
#              DESCRIPTION                default: "A VS Code extension."
#              TEMPLATE_REPO_URL, TEMPLATE_BRANCH   default: this repository, main
#
# Prerequisites
#   Required   git, network access, Node.js matching the template's engines.node
#   Automatic  pnpm (activated via corepack at the version packageManager pins)
#
# Nothing else is asked or required. On failure the partial project directory
# is removed.
# ---------------------------------------------------------------------------

TEMPLATE_REPO_URL="${TEMPLATE_REPO_URL:-https://github.com/Vijay431/vscode-extension-template.git}"
TEMPLATE_BRANCH="${TEMPLATE_BRANCH:-main}"

# ---- failure handling ------------------------------------------------------

STEP="starting"
CREATED_DIR=""
ORIGINAL_PWD="$PWD"

on_exit() {
  local code=$?
  [[ $code -eq 0 ]] && return 0
  trap - EXIT
  echo "" >&2
  echo "✗ Failed during: ${STEP} (exit ${code})" >&2
  cd "$ORIGINAL_PWD" 2>/dev/null || true
  if [[ -n "$CREATED_DIR" && -d "$CREATED_DIR" ]]; then
    rm -rf "$CREATED_DIR"
    echo "  Removed partial ./${CREATED_DIR}" >&2
  fi
  exit "$code"
}
trap on_exit EXIT

die() {
  echo "✗ $1" >&2
  exit 1
}

# ---- helpers ---------------------------------------------------------------

to_title_case() {
  echo "$1" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2)); print}'
}

to_camel_case() {
  echo "$1" | awk -F'-' '{
    result = $1
    for (i=2; i<=NF; i++) {
      word = $i
      result = result toupper(substr(word,1,1)) substr(word,2)
    }
    print result
  }'
}

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g'
}

# Portable sed -i (macOS vs Linux)
if sed --version 2>/dev/null | grep -q GNU; then
  sedi() { sed -i "$@"; }
else
  sedi() { sed -i '' "$@"; }
fi

# Escape a string for safe use on the replacement (RHS) side of a sed
# s|…|…| command: backslash, the '|' delimiter, and '&' (whole-match ref).
sed_rhs_escape() {
  printf '%s' "$1" | sed -e 's/[\\&|]/\\&/g'
}

# Read a string field from the cloned package.json (e.g. engines.node).
pkg_field() {
  node -p "(() => { try { return $1 ?? ''; } catch { return ''; } })()" 2>/dev/null || true
}

# ---- preflight (before anything is created) --------------------------------

STEP="preflight"
command -v git &>/dev/null || die "git not found. Install git and re-run."
command -v node &>/dev/null || die "node not found. Install Node.js from https://nodejs.org/ and re-run."

# ---- Project ID (the only input) -------------------------------------------

STEP="reading Project ID"
if [[ -z "${PROJECT_ID:-}" ]]; then
  [[ -t 0 ]] || die "PROJECT_ID is required when not running interactively."
  echo ""
  echo "VS Code Extension Template — Bootstrap"
  echo "───────────────────────────────────────"
  while true; do
    printf "  Project ID (kebab-case): "
    read -r PROJECT_ID
    [[ -n "$PROJECT_ID" ]] && break
    echo "    ✗ This field is required." >&2
  done
fi

[[ "$PROJECT_ID" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]] \
  || die "Project ID '${PROJECT_ID}' must be kebab-case (lowercase letters, digits, hyphens), e.g. my-extension."

# ---- derive everything else ------------------------------------------------

DEFAULT_AUTHOR_NAME=$(git config --get user.name 2>/dev/null || echo "")
DEFAULT_AUTHOR_EMAIL=$(git config --get user.email 2>/dev/null || echo "")

PROJECT_NAME="${PROJECT_NAME:-$(to_title_case "$PROJECT_ID")}"
EXTENSION_NAME="$PROJECT_ID"
EXTENSION_ID=$(to_camel_case "$PROJECT_ID")
DISPLAY_NAME="$PROJECT_NAME"
AUTHOR_NAME="${AUTHOR_NAME:-${DEFAULT_AUTHOR_NAME:-Your Name}}"
AUTHOR_EMAIL="${AUTHOR_EMAIL:-${DEFAULT_AUTHOR_EMAIL:-you@example.com}}"
YEAR=$(date +%Y)
DESCRIPTION="${DESCRIPTION:-A VS Code extension.}"
GITHUB_USERNAME="${GITHUB_USERNAME:-$(slugify "${DEFAULT_AUTHOR_NAME:-your-username}")}"
PUBLISHER="${PUBLISHER:-$GITHUB_USERNAME}"
REPO_URL="https://github.com/${GITHUB_USERNAME}/${PROJECT_ID}"
SITE_URL="https://${GITHUB_USERNAME}.github.io/${PROJECT_ID}"

echo ""
echo "Creating ./${PROJECT_ID}"
printf "  %-14s %s\n" "Name" "$PROJECT_NAME"
printf "  %-14s %s\n" "Extension ID" "$EXTENSION_ID"
printf "  %-14s %s\n" "Author" "$AUTHOR_NAME <$AUTHOR_EMAIL>"
printf "  %-14s %s\n" "Publisher" "$PUBLISHER"
printf "  %-14s %s\n" "Repo URL" "$REPO_URL"
echo "  (override with PROJECT_NAME, GITHUB_USERNAME, PUBLISHER, AUTHOR_NAME, AUTHOR_EMAIL)"

# ---- target dir ------------------------------------------------------------

STEP="checking target directory"
TARGET_DIR="$PROJECT_ID"
if [[ -e "$TARGET_DIR" ]] && [[ -n "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]]; then
  die "Directory './$TARGET_DIR' already exists and is not empty. Remove or rename it, then re-run."
fi

# ---- clone -----------------------------------------------------------------

STEP="cloning the template"
echo ""
echo "Cloning template…"
CREATED_DIR="$TARGET_DIR"
git clone --quiet --depth 1 --branch "$TEMPLATE_BRANCH" "$TEMPLATE_REPO_URL" "$TARGET_DIR"
cd "$TARGET_DIR"

# ---- tool versions the template requires -----------------------------------

STEP="checking Node.js version"
NODE_FLOOR=$(pkg_field "require('./package.json').engines.node" | sed -E 's/[^0-9]*([0-9]+).*/\1/')
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [[ "$NODE_FLOOR" =~ ^[0-9]+$ ]] && (( NODE_MAJOR < NODE_FLOOR )); then
  die "Node.js $(node --version) is too old. This template needs Node.js ${NODE_FLOOR} or newer."
fi

STEP="setting up pnpm"
if ! command -v pnpm &>/dev/null; then
  PNPM_SPEC=$(pkg_field "require('./package.json').packageManager")
  if command -v corepack &>/dev/null; then
    corepack enable pnpm >/dev/null 2>&1 || true
    corepack prepare "$PNPM_SPEC" --activate >/dev/null 2>&1 || true
  fi
  command -v pnpm &>/dev/null || die "pnpm not found and corepack could not provide it. Install it: https://pnpm.io/installation"
fi

# ---- strip template-only files ---------------------------------------------

STEP="removing template-only files"
rm -rf .git install.sh openspec graphify-out .claude .cursorignore
rm -f .github/workflows/template-check.yml

# ---- replace tokens --------------------------------------------------------

STEP="filling in project tokens"
echo "Filling in project tokens…"

FILES=()
while IFS= read -r f; do
  FILES+=("$f")
done < <(find . -type f | sed 's|^\./||')

EXCLUDE_PATTERNS=(
  'node_modules/'
  '^dist/'
  '^out-test/'
  '^\.git/'
  '^coverage/'
  '\.png$'
  '\.jpg$'
  '\.jpeg$'
  '\.gif$'
  '\.ico$'
  '\.vsix$'
  'pnpm-lock\.yaml$'
)

for f in ${FILES[@]+"${FILES[@]}"}; do
  skip=false
  for pat in "${EXCLUDE_PATTERNS[@]}"; do
    if echo "$f" | grep -qE "$pat"; then
      skip=true
      break
    fi
  done
  [[ "$skip" == "true" ]] && continue
  [[ -f "$f" ]] || continue

  sedi \
    -e "s|{{EXTENSION_NAME}}|$(sed_rhs_escape "$EXTENSION_NAME")|g" \
    -e "s|{{DISPLAY_NAME}}|$(sed_rhs_escape "$DISPLAY_NAME")|g" \
    -e "s|{{EXTENSION_ID}}|$(sed_rhs_escape "$EXTENSION_ID")|g" \
    -e "s|{{PUBLISHER}}|$(sed_rhs_escape "$PUBLISHER")|g" \
    -e "s|{{DESCRIPTION}}|$(sed_rhs_escape "$DESCRIPTION")|g" \
    -e "s|{{AUTHOR_NAME}}|$(sed_rhs_escape "$AUTHOR_NAME")|g" \
    -e "s|{{AUTHOR_EMAIL}}|$(sed_rhs_escape "$AUTHOR_EMAIL")|g" \
    -e "s|{{REPO_URL}}|$(sed_rhs_escape "$REPO_URL")|g" \
    -e "s|{{SITE_URL}}|$(sed_rhs_escape "$SITE_URL")|g" \
    -e "s|{{GITHUB_USERNAME}}|$(sed_rhs_escape "$GITHUB_USERNAME")|g" \
    -e "s|{{YEAR}}|$(sed_rhs_escape "$YEAR")|g" \
    "$f"
done

# llms.txt is excluded: it documents the {{TOKEN}} syntax with literal examples
# on purpose, which would always be reported as false positives.
remaining=$(grep -rE '\{\{(EXTENSION_NAME|DISPLAY_NAME|EXTENSION_ID|PUBLISHER|DESCRIPTION|AUTHOR_NAME|AUTHOR_EMAIL|REPO_URL|SITE_URL|GITHUB_USERNAME|YEAR)\}\}' \
  --include='*.ts' --include='*.js' --include='*.json' \
  --include='*.md' --include='*.yml' --include='*.yaml' \
  --include='*.html' --include='*.css' --include='*.sh' \
  --include='*.txt' --include='*.mjs' --include='*.cjs' \
  --include='*.init' \
  . 2>/dev/null | grep -v '^\./llms\.txt:' | grep -v 'node_modules' | grep -v 'dist/' | grep -v 'out-test/' | grep -v 'coverage/' || true)

if [[ -n "$remaining" ]]; then
  echo "⚠ Unreplaced tokens found — edit these files manually:" >&2
  echo "$remaining" >&2
fi

# ---- enable .github placeholders -------------------------------------------

STEP="enabling .github files"
while IFS= read -r f; do mv "$f" "${f%.init}"; done \
  < <(find .github -type f -name '*.init' 2>/dev/null)

# ---- git + dependencies ----------------------------------------------------

# git init comes first so husky installs its hooks during `pnpm install`.
STEP="initialising git"
git init --quiet --initial-branch=main 2>/dev/null || git init --quiet

STEP="installing dependencies"
echo "Installing dependencies with pnpm…"
pnpm install

STEP="creating the initial commit"
git add -A
if ! git -c user.name="$AUTHOR_NAME" -c user.email="$AUTHOR_EMAIL" \
  commit --quiet -m "chore: init from vscode-extension-template"; then
  echo "  ⚠ Initial commit failed; run 'git add -A && git commit' yourself." >&2
fi

# ---- done ------------------------------------------------------------------

trap - EXIT
CREATED_DIR=""

echo ""
echo "✓ Project ready in ./${PROJECT_ID}"
echo ""
echo "Next: cd ${PROJECT_ID} && code .   (press F5 to launch the Extension Development Host)"
echo "Happy coding!"
