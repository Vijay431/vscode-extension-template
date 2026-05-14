#!/usr/bin/env node
/**
 * VS Code Extension Template — Bootstrap Script
 *
 * Prompts for project values, replaces {{TOKEN}} placeholders across the repo,
 * runs pnpm install + build + test:unit to verify the scaffold is healthy,
 * then self-deletes so the repo looks clean.
 *
 * Usage:  node init.mjs   (or: pnpm run init)
 * Flags:
 *   --dry-run    Preview replacements without writing any files.
 *   --reset-git  Wipe .git history and create a fresh initial commit after init.
 * Requires: Node.js >= 20
 */

import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  renameSync,
  unlinkSync,
  existsSync,
  rmSync,
} from 'node:fs';
import { join, extname, basename, dirname } from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(__filename);

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isResetGit = args.includes('--reset-git');

// ── Helpers ──────────────────────────────────────────────────────────────────

function kebab(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function camel(str) {
  return str
    .trim()
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toLowerCase());
}

function pascal(str) {
  const c = camel(str);
  return c.charAt(0).toUpperCase() + c.slice(1);
}

function isTextFile(filePath) {
  const binaryExts = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.vsix', '.zip', '.gz', '.tar',
    '.pdf', '.bin',
  ]);
  return !binaryExts.has(extname(filePath).toLowerCase());
}

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.vscode-test', 'dist', 'out-test', '_site', 'vendor', '.bundle',
]);

function* walkFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) yield* walkFiles(fullPath);
    } else {
      yield fullPath;
    }
  }
}

function replaceInFile(filePath, tokens, dryRun = false) {
  if (!isTextFile(filePath)) return false;
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return false; // skip unreadable files
  }

  let changed = false;
  for (const [placeholder, value] of Object.entries(tokens)) {
    const pattern = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (pattern.test(content)) {
      content = content.replace(pattern, value);
      changed = true;
    }
  }

  if (changed && !dryRun) writeFileSync(filePath, content, 'utf8');
  return changed;
}

function renamePathSegments(dir, tokens, dryRun = false) {
  // Walk bottom-up so we rename children before parents
  const entries = [];
  function collect(d) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) {
        if (!SKIP_DIRS.has(entry)) collect(full);
      }
      entries.push(full);
    }
  }
  collect(dir);
  entries.reverse();

  for (const oldPath of entries) {
    let newPath = oldPath;
    for (const [placeholder, value] of Object.entries(tokens)) {
      newPath = newPath.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        value,
      );
    }
    if (newPath !== oldPath && existsSync(oldPath)) {
      if (!dryRun) renameSync(oldPath, newPath);
      else console.log(`  rename: ${oldPath.replace(ROOT, '.')} → ${newPath.replace(ROOT, '.')}`);
    }
  }
}

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

