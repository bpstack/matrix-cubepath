import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const mission = sqliteTable('mission', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('in_progress'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const objectives = sqliteTable('objectives', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  missionId: integer('mission_id').references(() => mission.id),
  title: text('title').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  status: text('status').notNull().default('in_progress'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const plans = sqliteTable('plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  objectiveId: integer('objective_id').references(() => objectives.id),
  title: text('title').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  status: text('status').notNull().default('in_progress'),
  deadline: text('deadline'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  planId: integer('plan_id').references(() => plans.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'),
  priority: text('priority').notNull().default('medium'),
  sortOrder: integer('sort_order').default(0),
  deadline: text('deadline'),
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  path: text('path'),
  description: text('description'),
  url: text('url'),
  status: text('status').notNull().default('active'),
  tags: text('tags'),
  techStats: text('tech_stats'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const projectScans = sqliteTable('project_scans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id),
  totalTasks: integer('total_tasks').notNull().default(0),
  completedTasks: integer('completed_tasks').notNull().default(0),
  blockers: integer('blockers').notNull().default(0),
  wipItems: integer('wip_items').notNull().default(0),
  progressPercent: integer('progress_percent').notNull().default(0),
  rawData: text('raw_data'),
  scannedAt: text('scanned_at').notNull(),
});

export const projectLinks = sqliteTable('project_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id')
    .notNull()
    .references(() => projects.id),
  linkableType: text('linkable_type').notNull(),
  linkableId: integer('linkable_id').notNull(),
  createdAt: text('created_at').notNull(),
});

export const ideas = sqliteTable('ideas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'),
  targetType: text('target_type'),
  targetId: integer('target_id'),
  projectId: integer('project_id'),
  promotedToType: text('promoted_to_type'),
  promotedToId: integer('promoted_to_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const ideaEvaluations = sqliteTable('idea_evaluations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ideaId: integer('idea_id').notNull(),
  alignmentScore: integer('alignment_score').notNull(),
  impactScore: integer('impact_score').notNull(),
  costScore: integer('cost_score').notNull(),
  riskScore: integer('risk_score').notNull(),
  totalScore: real('total_score').notNull(),
  reasoning: text('reasoning'),
  decision: text('decision').notNull().default('pending'),
  decidedAt: text('decided_at'),
  createdAt: text('created_at').notNull(),
});

export const activityLog = sqliteTable('activity_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
  description: text('description').notNull(),
  createdAt: text('created_at').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const passwords = sqliteTable('passwords', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  domain: text('domain'),
  username: text('username'),
  encryptedPassword: text('encrypted_password').notNull(),
  category: text('category').notNull().default('other'),
  favorite: integer('favorite').notNull().default(0),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const docFolders = sqliteTable('doc_folders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  parentId: integer('parent_id'), // null = root; self-referential
  name: text('name').notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const docFiles = sqliteTable('doc_files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  folderId: integer('folder_id')
    .notNull()
    .references(() => docFolders.id),
  name: text('name').notNull(),
  content: text('content').notNull().default(''),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
