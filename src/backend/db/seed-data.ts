/**
 * Declarative seed data for the demo user.
 *
 * All translatable strings are referenced by locale key (matching keys in
 * seed-locales/*.json). Structural data (statuses, priorities, scores, dates)
 * lives here; human-readable text lives in the JSON locale files.
 */

import type enLocale from './seed-locales/en.json';

/** Every key present in the locale JSON files. */
export type SeedLocaleKey = keyof typeof enLocale;

/** A locale dictionary — one per supported language. */
export type SeedLocale = Record<SeedLocaleKey, string>;

// ── Objectives ───────────────────────────────────────────────────────────────

export interface SeedObjective {
  titleKey: SeedLocaleKey;
  descKey: SeedLocaleKey;
  sortOrder: number;
  status: string;
  createdOffset: number;
  updatedOffset: number;
}

export const SEED_OBJECTIVES: SeedObjective[] = [
  {
    titleKey: 'obj1Title',
    descKey: 'obj1Desc',
    sortOrder: 0,
    status: 'completed',
    createdOffset: -18,
    updatedOffset: -5,
  },
  {
    titleKey: 'obj2Title',
    descKey: 'obj2Desc',
    sortOrder: 1,
    status: 'in_progress',
    createdOffset: -15,
    updatedOffset: -1,
  },
  {
    titleKey: 'obj3Title',
    descKey: 'obj3Desc',
    sortOrder: 2,
    status: 'in_progress',
    createdOffset: -10,
    updatedOffset: -1,
  },
  {
    titleKey: 'obj4Title',
    descKey: 'obj4Desc',
    sortOrder: 3,
    status: 'completed',
    createdOffset: -6,
    updatedOffset: -1,
  },
];

// ── Plans ────────────────────────────────────────────────────────────────────

// Fixed deadline dates (hackathon window)
export const D3 = '2026-04-03';
export const D4 = '2026-04-04';
export const D5 = '2026-04-05';
export const D6 = '2026-04-06';

export interface SeedPlan {
  objectiveIdx: number; // index into SEED_OBJECTIVES
  titleKey: SeedLocaleKey;
  descKey: SeedLocaleKey;
  sortOrder: number;
  status: string;
  deadlineOffset: number | string; // number = day offset, string = fixed date
  createdOffset: number;
  updatedOffset: number;
}

export const SEED_PLANS: SeedPlan[] = [
  {
    objectiveIdx: 0,
    titleKey: 'plan1Title',
    descKey: 'plan1Desc',
    sortOrder: 0,
    status: 'completed',
    deadlineOffset: -10,
    createdOffset: -18,
    updatedOffset: -12,
  },
  {
    objectiveIdx: 0,
    titleKey: 'plan2Title',
    descKey: 'plan2Desc',
    sortOrder: 1,
    status: 'completed',
    deadlineOffset: -8,
    createdOffset: -14,
    updatedOffset: -6,
  },
  {
    objectiveIdx: 1,
    titleKey: 'plan3Title',
    descKey: 'plan3Desc',
    sortOrder: 0,
    status: 'in_progress',
    deadlineOffset: D4,
    createdOffset: -12,
    updatedOffset: -1,
  },
  {
    objectiveIdx: 1,
    titleKey: 'plan4Title',
    descKey: 'plan4Desc',
    sortOrder: 1,
    status: 'in_progress',
    deadlineOffset: D5,
    createdOffset: -8,
    updatedOffset: -1,
  },
  {
    objectiveIdx: 2,
    titleKey: 'plan5Title',
    descKey: 'plan5Desc',
    sortOrder: 0,
    status: 'completed',
    deadlineOffset: -3,
    createdOffset: -7,
    updatedOffset: -2,
  },
  {
    objectiveIdx: 2,
    titleKey: 'plan6Title',
    descKey: 'plan6Desc',
    sortOrder: 1,
    status: 'in_progress',
    deadlineOffset: D6,
    createdOffset: -5,
    updatedOffset: -1,
  },
  {
    objectiveIdx: 3,
    titleKey: 'plan7Title',
    descKey: 'plan7Desc',
    sortOrder: 0,
    status: 'completed',
    deadlineOffset: -2,
    createdOffset: -5,
    updatedOffset: -1,
  },
  {
    objectiveIdx: 3,
    titleKey: 'plan8Title',
    descKey: 'plan8Desc',
    sortOrder: 1,
    status: 'completed',
    deadlineOffset: -1,
    createdOffset: -3,
    updatedOffset: -1,
  },
];

