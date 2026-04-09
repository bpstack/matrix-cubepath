import { describe, it, expect } from 'vitest';
import { noteDateParam, noteBody } from '../../backend/validations/notes.validation';

describe('noteDateParam', () => {
  it('accepts valid date', () => {
    const today = new Date().toISOString().slice(0, 10);
    const result = noteDateParam.safeParse({ date: today });
    expect(result.success).toBe(true);
  });

  it('rejects invalid format', () => {
    expect(noteDateParam.safeParse({ date: '03-22-2026' }).success).toBe(false);
    expect(noteDateParam.safeParse({ date: 'today' }).success).toBe(false);
  });

  it('rejects date more than 1 year away', () => {
    expect(noteDateParam.safeParse({ date: '2099-01-01' }).success).toBe(false);
    expect(noteDateParam.safeParse({ date: '2000-01-01' }).success).toBe(false);
  });

  it('rejects impossible date', () => {
    expect(noteDateParam.safeParse({ date: '2026-02-30' }).success).toBe(false);
  });

  it('rejects missing date', () => {
    expect(noteDateParam.safeParse({}).success).toBe(false);
  });
});

describe('noteBody', () => {
  it('accepts valid content', () => {
    const result = noteBody.safeParse({ content: 'Hello world' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.content).toBe('Hello world');
  });

  it('accepts empty string', () => {
    expect(noteBody.safeParse({ content: '' }).success).toBe(true);
  });

  it('rejects content over 5000 chars', () => {
    expect(noteBody.safeParse({ content: 'a'.repeat(5001) }).success).toBe(false);
  });

  it('strips control characters', () => {
    const result = noteBody.safeParse({ content: 'hello\x00\x07world' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.content).toBe('helloworld');
  });

  it('preserves newlines and tabs', () => {
    const result = noteBody.safeParse({ content: 'line1\nline2\ttab' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.content).toBe('line1\nline2\ttab');
  });
});