/** Read a git config value; returns '' if git is not installed or key is unset. */
function gitConfigGet(key) {
  const result = spawnSync('git', ['config', key], { encoding: 'utf8', cwd: ROOT });
  return result.stdout?.trim() ?? '';
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const rl = createInterface({ input, output });

async function ask(question, defaultVal) {
  const prompt = defaultVal ? `${question} [${defaultVal}]: ` : `${question}: `;
  const answer = await rl.question(prompt);
  return answer.trim() || defaultVal || '';
}

async function main() {
  if (isDryRun) {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  VS Code Extension Template — DRY RUN            ║');
    console.log('║  No files will be written.                       ║');
    console.log('╚══════════════════════════════════════════════════╝\n');
  } else {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  VS Code Extension Template — Project Setup      ║');
    console.log('╚══════════════════════════════════════════════════╝\n');
  }
  console.log('Answer the prompts below. Press Enter to accept the default.\n');

  const dirName = basename(ROOT);
  const defaultName = kebab(dirName) || 'my-extension';
  const defaultDisplayName = pascal(defaultName.replace(/-/g, ' '));
  const defaultId = camel(defaultName);

  // Auto-read git config for author defaults
  const gitUserName = gitConfigGet('user.name');
  const gitUserEmail = gitConfigGet('user.email');

  const extensionName = await ask('Extension npm name (kebab-case)', defaultName);
  const displayName   = await ask('Display name (shown in VS Code UI)', defaultDisplayName);
  const extensionId   = await ask('Extension ID (camelCase, used in command IDs)', camel(extensionName));
  const publisher     = await ask('Publisher ID (VS Code Marketplace publisher)');
  const description   = await ask('Short description');
  const authorName    = await ask('Author name', gitUserName);
  const authorEmail   = await ask('Author email', gitUserEmail);
  const repoUrl       = await ask('GitHub repository URL (without .git)', `https://github.com/${publisher}/${extensionName}`);

  // Derive GitHub username from repo URL if possible, otherwise prompt
  const urlMatch = repoUrl.match(/github\.com\/([^/]+)/);
  const defaultGithubUser = urlMatch?.[1] ?? publisher;
  const githubUsername    = await ask('GitHub username', defaultGithubUser);

  const siteUrl       = await ask('GitHub Pages URL', `https://${githubUsername}.github.io/${extensionName}`);
  const year          = await ask('Copyright year', String(new Date().getFullYear()));

  rl.close();

  // Validate critical fields
  if (!publisher) {
    console.error('\nError: publisher is required.');
    process.exit(1);
  }
  if (!extensionName || !/^[a-z0-9-]+$/.test(extensionName)) {
    console.error('\nError: extension name must be lowercase kebab-case.');
    process.exit(1);
  }
  if (!extensionId || !/^[a-zA-Z][a-zA-Z0-9]*$/.test(extensionId)) {
    console.error('\nError: extension ID must be camelCase.');
    process.exit(1);
  }

  const tokens = {
    '{{EXTENSION_NAME}}':  extensionName,
    '{{DISPLAY_NAME}}':    displayName,
    '{{EXTENSION_ID}}':    extensionId,
    '{{PUBLISHER}}':       publisher,
    '{{DESCRIPTION}}':     description,
    '{{AUTHOR_NAME}}':     authorName,
    '{{AUTHOR_EMAIL}}':    authorEmail,
    '{{REPO_URL}}':        repoUrl,
    '{{GITHUB_USERNAME}}': githubUsername,
    '{{SITE_URL}}':        siteUrl,
    '{{YEAR}}':            year,
  };

  console.log('\n📝 Tokens resolved:');
  for (const [k, v] of Object.entries(tokens)) {
    console.log(`   ${k.padEnd(22)} → ${v}`);
  }
  console.log('');

  if (isDryRun) {
    // ── Dry-run: count changed files without writing ─────────────────────────
    console.log('🔍 Scanning files (dry run — nothing will be written)...\n');
    let changedCount = 0;
    for (const filePath of walkFiles(ROOT)) {
      if (filePath === __filename) continue;
      const changed = replaceInFile(filePath, tokens, true);
      if (changed) {
        console.log(`  would change: ${filePath.replace(ROOT, '.')}`);
        changedCount++;
      }
    }
    renamePathSegments(ROOT, tokens, true);
    console.log(`\n✅ Dry run complete. ${changedCount} file(s) would be modified.`);
    console.log('   Run without --dry-run to apply changes.\n');
    return;
  }

  // ── Replace tokens in all text files ────────────────────────────────────
  console.log('🔄 Replacing placeholders...');
  for (const filePath of walkFiles(ROOT)) {
    // Skip this script itself during replacement; it'll be deleted at the end
    if (filePath === __filename) continue;
    replaceInFile(filePath, tokens, false);
  }

  // ── Rename any path segments containing tokens ───────────────────────────
  // (Unlikely in the template, but keeps it future-proof)
  renamePathSegments(ROOT, tokens, false);

  // ── Verify no stray placeholders remain ─────────────────────────────────
  console.log('🔍 Verifying no placeholders remain...');
  const stray = [];
  for (const filePath of walkFiles(ROOT)) {
    if (filePath === __filename) continue;
    if (!isTextFile(filePath)) continue;
    try {
      const content = readFileSync(filePath, 'utf8');
      if (/\{\{[A-Z_]+\}\}/.test(content)) {
        stray.push(filePath.replace(ROOT, '.'));
      }
    } catch { /* skip */ }
  }
  if (stray.length > 0) {
    console.warn('⚠️  Unreplaced placeholders found in:');
    stray.forEach((f) => console.warn(`   ${f}`));
    console.warn('   These may be intentional (e.g., inside docs). Review them manually.\n');
  } else {
    console.log('✅ No unreplaced placeholders found.\n');
  }

  // ── Install dependencies ─────────────────────────────────────────────────
  console.log('📦 Installing dependencies...');
  run('pnpm install');

  // ── Build ────────────────────────────────────────────────────────────────
  console.log('\n🔨 Building extension...');
  run('pnpm run build');

  // ── Unit tests ───────────────────────────────────────────────────────────
  console.log('\n🧪 Running unit tests...');
  run('pnpm run test:unit');

  // ── Remove init script from package.json scripts ─────────────────────────
  console.log('\n🧹 Removing init script from package.json...');
  const pkgPath = join(ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  delete pkg.scripts['init'];
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  // ── Reset git history (opt-in) ───────────────────────────────────────────
  if (isResetGit) {
    console.log('\n🔄 Resetting git history...');
    rmSync(join(ROOT, '.git'), { recursive: true, force: true });
    run('git init');
    run('git add -A');
    run(`git commit -m "chore: initialize from vscode-extension-template"`);
    console.log('✅ Fresh git history created.\n');
  }

  // ── Self-delete ──────────────────────────────────────────────────────────
  console.log('🗑  Deleting init.mjs...');
  unlinkSync(__filename);

  // ── Done ─────────────────────────────────────────────────────────────────
  const gitSteps = isResetGit
    ? `  1. Press F5 in VS Code to launch the Extension Development Host.
  2. Run "Hello World" from the Command Palette — you should see the info message.
  3. Copy src/commands/HelloWorldCommand.ts → your first real command.
  4. Register it in src/managers/CommandsManager.ts.
  5. Add it to package.json contributes.commands.
  6. Push your repo:
       git remote add origin ${repoUrl}.git
       git push -u origin main`
    : `  1. Press F5 in VS Code to launch the Extension Development Host.
  2. Run "Hello World" from the Command Palette — you should see the info message.
  3. Copy src/commands/HelloWorldCommand.ts → your first real command.
  4. Register it in src/managers/CommandsManager.ts.
  5. Add it to package.json contributes.commands.
  6. Create your GitHub repo and push:
       git add -A && git commit -m "chore: initialize from vscode-extension-template"
       git remote add origin ${repoUrl}.git
       git push -u origin main`;

  console.log(`
╔══════════════════════════════════════════════════╗
║  🎉 ${displayName.padEnd(45)}║
║  is ready!                                       ║
╚══════════════════════════════════════════════════╝

Next steps:
${gitSteps}

Happy building! 🚀
`);
}

main().catch((err) => {
  console.error('\n❌ Initialization failed:', err);
  process.exit(1);
});