// ── Tasks ────────────────────────────────────────────────────────────────────

export interface SeedTask {
  planIdx: number; // index into SEED_PLANS
  titleKey: SeedLocaleKey;
  descKey: SeedLocaleKey | null;
  status: string;
  priority: string;
  sortOrder: number;
  deadlineOffset: number | string | null;
  completedOffset: number | null;
  createdOffset: number;
  updatedOffset: number;
}

export const SEED_TASKS: SeedTask[] = [
  // plan 0 — Database Architecture (completed)
  {
    planIdx: 0,
    titleKey: 't1',
    descKey: 't1d',
    status: 'done',
    priority: 'high',
    sortOrder: 0,
    deadlineOffset: -16,
    completedOffset: -16,
    createdOffset: -18,
    updatedOffset: -16,
  },
  {
    planIdx: 0,
    titleKey: 't2',
    descKey: null,
    status: 'done',
    priority: 'medium',
    sortOrder: 1,
    deadlineOffset: -14,
    completedOffset: -14,
    createdOffset: -17,
    updatedOffset: -14,
  },
  {
    planIdx: 0,
    titleKey: 't3',
    descKey: 't3d',
    status: 'done',
    priority: 'medium',
    sortOrder: 2,
    deadlineOffset: -13,
    completedOffset: -13,
    createdOffset: -16,
    updatedOffset: -13,
  },
  // plan 1 — Auth System (completed)
  {
    planIdx: 1,
    titleKey: 't4',
    descKey: 't4d',
    status: 'done',
    priority: 'urgent',
    sortOrder: 0,
    deadlineOffset: -12,
    completedOffset: -10,
    createdOffset: -14,
    updatedOffset: -10,
  },
  {
    planIdx: 1,
    titleKey: 't5',
    descKey: 't5d',
    status: 'done',
    priority: 'high',
    sortOrder: 1,
    deadlineOffset: -10,
    completedOffset: -9,
    createdOffset: -13,
    updatedOffset: -9,
  },
  {
    planIdx: 1,
    titleKey: 't6',
    descKey: 't6d',
    status: 'done',
    priority: 'high',
    sortOrder: 2,
    deadlineOffset: -8,
    completedOffset: -7,
    createdOffset: -12,
    updatedOffset: -7,
  },
  {
    planIdx: 1,
    titleKey: 't7',
    descKey: 't7d',
    status: 'done',
    priority: 'medium',
    sortOrder: 3,
    deadlineOffset: null,
    completedOffset: -6,
    createdOffset: -11,
    updatedOffset: -6,
  },
  // plan 2 — Task Board (in progress)
  {
    planIdx: 2,
    titleKey: 't8',
    descKey: null,
    status: 'done',
    priority: 'high',
    sortOrder: 0,
    deadlineOffset: -2,
    completedOffset: -5,
    createdOffset: -12,
    updatedOffset: -5,
  },
  {
    planIdx: 2,
    titleKey: 't9',
    descKey: 't9d',
    status: 'done',
    priority: 'medium',
    sortOrder: 1,
    deadlineOffset: null,
    completedOffset: -3,
    createdOffset: -10,
    updatedOffset: -3,
  },
  {
    planIdx: 2,
    titleKey: 't10',
    descKey: 't10d',
    status: 'in_progress',
    priority: 'high',
    sortOrder: 2,
    deadlineOffset: D3,
    completedOffset: null,
    createdOffset: -8,
    updatedOffset: -1,
  },
  {
    planIdx: 2,
    titleKey: 't11',
    descKey: null,
    status: 'in_progress',
    priority: 'medium',
    sortOrder: 3,
    deadlineOffset: D4,
    completedOffset: null,
    createdOffset: -6,
    updatedOffset: -1,
  },
  {
    planIdx: 2,
    titleKey: 't12',
    descKey: null,
    status: 'pending',
    priority: 'low',
    sortOrder: 4,
    deadlineOffset: D6,
    completedOffset: null,
    createdOffset: -4,
    updatedOffset: -4,
  },
  {
    planIdx: 2,
    titleKey: 't13',
    descKey: null,
    status: 'pending',
    priority: 'medium',
    sortOrder: 5,
    deadlineOffset: D5,
    completedOffset: null,
    createdOffset: -3,
    updatedOffset: -3,
  },
  {
    planIdx: 2,
    titleKey: 't14',
    descKey: null,
    status: 'done',
    priority: 'low',
    sortOrder: 6,
    deadlineOffset: D5,
    completedOffset: -1,
    createdOffset: -3,
    updatedOffset: -1,
  },
  // plan 3 — Ideas Pipeline (in progress)
  {
    planIdx: 3,
    titleKey: 't15',
    descKey: null,
    status: 'done',
    priority: 'high',
    sortOrder: 0,
    deadlineOffset: -1,
    completedOffset: -2,
    createdOffset: -8,
    updatedOffset: -2,
  },
  {
    planIdx: 3,
    titleKey: 't16',
    descKey: 't16d',
    status: 'in_progress',
    priority: 'high',
    sortOrder: 1,
    deadlineOffset: D4,
    completedOffset: null,
    createdOffset: -6,
    updatedOffset: -1,
  },
  {
    planIdx: 3,
    titleKey: 't17',
    descKey: 't17d',
    status: 'pending',
    priority: 'medium',
    sortOrder: 2,
    deadlineOffset: D5,
    completedOffset: null,
    createdOffset: -5,
    updatedOffset: -5,
  },
  // plan 4 — Docker & Dokploy (completed)
  {
    planIdx: 4,
    titleKey: 't18',
    descKey: 't18d',
    status: 'done',
    priority: 'high',
    sortOrder: 0,
    deadlineOffset: -5,
    completedOffset: -4,
    createdOffset: -7,
    updatedOffset: -4,
  },
  {
    planIdx: 4,
    titleKey: 't19',
    descKey: null,
    status: 'done',
    priority: 'high',
    sortOrder: 1,
    deadlineOffset: -4,
    completedOffset: -3,
    createdOffset: -6,
    updatedOffset: -3,
  },
  {
    planIdx: 4,
    titleKey: 't20',
    descKey: 't20d',
    status: 'done',
    priority: 'high',
    sortOrder: 2,
    deadlineOffset: -4,
    completedOffset: -3,
    createdOffset: -6,
    updatedOffset: -3,
  },
  {
    planIdx: 4,
    titleKey: 't21',
    descKey: 't21d',
    status: 'done',
    priority: 'medium',
    sortOrder: 3,
    deadlineOffset: -3,
    completedOffset: -2,
    createdOffset: -5,
    updatedOffset: -2,
  },
  // plan 5 — CI/CD (in progress)
  {
    planIdx: 5,
    titleKey: 't22',
    descKey: null,
    status: 'done',
    priority: 'medium',
    sortOrder: 0,
    deadlineOffset: null,
    completedOffset: -1,
    createdOffset: -5,
    updatedOffset: -1,
  },
  {
    planIdx: 5,
    titleKey: 't23',
    descKey: 't23d',
    status: 'done',
    priority: 'high',
    sortOrder: 1,
    deadlineOffset: D3,
    completedOffset: -2,
    createdOffset: -4,
    updatedOffset: -2,
  },
  {
    planIdx: 5,
    titleKey: 't24',
    descKey: null,
    status: 'in_progress',
    priority: 'urgent',
    sortOrder: 2,
    deadlineOffset: D5,
    completedOffset: null,
    createdOffset: -3,
    updatedOffset: -1,
  },
  {
    planIdx: 5,
    titleKey: 't25',
    descKey: 't25d',
    status: 'pending',
    priority: 'high',
    sortOrder: 3,
    deadlineOffset: D6,
    completedOffset: null,
    createdOffset: -2,
    updatedOffset: -2,
  },
  // plan 6 — Responsive Design (completed)
  {
    planIdx: 6,
    titleKey: 't26',
    descKey: 't26d',
    status: 'done',
    priority: 'high',
    sortOrder: 0,
    deadlineOffset: -3,
    completedOffset: -2,
    createdOffset: -5,
    updatedOffset: -2,
  },
  {
    planIdx: 6,
    titleKey: 't27',
    descKey: 't27d',
    status: 'done',
    priority: 'medium',
    sortOrder: 1,
    deadlineOffset: -2,
    completedOffset: -2,
    createdOffset: -4,
    updatedOffset: -2,
  },
  {
    planIdx: 6,
    titleKey: 't28',
    descKey: 't28d',
    status: 'done',
    priority: 'medium',
    sortOrder: 2,
    deadlineOffset: -2,
    completedOffset: -1,
    createdOffset: -3,
    updatedOffset: -1,
  },
  {
    planIdx: 6,
    titleKey: 't29',
    descKey: 't29d',
    status: 'done',
    priority: 'low',
    sortOrder: 3,
    deadlineOffset: -1,
    completedOffset: -1,
    createdOffset: -3,
    updatedOffset: -1,
  },
  // plan 7 — PWA (completed)
  {
    planIdx: 7,
    titleKey: 't30',
    descKey: null,
    status: 'done',
    priority: 'high',
    sortOrder: 0,
    deadlineOffset: -2,
    completedOffset: -2,
    createdOffset: -3,
    updatedOffset: -2,
  },
  {
    planIdx: 7,
    titleKey: 't31',
    descKey: null,
    status: 'done',
    priority: 'medium',
    sortOrder: 1,
    deadlineOffset: -1,
    completedOffset: -1,
    createdOffset: -2,
    updatedOffset: -1,
  },
  {
    planIdx: 7,
    titleKey: 't32',
    descKey: null,
    status: 'done',
    priority: 'medium',
    sortOrder: 2,
    deadlineOffset: -1,
    completedOffset: -1,
    createdOffset: -2,
    updatedOffset: -1,
  },
  {
    planIdx: 7,
    titleKey: 't33',
    descKey: null,
    status: 'done',
    priority: 'low',
    sortOrder: 3,
    deadlineOffset: -1,
    completedOffset: -1,
    createdOffset: -2,
    updatedOffset: -1,
  },
];

