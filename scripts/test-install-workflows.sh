#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

cp "$ROOT/install.sh" "$TMPDIR/install.sh"
mkdir -p "$TMPDIR/.github/workflows"
cat > "$TMPDIR/package.json" <<'JSON'
{
  "name": "{{EXTENSION_NAME}}",
  "scripts": {
    "init": "bash install.sh"
  }
}
JSON
cat > "$TMPDIR/.github/workflows/ci.yml.init" <<'YAML'
name: {{DISPLAY_NAME}} CI
on:
  push:
    branches:
      - main
jobs:
  noop:
    runs-on: ubuntu-latest
    steps:
      - run: echo ok
YAML

(
  cd "$TMPDIR"
  printf '%s\n' \
    'sample-extension' \
    'Sample Extension' \
    'sampleExtension' \
    'sample-publisher' \
    'Sample extension description' \
    'Sample Author' \
    'sample@example.com' \
    'https://github.com/sample/sample-extension' \
    'https://sample.github.io/sample-extension' \
    'sample' \
    '2026' \
    'y' | bash install.sh >"$TMPDIR/install.log"
)

if [[ -e "$TMPDIR/.github/workflows/ci.yml.init" ]]; then
  echo "Expected workflow placeholder to be renamed, but ci.yml.init still exists." >&2
  exit 1
fi

if [[ ! -e "$TMPDIR/.github/workflows/ci.yml" ]]; then
  echo "Expected ci.yml to exist after install." >&2
  exit 1
fi

if ! grep -q 'Sample Extension CI' "$TMPDIR/.github/workflows/ci.yml"; then
  echo "Expected workflow tokens to be replaced before enabling." >&2
  exit 1
fi

if [[ -e "$TMPDIR/install.sh" ]]; then
  echo "Expected install.sh to self-delete in local mode." >&2
  exit 1
fi
