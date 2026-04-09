import { Request, Response } from 'express';
import { tasksRepo } from '../repositories/tasks.repository';
import { activityRepo } from '../repositories/activity.repository';
import { projectsRepo } from '../repositories/projects.repository';

export const tasksController = {
  getAll(req: Request, res: Response) {
    const filters: { planId?: number; status?: string } = {};
    if (req.query.plan_id) filters.planId = Number(req.query.plan_id);
    if (req.query.status) filters.status = String(req.query.status);
    res.json(tasksRepo.findFiltered(filters));
  },

  getDeadlines(_req: Request, res: Response) {
    const allTasks = tasksRepo.findAll();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const soon = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const isValidDate = (d: string | null | undefined): d is string => {
      if (!d) return false;
      return !Number.isNaN(new Date(d).getTime());
    };

    const pending = allTasks.filter((t) => t.status !== 'done' && isValidDate(t.deadline));

    const overdue = pending.filter((t) => new Date(t.deadline!) < today);

    const dueToday = pending.filter((t) => {
      const taskDay = new Date(new Date(t.deadline!).toDateString());
      return taskDay.getTime() === today.getTime();
    });

    const dueSoon = pending.filter((t) => {
      const taskDay = new Date(new Date(t.deadline!).toDateString());
      return taskDay > today && taskDay <= soon;
    });

    res.json({
      overdue,
      dueToday,
      dueSoon,
      total: overdue.length + dueToday.length + dueSoon.length,
    });
  },

  getById(req: Request, res: Response) {
    const t = tasksRepo.findById(Number(req.params.id));
    if (!t) return res.status(404).json({ error: 'Task not found' });
    res.json(t);
  },

  create(req: Request, res: Response) {
    const t = tasksRepo.create(req.body);
    activityRepo.log('created', 'task', t.id, `Created task: ${t.title}`);
    res.status(201).json(t);
  },

  update(req: Request, res: Response) {
    const data: Record<string, unknown> = { ...req.body };
    const { status } = req.body;

    // Treat empty string deadline as null (clear it)
    if (data.deadline === '') data.deadline = null;

    if (status === 'done') {
      data.completedAt = new Date().toISOString();
    } else if (status) {
      data.completedAt = null;
    }

    const t = tasksRepo.update(Number(req.params.id), data as Parameters<typeof tasksRepo.update>[1]);
    if (!t) return res.status(404).json({ error: 'Task not found' });
    if (status === 'done') activityRepo.log('completed', 'task', t.id, `Completed task: ${t.title}`);
    res.json(t);
  },

  delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const t = tasksRepo.findById(id);
    if (!t) return res.status(404).json({ error: 'Task not found' });
    projectsRepo.removeLinksByEntity('task', id);
    activityRepo.log('deleted', 'task', id, `Deleted task: ${t.title}`);
    tasksRepo.delete(id);
    res.status(204).send();
  },
};