// ── Projects ─────────────────────────────────────────────────────────────────

export interface SeedProject {
  nameKey: SeedLocaleKey;
  descKey: SeedLocaleKey;
  url: string;
  status: string;
  tags: string[];
  createdOffset: number;
  updatedOffset: number;
}

export const SEED_PROJECTS: SeedProject[] = [
  {
    nameKey: 'proj1Name',
    descKey: 'proj1Desc',
    url: 'bpstack/matrix-cubepath',
    status: 'active',
    tags: ['typescript', 'react', 'sqlite', 'docker', 'dokploy'],
    createdOffset: -20,
    updatedOffset: -1,
  },
  {
    nameKey: 'proj2Name',
    descKey: 'proj2Desc',
    url: 'bpstack/matrix',
    status: 'archived',
    tags: ['electron', 'typescript', 'react'],
    createdOffset: -90,
    updatedOffset: -15,
  },
  {
    nameKey: 'proj3Name',
    descKey: 'proj3Desc',
    url: 'bpstack/weather-bp',
    status: 'active',
    tags: ['typescript', 'openmeteo'],
    createdOffset: -120,
    updatedOffset: -20,
  },
];

// ── Project Links ────────────────────────────────────────────────────────────

export interface SeedProjectLink {
  projectIdx: number;
  linkableType: string;
  /** 'mission' for the single mission, or objectiveIdx for objectives */
  targetIdx: number | 'mission';
  createdOffset: number;
}

