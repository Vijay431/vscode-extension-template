#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# Template bootstrap — dual mode:
#   Bootstrap mode  (curl-pipe, no repo): clones template, replaces tokens.
#   Local mode      (already cloned):     replaces tokens in place.
#
# Bootstrap usage:
#   bash <(curl -fsSL https://raw.githubusercontent.com/Vijay431/vscode-extension-template/main/install.sh)
#
# Local usage (after cloning or via GitHub template):
#   pnpm run init
# ---------------------------------------------------------------------------

TEMPLATE_REPO_URL="https://github.com/Vijay431/vscode-extension-template.git"
TEMPLATE_BRANCH="main"

# ---- mode detection --------------------------------------------------------

# Bootstrap mode: package.json missing OR {{EXTENSION_NAME}} sentinel absent
if [[ ! -f package.json ]] || ! grep -qF '{{EXTENSION_NAME}}' package.json 2>/dev/null; then
  MODE="bootstrap"
else
  MODE="local"
fi

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

normalize_repo_url() {
  local raw="$1"
  if [[ "$raw" =~ ^git@github\.com:(.+)\.git$ ]]; then
    echo "https://github.com/${BASH_REMATCH[1]}"
  elif [[ "$raw" =~ ^git@github\.com:(.+)$ ]]; then
    echo "https://github.com/${BASH_REMATCH[1]}"
  elif [[ "$raw" =~ ^https://github\.com/(.+)\.git$ ]]; then
    echo "https://github.com/${BASH_REMATCH[1]}"
  else
    echo "${raw%.git}"
  fi
}

extract_github_username() {
  echo "$1" | sed 's|https://github.com/||' | cut -d'/' -f1
}

extract_repo_name() {
  echo "$1" | sed 's|https://github.com/||' | cut -d'/' -f2
}

# Portable sed -i (macOS vs Linux)
if sed --version 2>/dev/null | grep -q GNU; then
  sedi() { sed -i "$@"; }
else
  sedi() { sed -i '' "$@"; }
fi

enable_workflow_placeholders() {
  local workflow_dir=".github/workflows"
  local enabled=0

  [[ -d "$workflow_dir" ]] || return 0

  shopt -s nullglob
  local placeholders=("$workflow_dir"/*.yml.init "$workflow_dir"/*.yaml.init)
  shopt -u nullglob

  for placeholder in "${placeholders[@]}"; do
    local target="${placeholder%.init}"
    if [[ -e "$target" ]]; then
      echo "✗ Cannot enable workflow placeholder: '$target' already exists." >&2
      echo "  Remove either '$placeholder' or '$target', then re-run." >&2
      exit 1
    fi

    mv -- "$placeholder" "$target"
    enabled=$((enabled + 1))
  done

  if [[ "$enabled" -gt 0 ]]; then
    echo "  ✓ Enabled ${enabled} GitHub Actions workflow placeholder(s)."
  fi
}

# ---- preflight (bootstrap mode) --------------------------------------------

if [[ "$MODE" == "bootstrap" ]]; then
  for cmd in git curl; do
    if ! command -v "$cmd" &>/dev/null; then
      echo "✗ Required tool not found: $cmd" >&2
      echo "  Install $cmd and re-run." >&2
      exit 1
    fi
  done
fi

# ---- compute defaults ------------------------------------------------------

DEFAULT_AUTHOR_NAME=$(git config --get user.name 2>/dev/null || echo "")
DEFAULT_AUTHOR_EMAIL=$(git config --get user.email 2>/dev/null || echo "")
DEFAULT_YEAR=$(date +%Y)

if [[ "$MODE" == "local" ]]; then
  _raw_remote=$(git config --get remote.origin.url 2>/dev/null || echo "")
  DEFAULT_REPO_URL=$(normalize_repo_url "$_raw_remote")
  DEFAULT_GITHUB_USERNAME=$(extract_github_username "$DEFAULT_REPO_URL")
  _repo_basename=$(extract_repo_name "$DEFAULT_REPO_URL")
  DEFAULT_EXTENSION_NAME=$(basename "$PWD" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')
  DEFAULT_SITE_URL="https://${DEFAULT_GITHUB_USERNAME}.github.io/${_repo_basename}"
else
  # bootstrap: no cwd repo context — leave fields empty/derived after EXTENSION_NAME
  DEFAULT_EXTENSION_NAME=""
  DEFAULT_REPO_URL=""
  DEFAULT_GITHUB_USERNAME=""
  DEFAULT_SITE_URL=""
fi

DEFAULT_PUBLISHER="$DEFAULT_GITHUB_USERNAME"

# ---- collect inputs --------------------------------------------------------

echo ""
if [[ "$MODE" == "bootstrap" ]]; then
  echo "VS Code Extension Template — Bootstrap (auto-clone)"
else
  echo "VS Code Extension Template — Bootstrap"
fi
echo "────────────────────────────────────────"
echo "Press Enter to accept the default shown in [brackets]."
echo ""

prompt_with_default "Extension name"    "$DEFAULT_EXTENSION_NAME"    EXTENSION_NAME     "true"

# Derive display/ID defaults from the entered name
DERIVED_DISPLAY_NAME=$(to_title_case "$EXTENSION_NAME")
DERIVED_EXTENSION_ID=$(to_camel_case "$EXTENSION_NAME")

prompt_with_default "Display name"      "$DERIVED_DISPLAY_NAME"      DISPLAY_NAME       "true"
prompt_with_default "Extension ID"      "$DERIVED_EXTENSION_ID"      EXTENSION_ID       "true"
prompt_with_default "Publisher"         "$DEFAULT_PUBLISHER"         PUBLISHER          "true"
prompt_with_default "Description"       ""                            DESCRIPTION        "true"
prompt_with_default "Author name"       "$DEFAULT_AUTHOR_NAME"       AUTHOR_NAME        "true"
prompt_with_default "Author email"      "$DEFAULT_AUTHOR_EMAIL"      AUTHOR_EMAIL       "true"
prompt_with_default "Repository URL"    "$DEFAULT_REPO_URL"          REPO_URL           "true"

# Derive SITE_URL and GITHUB_USERNAME from entered REPO_URL
_entered_username=$(extract_github_username "$REPO_URL")
_entered_repo=$(extract_repo_name "$REPO_URL")
DERIVED_SITE_URL="https://${_entered_username}.github.io/${_entered_repo}"
DERIVED_GITHUB_USERNAME="$_entered_username"

prompt_with_default "Site URL"          "$DERIVED_SITE_URL"          SITE_URL           "false"
prompt_with_default "GitHub username"   "$DERIVED_GITHUB_USERNAME"   GITHUB_USERNAME    "true"
prompt_with_default "Year"              "$DEFAULT_YEAR"              YEAR               "true"

# ---- confirmation ----------------------------------------------------------

echo ""
echo "Review values:"
printf "  %-22s = %s\n" "EXTENSION_NAME"   "$EXTENSION_NAME"
printf "  %-22s = %s\n" "DISPLAY_NAME"     "$DISPLAY_NAME"
printf "  %-22s = %s\n" "EXTENSION_ID"     "$EXTENSION_ID"
printf "  %-22s = %s\n" "PUBLISHER"        "$PUBLISHER"
printf "  %-22s = %s\n" "DESCRIPTION"      "$DESCRIPTION"
printf "  %-22s = %s\n" "AUTHOR_NAME"      "$AUTHOR_NAME"
printf "  %-22s = %s\n" "AUTHOR_EMAIL"     "$AUTHOR_EMAIL"
printf "  %-22s = %s\n" "REPO_URL"         "$REPO_URL"
printf "  %-22s = %s\n" "SITE_URL"         "$SITE_URL"
printf "  %-22s = %s\n" "GITHUB_USERNAME"  "$GITHUB_USERNAME"
printf "  %-22s = %s\n" "YEAR"             "$YEAR"
echo ""
printf "Apply? [y/N]: "
read -r confirm

if [[ "${confirm,,}" != "y" ]]; then
  echo "Aborted. No files changed."
  exit 0
fi

# ---- bootstrap: clone repo -------------------------------------------------

if [[ "$MODE" == "bootstrap" ]]; then
  TARGET_DIR="$EXTENSION_NAME"
  if [[ -e "$TARGET_DIR" && -n "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]]; then
    echo "✗ Directory '$TARGET_DIR' already exists and is not empty." >&2
    exit 1
  fi

  echo ""
  echo "Cloning template…"
  git clone --depth 1 --branch "$TEMPLATE_BRANCH" "$TEMPLATE_REPO_URL" "$TARGET_DIR"
  echo "  ✓ Cloned into ./$TARGET_DIR"

  cd "$TARGET_DIR"

  echo "  Removing template git history…"
  rm -rf .git
fi

# ---- apply replacements ----------------------------------------------------

echo ""
echo "Replacing tokens…"

# Collect files (prefer git ls-files in local mode, fall back to find)
if [[ "$MODE" == "local" ]] && git rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
  mapfile -t FILES < <(git ls-files)
else
  mapfile -t FILES < <(find . -type f | sed 's|^\./||')
fi

# Exclusion patterns
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
  '^install\.sh$'
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

# ---- enable workflow placeholders -----------------------------------------

echo ""
echo "Enabling GitHub Actions workflow placeholders…"
enable_workflow_placeholders

# ---- verify no tokens remain -----------------------------------------------

remaining=$(grep -rE '\{\{(EXTENSION_NAME|DISPLAY_NAME|EXTENSION_ID|PUBLISHER|DESCRIPTION|AUTHOR_NAME|AUTHOR_EMAIL|REPO_URL|SITE_URL|GITHUB_USERNAME|YEAR)\}\}' \
  --include='*.ts' --include='*.js' --include='*.json' \
  --include='*.md' --include='*.yml' --include='*.yaml' \
  --include='*.html' --include='*.css' --include='*.sh' \
  --exclude='install.sh' \
  . 2>/dev/null | grep -v 'node_modules' | grep -v 'dist/' | grep -v 'out-test/' | grep -v 'coverage/' || true)

if [[ -n "$remaining" ]]; then
  echo ""
  echo "⚠ Unreplaced tokens found:" >&2
  echo "$remaining" >&2
  echo "Edit the listed files manually, then remove install.sh." >&2
  exit 1
fi

# ---- finalise --------------------------------------------------------------

if [[ "$MODE" == "bootstrap" ]]; then
  rm -f install.sh
  echo ""
  echo "✓ Template initialized in ./${EXTENSION_NAME}"
  echo ""
  echo "Next steps:"
  echo "  cd ${EXTENSION_NAME}"
  echo "  git init && git add . && git commit -m 'chore: init from vscode-extension-template'"
  echo "  pnpm install"
  echo "  code ."
else
  rm -- "$0"
  echo ""
  echo "✓ Template initialized. Run 'pnpm install' next."
fi
