import { afterEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';

import { BaseCommandHandler } from '../../src/commands/BaseCommandHandler';
import type { CommandResult } from '../../src/commands/BaseCommandHandler';
import type { IAccessibilityService } from '../../src/di/interfaces/IAccessibilityService';
import type { ILogger } from '../../src/di/interfaces/ILogger';

class TestHandler extends BaseCommandHandler {
  constructor() {
    super('Test', {} as ILogger, {} as IAccessibilityService);
  }
  public async execute(): Promise<CommandResult> {
    return this.success('ok');
  }
  public checkHasSelection() {
    return this.hasSelection();
  }
  public checkSelectedText() {
    return this.getSelectedText();
  }
  public makeError(message: string, error?: unknown) {
    return this.error(message, error);
  }
}

const setEditor = (editor: unknown) => {
  (vscode.window as { activeTextEditor: unknown }).activeTextEditor = editor;
};

const pos = (line: number, ch: number) => new vscode.Position(line, ch);

describe('BaseCommandHandler', () => {
  afterEach(() => setEditor(undefined));

  it('should report no selection and no text when there is no editor', () => {
    setEditor(undefined);
    const h = new TestHandler();
    expect(h.checkHasSelection()).toBe(false);
    expect(h.checkSelectedText()).toBeUndefined();
  });

  it('should report no selection for an empty selection', () => {
    setEditor({
      selection: new vscode.Selection(pos(0, 1), pos(0, 1)),
      document: { getText: vi.fn() },
    });
    const h = new TestHandler();
    expect(h.checkHasSelection()).toBe(false);
    expect(h.checkSelectedText()).toBeUndefined();
  });

  it('should return selected text for a real selection', () => {
    const selection = new vscode.Selection(pos(0, 0), pos(0, 3));
    const getText = vi.fn().mockReturnValue('abc');
    setEditor({ selection, document: { getText } });
    const h = new TestHandler();
    expect(h.checkHasSelection()).toBe(true);
    expect(h.checkSelectedText()).toBe('abc');
    expect(getText).toHaveBeenCalledWith(selection);
  });

  it('should stringify Error, string and missing error details', () => {
    const h = new TestHandler();
    expect(h.makeError('m', new Error('boom'))).toEqual({
      success: false,
      message: 'm',
      error: 'boom',
    });
    expect(h.makeError('m', 'plain').error).toBe('plain');
    expect(h.makeError('m').error).toBe('');
  });
});
