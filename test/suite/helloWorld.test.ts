import * as vscode from 'vscode';
import * as assert from 'assert';

suite('Hello World Command', () => {
  test('should execute without throwing', async () => {
    await assert.doesNotReject(
      () => vscode.commands.executeCommand('{{EXTENSION_ID}}.helloWorld'),
      'helloWorld command must not throw',
    );
  });
});
