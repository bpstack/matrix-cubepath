import { describe, it, expect } from 'vitest';
import { projectCreateBody, projectUpdateBody, projectLinkBody } from '../../backend/validations/projects.validation';

describe('projectCreateBody', () => {
  it('accepts minimal project', () => {
    expect(projectCreateBody.safeParse({ name: 'My Project' }).success).toBe(true);
  });

  it('accepts full project', () => {
    expect(
      projectCreateBody.safeParse({
        name: 'Proj',
        path: '/home/user/proj',
        description: 'desc',
        url: 'https://github.com/owner/repo',
        status: 'active',
        tags: ['node', 'react'],
      }).success,
    ).toBe(true);
  });

  it('accepts owner/repo URL format', () => {
    expect(projectCreateBody.safeParse({ name: 'P', url: 'bpstack/matrix' }).success).toBe(true);
  });

  it('rejects invalid URL', () => {
    expect(projectCreateBody.safeParse({ name: 'P', url: 'not a url' }).success).toBe(false);
  });

  it('rejects empty name', () => {
    expect(projectCreateBody.safeParse({ name: '' }).success).toBe(false);
  });

  it('rejects invalid status', () => {
    expect(projectCreateBody.safeParse({ name: 'P', status: 'deleted' }).success).toBe(false);
  });
});

describe('projectUpdateBody', () => {
  it('accepts empty object', () => {
    expect(projectUpdateBody.safeParse({}).success).toBe(true);
  });

  it('accepts partial fields', () => {
    expect(projectUpdateBody.safeParse({ status: 'paused' }).success).toBe(true);
  });
});

describe('projectLinkBody', () => {
  it('accepts valid link', () => {
    expect(projectLinkBody.safeParse({ linkableType: 'task', linkableId: 5 }).success).toBe(true);
  });

  it('rejects invalid linkableType', () => {
    expect(projectLinkBody.safeParse({ linkableType: 'project', linkableId: 1 }).success).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(projectLinkBody.safeParse({ linkableType: 'task' }).success).toBe(false);
  });
});
