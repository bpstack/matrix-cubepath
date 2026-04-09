import { describe, it, expect } from 'vitest';
import {
  ideaCreateBody,
  ideaUpdateBody,
  ideaEvaluateBody,
  ideaDecideBody,
  ideaPromoteBody,
} from '../../backend/validations/ideas.validation';

describe('ideaCreateBody', () => {
  it('accepts minimal idea', () => {
    expect(ideaCreateBody.safeParse({ title: 'My idea' }).success).toBe(true);
  });

  it('accepts full idea', () => {
    expect(
      ideaCreateBody.safeParse({
        title: 'Idea',
        description: 'desc',
        targetType: 'plan',
        targetId: 3,
        projectId: 1,
      }).success,
    ).toBe(true);
  });

  it('rejects empty title', () => {
    expect(ideaCreateBody.safeParse({ title: '' }).success).toBe(false);
  });

  it('rejects invalid targetType', () => {
    expect(ideaCreateBody.safeParse({ title: 'X', targetType: 'project' }).success).toBe(false);
  });
});

describe('ideaUpdateBody', () => {
  it('accepts empty object', () => {
    expect(ideaUpdateBody.safeParse({}).success).toBe(true);
  });

  it('accepts nullable fields', () => {
    expect(ideaUpdateBody.safeParse({ targetType: null, targetId: null }).success).toBe(true);
  });

  it('accepts valid status', () => {
    expect(ideaUpdateBody.safeParse({ status: 'approved' }).success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(ideaUpdateBody.safeParse({ status: 'done' }).success).toBe(false);
  });
});

describe('ideaEvaluateBody', () => {
  it('accepts valid scores', () => {
    expect(
      ideaEvaluateBody.safeParse({
        alignmentScore: 8,
        impactScore: 7,
        costScore: 3,
        riskScore: 2,
      }).success,
    ).toBe(true);
  });

  it('rejects scores out of range', () => {
    expect(
      ideaEvaluateBody.safeParse({
        alignmentScore: 0,
        impactScore: 7,
        costScore: 3,
        riskScore: 2,
      }).success,
    ).toBe(false);
    expect(
      ideaEvaluateBody.safeParse({
        alignmentScore: 8,
        impactScore: 11,
        costScore: 3,
        riskScore: 2,
      }).success,
    ).toBe(false);
  });

  it('rejects missing scores', () => {
    expect(ideaEvaluateBody.safeParse({ alignmentScore: 8 }).success).toBe(false);
  });
});

describe('ideaDecideBody', () => {
  it('accepts approved/rejected', () => {
    expect(ideaDecideBody.safeParse({ decision: 'approved' }).success).toBe(true);
    expect(ideaDecideBody.safeParse({ decision: 'rejected' }).success).toBe(true);
  });

  it('rejects other values', () => {
    expect(ideaDecideBody.safeParse({ decision: 'pending' }).success).toBe(false);
  });
});

describe('ideaPromoteBody', () => {
  it('accepts valid types', () => {
    expect(ideaPromoteBody.safeParse({ type: 'task', parentId: 1 }).success).toBe(true);
    expect(ideaPromoteBody.safeParse({ type: 'project' }).success).toBe(true);
  });

  it('rejects invalid type', () => {
    expect(ideaPromoteBody.safeParse({ type: 'idea' }).success).toBe(false);
  });
});
