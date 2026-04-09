import { describe, it, expect } from 'vitest';
import { missionCreateBody, missionUpdateBody } from '../../backend/validations/mission.validation';
import { objectiveCreateBody, objectiveUpdateBody } from '../../backend/validations/objectives.validation';
import { planCreateBody, planUpdateBody } from '../../backend/validations/plans.validation';

describe('missionCreateBody', () => {
  it('accepts valid mission', () => {
    expect(missionCreateBody.safeParse({ title: 'My Mission' }).success).toBe(true);
  });

  it('rejects empty title', () => {
    expect(missionCreateBody.safeParse({ title: '' }).success).toBe(false);
  });

  it('rejects missing title', () => {
    expect(missionCreateBody.safeParse({}).success).toBe(false);
    expect(missionCreateBody.safeParse({ description: 'desc' }).success).toBe(false);
  });
});

describe('missionUpdateBody', () => {
  it('accepts empty object', () => {
    expect(missionUpdateBody.safeParse({}).success).toBe(true);
  });

  it('accepts valid status', () => {
    expect(missionUpdateBody.safeParse({ status: 'completed' }).success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(missionUpdateBody.safeParse({ status: 'done' }).success).toBe(false);
  });
});

describe('objectiveCreateBody', () => {
  it('accepts valid objective', () => {
    expect(objectiveCreateBody.safeParse({ missionId: 1, title: 'Obj' }).success).toBe(true);
  });

  it('rejects missing missionId', () => {
    expect(objectiveCreateBody.safeParse({ title: 'Obj' }).success).toBe(false);
  });

  it('rejects missing title', () => {
    expect(objectiveCreateBody.safeParse({ missionId: 1 }).success).toBe(false);
  });
});

describe('objectiveUpdateBody', () => {
  it('accepts empty object', () => {
    expect(objectiveUpdateBody.safeParse({}).success).toBe(true);
  });

  it('accepts sortOrder', () => {
    expect(objectiveUpdateBody.safeParse({ sortOrder: 3 }).success).toBe(true);
  });
});

describe('planCreateBody', () => {
  it('accepts valid plan', () => {
    expect(planCreateBody.safeParse({ objectiveId: 1, title: 'Plan' }).success).toBe(true);
  });

  it('accepts plan with deadline', () => {
    expect(planCreateBody.safeParse({ objectiveId: 1, title: 'P', deadline: '2026-04-05' }).success).toBe(true);
  });

  it('rejects invalid deadline', () => {
    expect(planCreateBody.safeParse({ objectiveId: 1, title: 'P', deadline: 'next week' }).success).toBe(false);
  });

  it('rejects missing objectiveId', () => {
    expect(planCreateBody.safeParse({ title: 'Plan' }).success).toBe(false);
  });
});

describe('planUpdateBody', () => {
  it('accepts empty object', () => {
    expect(planUpdateBody.safeParse({}).success).toBe(true);
  });

  it('accepts status change', () => {
    expect(planUpdateBody.safeParse({ status: 'completed' }).success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(planUpdateBody.safeParse({ status: 'done' }).success).toBe(false);
  });
});