export const SEED_PROJECT_LINKS: SeedProjectLink[] = [
  { projectIdx: 0, linkableType: 'mission', targetIdx: 'mission', createdOffset: -19 },
  { projectIdx: 0, linkableType: 'objective', targetIdx: 2, createdOffset: -10 },
  { projectIdx: 0, linkableType: 'objective', targetIdx: 3, createdOffset: -6 },
  { projectIdx: 1, linkableType: 'objective', targetIdx: 1, createdOffset: -12 },
];

// ── Ideas ────────────────────────────────────────────────────────────────────

export interface SeedIdea {
  titleKey: SeedLocaleKey;
  descKey: SeedLocaleKey;
  status: string;
  targetType: string | null;
  targetObjIdx: number | null;
  projectIdx: number | null;
  createdOffset: number;
  updatedOffset: number;
}

export const SEED_IDEAS: SeedIdea[] = [
  {
    titleKey: 'idea1',
    descKey: 'idea1d',
    status: 'approved',
    targetType: 'objective',
    targetObjIdx: 1,
    projectIdx: 0,
    createdOffset: -14,
    updatedOffset: -5,
  },
  {
    titleKey: 'idea2',
    descKey: 'idea2d',
    status: 'evaluated',
    targetType: 'objective',
    targetObjIdx: 1,
    projectIdx: null,
    createdOffset: -10,
    updatedOffset: -3,
  },
  {
    titleKey: 'idea3',
    descKey: 'idea3d',
    status: 'approved',
    targetType: 'objective',
    targetObjIdx: 3,
    projectIdx: 0,
    createdOffset: -7,
    updatedOffset: -3,
  },
  {
    titleKey: 'idea4',
    descKey: 'idea4d',
    status: 'rejected',
    targetType: null,
    targetObjIdx: null,
    projectIdx: null,
    createdOffset: -12,
    updatedOffset: -4,
  },
  {
    titleKey: 'idea5',
    descKey: 'idea5d',
    status: 'pending',
    targetType: 'objective',
    targetObjIdx: 1,
    projectIdx: 0,
    createdOffset: -5,
    updatedOffset: -5,
  },
  {
    titleKey: 'idea6',
    descKey: 'idea6d',
    status: 'pending',
    targetType: 'objective',
    targetObjIdx: 1,
    projectIdx: null,
    createdOffset: -4,
    updatedOffset: -4,
  },
  {
    titleKey: 'idea7',
    descKey: 'idea7d',
    status: 'pending',
    targetType: 'objective',
    targetObjIdx: 1,
    projectIdx: null,
    createdOffset: -3,
    updatedOffset: -3,
  },
  {
    titleKey: 'idea8',
    descKey: 'idea8d',
    status: 'pending',
    targetType: 'objective',
    targetObjIdx: 1,
    projectIdx: 0,
    createdOffset: -6,
    updatedOffset: -6,
  },
  {
    titleKey: 'idea9',
    descKey: 'idea9d',
    status: 'pending',
    targetType: 'objective',
    targetObjIdx: 1,
    projectIdx: 0,
    createdOffset: -8,
    updatedOffset: -8,
  },
  {
    titleKey: 'idea10',
    descKey: 'idea10d',
    status: 'pending',
    targetType: null,
    targetObjIdx: null,
    projectIdx: null,
    createdOffset: -2,
    updatedOffset: -2,
  },
  {
    titleKey: 'idea11',
    descKey: 'idea11d',
    status: 'approved',
    targetType: 'objective',
    targetObjIdx: 1,
    projectIdx: 0,
    createdOffset: -8,
    updatedOffset: -2,
  },
  {
    titleKey: 'idea12',
    descKey: 'idea12d',
    status: 'evaluated',
    targetType: 'objective',
    targetObjIdx: 1,
    projectIdx: null,
    createdOffset: -6,
    updatedOffset: -2,
  },
  {
    titleKey: 'idea13',
    descKey: 'idea13d',
    status: 'approved',
    targetType: 'objective',
    targetObjIdx: 2,
    projectIdx: 0,
    createdOffset: -25,
    updatedOffset: -18,
  },
  {
    titleKey: 'idea14',
    descKey: 'idea14d',
    status: 'approved',
    targetType: 'objective',
    targetObjIdx: 2,
    projectIdx: 0,
    createdOffset: -9,
    updatedOffset: -4,
  },
];

