import { Request, Response } from 'express';
import { plansRepo } from '../repositories/plans.repository';
import { activityRepo } from '../repositories/activity.repository';
import { tasksRepo } from '../repositories/tasks.repository';
import { projectsRepo } from '../repositories/projects.repository';
import { calcPlanProgress } from '../lib/progress';
import { cascadeDeleteBody } from '../validations/common.validation';

export const plansController = {
  getAll(req: Request, res: Response) {
    const objectiveId = req.query.objective_id ? Number(req.query.objective_id) : undefined;
    const result = objectiveId ? plansRepo.findByObjectiveId(objectiveId) : plansRepo.findAll();
    res.json(result.map((p) => ({ ...p, progress: calcPlanProgress(p.id) })));
  },

  getById(req: Request, res: Response) {
    const p = plansRepo.findById(Number(req.params.id));
    if (!p) return res.status(404).json({ error: 'Plan not found' });
    res.json({ ...p, progress: calcPlanProgress(p.id) });
  },

  create(req: Request, res: Response) {
    const p = plansRepo.create(req.body);
    activityRepo.log('created', 'plan', p.id, `Created plan: ${p.title}`);
    res.status(201).json(p);
  },

  update(req: Request, res: Response) {
    const p = plansRepo.update(Number(req.params.id), req.body);
    if (!p) return res.status(404).json({ error: 'Plan not found' });
    res.json({ ...p, progress: calcPlanProgress(p.id) });
  },

  delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const p = plansRepo.findById(id);
    if (!p) return res.status(404).json({ error: 'Plan not found' });

    const children = tasksRepo.findByPlanId(id);
    if (children.length > 0) {
      const parsed = cascadeDeleteBody.safeParse(req.body);
      if (!parsed.success || !parsed.data.action) {
        return res
          .status(400)
          .json({ error: 'Plan has tasks. Provide action: "reassign" with newParentId or "cascade".' });
      }
      if (parsed.data.action === 'reassign') {
        if (!parsed.data.newParentId) return res.status(400).json({ error: 'newParentId required for reassign' });
        tasksRepo.reassignToPlan(
          children.map((c) => c.id),
          parsed.data.newParentId,
        );
      } else {
        for (const task of children) {
          projectsRepo.removeLinksByEntity('task', task.id);
          tasksRepo.delete(task.id);
        }
      }
    }

    projectsRepo.removeLinksByEntity('plan', id);
    activityRepo.log('deleted', 'plan', id, `Deleted plan: ${p.title}`);
    plansRepo.delete(id);
    res.status(204).send();
  },
};
