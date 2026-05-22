#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# VS Code Extension Template — bootstrap
#
# Usage:
#   bash <(curl -fsSL https://raw.githubusercontent.com/Vijay431/vscode-extension-template/main/install.sh)
#
# Prompts for: project-id, project-name, package manager (pnpm default).
# Creates ./<project-id>/, clones the template, fills all {{TOKEN}} placeholders,
# installs dependencies, and exits with "Happy coding!"
# ---------------------------------------------------------------------------

TEMPLATE_REPO_URL="https://github.com/Vijay431/vscode-extension-template.git"
TEMPLATE_BRANCH="main"

# ---- helpers ---------------------------------------------------------------

prompt_with_default() {
  local label="$1"
  local default="$2"
  local varname="$3"
  local required="${4:-false}"

  while true; do
    if [[ -n "$default" ]]; then
      printf "  %-22s [%s]: " "$label" "$default"
    else
      printf "  %-22s (required): " "$label"
    fi

    read -r input
    local value="${input:-$default}"

    if [[ -z "$value" && "$required" == "true" ]]; then
      echo "    ✗ This field is required." >&2
      continue
    fi

    printf -v "$varname" '%s' "$value"
    break
  done
}

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

setup_provider() {
  local provider="$1"

  if [[ "$provider" == "npm" ]]; then
    if ! command -v npm &>/dev/null; then
      echo "✗ npm not found. Install Node.js from https://nodejs.org/ and re-run." >&2
      exit 1
    fi
    return 0
  fi

  # pnpm or yarn — try corepack first (ships with Node >=16)
  if command -v "$provider" &>/dev/null; then
    return 0
  fi

  if command -v corepack &>/dev/null; then
    echo "  Setting up $provider via corepack…"
    corepack enable "$provider" 2>/dev/null || true
    corepack prepare "${provider}@latest" --activate 2>/dev/null || true
    if command -v "$provider" &>/dev/null; then
      return 0
    fi
  fi

  echo "✗ $provider not found." >&2
  echo "  Install it with: npm install -g $provider" >&2
  exit 1
}

# ---- preflight -------------------------------------------------------------

if ! command -v git &>/dev/null; then
  echo "✗ git not found. Install git and re-run." >&2
  exit 1
fi

# ---- collect defaults from git config --------------------------------------

DEFAULT_AUTHOR_NAME=$(git config --get user.name 2>/dev/null || echo "")
DEFAULT_AUTHOR_EMAIL=$(git config --get user.email 2>/dev/null || echo "")
DEFAULT_YEAR=$(date +%Y)

# ---- prompt ----------------------------------------------------------------

echo ""
echo "VS Code Extension Template — Bootstrap"
echo "───────────────────────────────────────"
echo "Press Enter to accept the default shown in [brackets]."
echo ""

prompt_with_default "Project ID (kebab)"  ""      PROJECT_ID    "true"

DERIVED_PROJECT_NAME=$(to_title_case "$PROJECT_ID")
prompt_with_default "Project name"        "$DERIVED_PROJECT_NAME"  PROJECT_NAME  "true"
prompt_with_default "Package manager"     "pnpm"   PROVIDER      "false"

# Normalise provider
PROVIDER="${PROVIDER:-pnpm}"
if [[ "$PROVIDER" != "npm" && "$PROVIDER" != "pnpm" && "$PROVIDER" != "yarn" ]]; then
  echo "  ⚠ Unknown provider '$PROVIDER'. Falling back to pnpm." >&2
  PROVIDER="pnpm"
fi

# ---- derive remaining tokens -----------------------------------------------

EXTENSION_NAME="$PROJECT_ID"
EXTENSION_ID=$(to_camel_case "$PROJECT_ID")
DISPLAY_NAME="$PROJECT_NAME"
AUTHOR_NAME="${DEFAULT_AUTHOR_NAME:-Your Name}"
AUTHOR_EMAIL="${DEFAULT_AUTHOR_EMAIL:-you@example.com}"
YEAR="$DEFAULT_YEAR"
DESCRIPTION="A VS Code extension."
GITHUB_USERNAME=$(slugify "${DEFAULT_AUTHOR_NAME:-your-username}")
PUBLISHER="$GITHUB_USERNAME"
REPO_URL="https://github.com/${GITHUB_USERNAME}/${PROJECT_ID}"
SITE_URL="https://${GITHUB_USERNAME}.github.io/${PROJECT_ID}"

# ---- confirmation ----------------------------------------------------------

echo ""
echo "Review:"
printf "  %-22s = %s\n" "Project ID"       "$PROJECT_ID"
printf "  %-22s = %s\n" "Project name"     "$PROJECT_NAME"
printf "  %-22s = %s\n" "Package manager"  "$PROVIDER"
printf "  %-22s = %s\n" "Extension ID"     "$EXTENSION_ID"
printf "  %-22s = %s\n" "Author"           "$AUTHOR_NAME <$AUTHOR_EMAIL>"
printf "  %-22s = %s\n" "Repo URL"         "$REPO_URL"
echo ""
printf "Apply? [y/N]: "
read -r confirm