// ── Idea Evaluations ─────────────────────────────────────────────────────────

export interface SeedEvaluation {
  ideaIdx: number;
  alignment: number;
  impact: number;
  cost: number;
  risk: number;
  total: number;
  reasoningKey: SeedLocaleKey;
  decision: string;
  decidedOffset: number | null;
  createdOffset: number;
}

export const SEED_EVALUATIONS: SeedEvaluation[] = [
  {
    ideaIdx: 0,
    alignment: 9,
    impact: 8,
    cost: 5,
    risk: 4,
    total: 78,
    reasoningKey: 'eval1',
    decision: 'approved',
    decidedOffset: -5,
    createdOffset: -10,
  },
  {
    ideaIdx: 1,
    alignment: 7,
    impact: 7,
    cost: 6,
    risk: 3,
    total: 72,
    reasoningKey: 'eval2',
    decision: 'pending',
    decidedOffset: null,
    createdOffset: -8,
  },
  {
    ideaIdx: 2,
    alignment: 8,
    impact: 9,
    cost: 8,
    risk: 2,
    total: 85,
    reasoningKey: 'eval3',
    decision: 'approved',
    decidedOffset: -3,
    createdOffset: -6,
  },
  {
    ideaIdx: 3,
    alignment: 4,
    impact: 9,
    cost: 2,
    risk: 8,
    total: 45,
    reasoningKey: 'eval4',
    decision: 'rejected',
    decidedOffset: -4,
    createdOffset: -9,
  },
  {
    ideaIdx: 5,
    alignment: 10,
    impact: 7,
    cost: 8,
    risk: 2,
    total: 82,
    reasoningKey: 'eval5',
    decision: 'approved',
    decidedOffset: -2,
    createdOffset: -6,
  },
  {
    ideaIdx: 6,
    alignment: 8,
    impact: 6,
    cost: 6,
    risk: 3,
    total: 69,
    reasoningKey: 'eval6',
    decision: 'pending',
    decidedOffset: null,
    createdOffset: -4,
  },
  {
    ideaIdx: 7,
    alignment: 10,
    impact: 10,
    cost: 7,
    risk: 3,
    total: 95,
    reasoningKey: 'eval7',
    decision: 'approved',
    decidedOffset: -18,
    createdOffset: -24,
  },
  {
    ideaIdx: 8,
    alignment: 9,
    impact: 8,
    cost: 9,
    risk: 1,
    total: 88,
    reasoningKey: 'eval8',
    decision: 'approved',
    decidedOffset: -4,
    createdOffset: -8,
  },
];

