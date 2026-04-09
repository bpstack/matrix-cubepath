import { describe, it, expect } from 'vitest';
import { settingsUpsertBody } from '../../backend/validations/settings.validation';
import { localSettingsSetBody } from '../../backend/validations/local-settings.validation';

describe('settingsUpsertBody', () => {
  it('accepts valid value', () => {
    expect(settingsUpsertBody.safeParse({ value: 'en' }).success).toBe(true);
    expect(settingsUpsertBody.safeParse({ value: '' }).success).toBe(true);
  });

  it('rejects missing value', () => {
    expect(settingsUpsertBody.safeParse({}).success).toBe(false);
  });

  it('rejects non-string', () => {
    expect(settingsUpsertBody.safeParse({ value: 123 }).success).toBe(false);
  });
});

describe('localSettingsSetBody', () => {
  it('accepts valid value', () => {
    expect(localSettingsSetBody.safeParse({ value: '/home/user/projects' }).success).toBe(true);
  });

  it('rejects missing value', () => {
    expect(localSettingsSetBody.safeParse({}).success).toBe(false);
  });
});