if [[ "${confirm,,}" != "y" ]]; then
  echo "Aborted. No files changed."
  exit 0
fi

# ---- provider setup --------------------------------------------------------

echo ""
echo "Setting up package manager…"
setup_provider "$PROVIDER"
echo "  ✓ $PROVIDER ready."

# ---- check target dir ------------------------------------------------------

TARGET_DIR="$PROJECT_ID"
if [[ -e "$TARGET_DIR" ]] && [[ -n "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]]; then
  echo "✗ Directory './$TARGET_DIR' already exists and is not empty." >&2
  echo "  Remove or rename it, then re-run." >&2
  exit 1
fi

# ---- clone -----------------------------------------------------------------

echo ""
echo "Cloning template…"
git clone --depth 1 --branch "$TEMPLATE_BRANCH" "$TEMPLATE_REPO_URL" "$TARGET_DIR"
echo "  ✓ Cloned into ./$TARGET_DIR"

cd "$TARGET_DIR"

echo "  Removing template git history…"
rm -rf .git

# Remove the bootstrap script from the clone — it doesn't belong in the new project
rm -f install.sh

# ---- replace tokens --------------------------------------------------------

echo ""
echo "Filling in project tokens…"

mapfile -t FILES < <(find . -type f | sed 's|^\./||')

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

replaced=0
for f in "${FILES[@]}"; do
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
    -e "s|{{EXTENSION_NAME}}|${EXTENSION_NAME}|g" \
    -e "s|{{DISPLAY_NAME}}|${DISPLAY_NAME}|g" \
    -e "s|{{EXTENSION_ID}}|${EXTENSION_ID}|g" \
    -e "s|{{PUBLISHER}}|${PUBLISHER}|g" \
    -e "s|{{DESCRIPTION}}|${DESCRIPTION}|g" \
    -e "s|{{AUTHOR_NAME}}|${AUTHOR_NAME}|g" \
    -e "s|{{AUTHOR_EMAIL}}|${AUTHOR_EMAIL}|g" \
    -e "s|{{REPO_URL}}|${REPO_URL}|g" \
    -e "s|{{SITE_URL}}|${SITE_URL}|g" \
    -e "s|{{GITHUB_USERNAME}}|${GITHUB_USERNAME}|g" \
    -e "s|{{YEAR}}|${YEAR}|g" \
    "$f"
  replaced=$((replaced + 1))
done

echo "  ✓ Processed ${replaced} files."

# ---- verify no tokens remain -----------------------------------------------

remaining=$(grep -rE '\{\{(EXTENSION_NAME|DISPLAY_NAME|EXTENSION_ID|PUBLISHER|DESCRIPTION|AUTHOR_NAME|AUTHOR_EMAIL|REPO_URL|SITE_URL|GITHUB_USERNAME|YEAR)\}\}' \
  --include='*.ts' --include='*.js' --include='*.json' \
  --include='*.md' --include='*.yml' --include='*.yaml' \
  --include='*.html' --include='*.css' --include='*.sh' \
  . 2>/dev/null | grep -v 'node_modules' | grep -v 'dist/' | grep -v 'out-test/' | grep -v 'coverage/' || true)

if [[ -n "$remaining" ]]; then
  echo ""
  echo "⚠ Unreplaced tokens found — edit these files manually:" >&2
  echo "$remaining" >&2
fi

# ---- un-deform .github placeholders ----------------------------------------

echo ""
echo "Enabling .github files…"
while IFS= read -r f; do mv "$f" "${f%.init}"; done \
  < <(find .github -type f -name '*.init' 2>/dev/null)
echo "  ✓ .github files enabled."

# ---- non-pnpm lockfile cleanup ---------------------------------------------

if [[ "$PROVIDER" != "pnpm" ]]; then
  echo ""
  echo "Removing pnpm-specific files for $PROVIDER project…"
  [[ -f pnpm-lock.yaml ]]    && rm -f pnpm-lock.yaml    && echo "  ✓ Removed pnpm-lock.yaml"
  [[ -f pnpm-workspace.yaml ]] && rm -f pnpm-workspace.yaml && echo "  ✓ Removed pnpm-workspace.yaml"
fi

# ---- install dependencies --------------------------------------------------

echo ""
echo "Installing dependencies with $PROVIDER…"
"$PROVIDER" install
echo "  ✓ Dependencies installed."

# ---- done ------------------------------------------------------------------

echo ""
echo "✓ Project ready in ./${PROJECT_ID}"
echo ""
echo "Next steps:"
echo "  cd ${PROJECT_ID}"
echo "  git init && git add . && git commit -m 'chore: init from vscode-extension-template'"
echo "  code ."
echo "  # Press F5 in VS Code to launch the Extension Development Host"
echo ""
echo "  Happy coding!"
