import * as vscode from 'vscode';
import * as assert from 'assert';

suite('Smoke Tests', () => {
  test('should activate the extension', async () => {
    const ext = vscode.extensions.getExtension('{{PUBLISHER}}.{{EXTENSION_NAME}}');
    assert.ok(ext, 'Extension should be found');
    await ext.activate();
    assert.strictEqual(ext.isActive, true, 'Extension should be active');
  });

  test('should execute helloWorld command without error', async () => {
    await assert.doesNotReject(
      () => vscode.commands.executeCommand('{{EXTENSION_ID}}.helloWorld'),
      'helloWorld command should not throw',
    );
  });
});