// ── Activity Log ─────────────────────────────────────────────────────────────

export interface SeedActivity {
  action: string;
  entityType: string;
  /** 'mission', objectiveIdx, taskN (1-based task count), or ideaIdx */
  entityRef:
    | { type: 'mission' }
    | { type: 'objective'; idx: number }
    | { type: 'task'; n: number }
    | { type: 'idea'; idx: number };
  descKey: SeedLocaleKey;
  createdOffset: number;
}

export const SEED_ACTIVITIES: SeedActivity[] = [
  {
    action: 'created',
    entityType: 'mission',
    entityRef: { type: 'mission' },
    descKey: 'actMission',
    createdOffset: -20,
  },
  {
    action: 'created',
    entityType: 'objective',
    entityRef: { type: 'objective', idx: 0 },
    descKey: 'actObj1',
    createdOffset: -18,
  },
  {
    action: 'created',
    entityType: 'objective',
    entityRef: { type: 'objective', idx: 1 },
    descKey: 'actObj2',
    createdOffset: -15,
  },
  {
    action: 'completed',
    entityType: 'task',
    entityRef: { type: 'task', n: 1 },
    descKey: 'actTask1',
    createdOffset: -16,
  },
  {
    action: 'completed',
    entityType: 'task',
    entityRef: { type: 'task', n: 2 },
    descKey: 'actTask2',
    createdOffset: -14,
  },
  {
    action: 'completed',
    entityType: 'task',
    entityRef: { type: 'task', n: 4 },
    descKey: 'actTask4',
    createdOffset: -10,
  },
  {
    action: 'completed',
    entityType: 'task',
    entityRef: { type: 'task', n: 5 },
    descKey: 'actTask5',
    createdOffset: -9,
  },
  {
    action: 'completed',
    entityType: 'task',
    entityRef: { type: 'task', n: 6 },
    descKey: 'actTask6',
    createdOffset: -7,
  },
  {
    action: 'created',
    entityType: 'objective',
    entityRef: { type: 'objective', idx: 2 },
    descKey: 'actObj3',
    createdOffset: -10,
  },
  {
    action: 'created',
    entityType: 'idea',
    entityRef: { type: 'idea', idx: 0 },
    descKey: 'actIdea1',
    createdOffset: -14,
  },
  {
    action: 'created',
    entityType: 'idea',
    entityRef: { type: 'idea', idx: 5 },
    descKey: 'actIdea6',
    createdOffset: -8,
  },
  {
    action: 'completed',
    entityType: 'task',
    entityRef: { type: 'task', n: 8 },
    descKey: 'actTask8',
    createdOffset: -5,
  },
  {
    action: 'completed',
    entityType: 'task',
    entityRef: { type: 'task', n: 9 },
    descKey: 'actTask9',
    createdOffset: -3,
  },
  {
    action: 'completed',
    entityType: 'task',
    entityRef: { type: 'task', n: 16 },
    descKey: 'actTask16',
    createdOffset: -4,
  },
  {
    action: 'completed',
    entityType: 'task',
    entityRef: { type: 'task', n: 17 },
    descKey: 'actTask17',
    createdOffset: -3,
  },
  {
    action: 'completed',
    entityType: 'task',
    entityRef: { type: 'task', n: 18 },
    descKey: 'actTask18',
    createdOffset: -3,
  },
  {
    action: 'completed',
    entityType: 'task',
    entityRef: { type: 'task', n: 19 },
    descKey: 'actTask19',
    createdOffset: -2,
  },
  {
    action: 'completed',
    entityType: 'task',
    entityRef: { type: 'task', n: 20 },
    descKey: 'actTask20',
    createdOffset: -2,
  },
  {
    action: 'completed',
    entityType: 'task',
    entityRef: { type: 'task', n: 21 },
    descKey: 'actTask21',
    createdOffset: -2,
  },
  {
    action: 'created',
    entityType: 'objective',
    entityRef: { type: 'objective', idx: 3 },
    descKey: 'actObj4',
    createdOffset: -6,
  },
  {
    action: 'completed',
    entityType: 'task',
    entityRef: { type: 'task', n: 24 },
    descKey: 'actTask24',
    createdOffset: -2,
  },
  {
    action: 'completed',
    entityType: 'task',
    entityRef: { type: 'task', n: 28 },
    descKey: 'actTask28',
    createdOffset: -1,
  },
  {
    action: 'created',
    entityType: 'idea',
    entityRef: { type: 'idea', idx: 4 },
    descKey: 'actIdea5',
    createdOffset: -5,
  },
  {
    action: 'completed',
    entityType: 'task',
    entityRef: { type: 'task', n: 29 },
    descKey: 'actTask29',
    createdOffset: -1,
  },
];

