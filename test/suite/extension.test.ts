import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import * as vscode from 'vscode';

interface PackageManifest {
  name: string;
  publisher: string;
  contributes: { commands: { command: string }[] };
}

// Compiled to out-test/test/suite/, so the extension root is three levels up.
const manifest = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../package.json'), 'utf8'),
) as PackageManifest;

const extensionId = `${manifest.publisher}.${manifest.name}`;
const commandIds = manifest.contributes.commands.map((c) => c.command);

function commandId(suffix: string): string {
  const id = commandIds.find((c) => c.endsWith(`.${suffix}`));
  assert.ok(id, `package.json should contribute a command ending in .${suffix}`);
  return id;
}

suite('Extension Integration', () => {
  suiteSetup(async () => {
    const extension = vscode.extensions.getExtension(extensionId);
    assert.ok(extension, `extension ${extensionId} should be installed in the test host`);
    await extension.activate();
  });

  test('should activate the extension', () => {
    const extension = vscode.extensions.getExtension(extensionId);
    assert.ok(extension);
    assert.strictEqual(extension.isActive, true);
  });

  test('should register all contributed commands', async () => {
    const registered = await vscode.commands.getCommands(true);
    for (const suffix of ['helloWorld', 'enable', 'disable', 'showOutputChannel']) {
      const id = commandId(suffix);
      assert.ok(registered.includes(id), `command ${id} should be registered`);
    }
  });
});
