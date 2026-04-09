import { describe, it, expect } from 'vitest';
import { deadlineField, cascadeDeleteBody } from '../../backend/validations/common.validation';

describe('deadlineField', () => {
  it('accepts valid YYYY-MM-DD', () => {
    expect(deadlineField.safeParse('2026-04-03').success).toBe(true);
    expect(deadlineField.safeParse('2025-12-31').success).toBe(true);
  });

  it('rejects invalid format', () => {
    expect(deadlineField.safeParse('04-03-2026').success).toBe(false);
    expect(deadlineField.safeParse('2026/04/03').success).toBe(false);
    expect(deadlineField.safeParse('2026-4-3').success).toBe(false);
    expect(deadlineField.safeParse('not-a-date').success).toBe(false);
  });

  it('rejects impossible dates', () => {
    expect(deadlineField.safeParse('2026-02-30').success).toBe(false);
    expect(deadlineField.safeParse('2026-13-01').success).toBe(false);
  });

  it('rejects non-string', () => {
    expect(deadlineField.safeParse(123).success).toBe(false);
    expect(deadlineField.safeParse(null).success).toBe(false);
  });
});

describe('cascadeDeleteBody', () => {
  it('accepts empty object (all optional)', () => {
    expect(cascadeDeleteBody.safeParse({}).success).toBe(true);
  });

  it('accepts valid action', () => {
    expect(cascadeDeleteBody.safeParse({ action: 'cascade' }).success).toBe(true);
    expect(cascadeDeleteBody.safeParse({ action: 'reassign', newParentId: 5 }).success).toBe(true);
  });

  it('rejects invalid action', () => {
    expect(cascadeDeleteBody.safeParse({ action: 'delete' }).success).toBe(false);
  });
});