// ── Passwords ────────────────────────────────────────────────────────────────

export interface SeedPassword {
  labelKey: SeedLocaleKey | null; // null = use literal label
  label: string | null; // literal label (used when labelKey is null)
  domain: string | null;
  username: string | null;
  plainPassword: string;
  category: string;
  favorite: number;
  notesKey: SeedLocaleKey | null;
  createdOffset: number;
  updatedOffset: number;
}

export const SEED_PASSWORDS: SeedPassword[] = [
  {
    labelKey: 'pw1Label',
    label: null,
    domain: 'github.com',
    username: 'dz_dev',
    plainPassword: 'gh_pat_demo_1234',
    category: 'development',
    favorite: 1,
    notesKey: 'pw1Notes',
    createdOffset: -30,
    updatedOffset: -5,
  },
  {
    labelKey: 'pw2Label',
    label: null,
    domain: 'cubepath.com',
    username: 'admin',
    plainPassword: 'cubepath_demo!',
    category: 'server',
    favorite: 1,
    notesKey: 'pw2Notes',
    createdOffset: -10,
    updatedOffset: -2,
  },
  {
    labelKey: 'pw3Label',
    label: null,
    domain: 'dokploy.example.com',
    username: 'admin',
    plainPassword: 'dokploy_demo_pass',
    category: 'server',
    favorite: 1,
    notesKey: 'pw3Notes',
    createdOffset: -10,
    updatedOffset: -2,
  },
  {
    labelKey: null,
    label: 'Vercel',
    domain: 'vercel.com',
    username: 'dz@example.com',
    plainPassword: 'vercel_demo_xyz',
    category: 'development',
    favorite: 0,
    notesKey: null,
    createdOffset: -25,
    updatedOffset: -10,
  },
  {
    labelKey: null,
    label: 'Linear',
    domain: 'linear.app',
    username: 'dz@example.com',
    plainPassword: 'linear_pw_demo',
    category: 'productivity',
    favorite: 0,
    notesKey: 'pw5Notes',
    createdOffset: -20,
    updatedOffset: -8,
  },
  {
    labelKey: null,
    label: 'Namecheap',
    domain: 'namecheap.com',
    username: 'devuser',
    plainPassword: 'namecheap_demo_pw',
    category: 'server',
    favorite: 0,
    notesKey: 'pw6Notes',
    createdOffset: -30,
    updatedOffset: -15,
  },
  {
    labelKey: null,
    label: 'Figma',
    domain: 'figma.com',
    username: 'dz@example.com',
    plainPassword: 'figma_demo_pass',
    category: 'design',
    favorite: 0,
    notesKey: null,
    createdOffset: -15,
    updatedOffset: -15,
  },
];
