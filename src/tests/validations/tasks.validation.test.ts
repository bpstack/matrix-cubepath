import { describe, it, expect } from 'vitest';
import { taskCreateBody, taskUpdateBody } from '../../backend/validations/tasks.validation';

describe('taskCreateBody', () => {
  it('accepts minimal valid task', () => {
    expect(taskCreateBody.safeParse({ planId: 1, title: 'Do something' }).success).toBe(true);
  });

  it('accepts full valid task', () => {
    const result = taskCreateBody.safeParse({
      planId: 1,
      title: 'Task',
      description: 'desc',
      status: 'in_progress',
      priority: 'high',
      sortOrder: 2,
      deadline: '2026-04-05',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing planId', () => {
    expect(taskCreateBody.safeParse({ title: 'Task' }).success).toBe(false);
  });

  it('rejects empty title', () => {
    expect(taskCreateBody.safeParse({ planId: 1, title: '' }).success).toBe(false);
  });

  it('rejects invalid status', () => {
    expect(taskCreateBody.safeParse({ planId: 1, title: 'T', status: 'completed' }).success).toBe(false);
  });

  it('rejects invalid priority', () => {
    expect(taskCreateBody.safeParse({ planId: 1, title: 'T', priority: 'critical' }).success).toBe(false);
  });

  it('rejects invalid deadline format', () => {
    expect(taskCreateBody.safeParse({ planId: 1, title: 'T', deadline: '04/05/2026' }).success).toBe(false);
  });
});

describe('taskUpdateBody', () => {
  it('accepts empty object (all optional)', () => {
    expect(taskUpdateBody.safeParse({}).success).toBe(true);
  });

  it('accepts partial update', () => {
    expect(taskUpdateBody.safeParse({ status: 'done' }).success).toBe(true);
    expect(taskUpdateBody.safeParse({ priority: 'urgent', deadline: '2026-04-06' }).success).toBe(true);
  });

  it('accepts empty string deadline (clear)', () => {
    expect(taskUpdateBody.safeParse({ deadline: '' }).success).toBe(true);
  });

  it('accepts null deadline (clear)', () => {
    expect(taskUpdateBody.safeParse({ deadline: null }).success).toBe(true);
  });

  it('rejects invalid deadline', () => {
    expect(taskUpdateBody.safeParse({ deadline: 'tomorrow' }).success).toBe(false);
  });
});
