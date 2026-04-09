import { Request, Response } from 'express';
import { objectivesRepo } from '../repositories/objectives.repository';
import { activityRepo } from '../repositories/activity.repository';
import { plansRepo } from '../repositories/plans.repository';
import { tasksRepo } from '../repositories/tasks.repository';
import { projectsRepo } from '../repositories/projects.repository';
import { calcObjectiveProgress } from '../lib/progress';
import { cascadeDeleteBody } from '../validations/common.validation';

export const objectivesController = {
  getAll(req: Request, res: Response) {
    const missionId = req.query.mission_id ? Number(req.query.mission_id) : undefined;
    const objs = missionId ? objectivesRepo.findByMissionId(missionId) : objectivesRepo.findAll();
    const result = objs.map((o) => ({ ...o, progress: calcObjectiveProgress(o.id) }));
    res.json(result);
  },

  getById(req: Request, res: Response) {
    const o = objectivesRepo.findById(Number(req.params.id));
    if (!o) return res.status(404).json({ error: 'Objective not found' });
    res.json({ ...o, progress: calcObjectiveProgress(o.id) });
  },

  create(req: Request, res: Response) {
    const o = objectivesRepo.create(req.body);
    activityRepo.log('created', 'objective', o.id, `Created objective: ${o.title}`);
    res.status(201).json(o);
  },

  update(req: Request, res: Response) {
    const o = objectivesRepo.update(Number(req.params.id), req.body);
    if (!o) return res.status(404).json({ error: 'Objective not found' });
    res.json({ ...o, progress: calcObjectiveProgress(o.id) });
  },

  delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const o = objectivesRepo.findById(id);
    if (!o) return res.status(404).json({ error: 'Objective not found' });

    const children = plansRepo.findByObjectiveId(id);
    if (children.length > 0) {
      const parsed = cascadeDeleteBody.safeParse(req.body);
      if (!parsed.success || !parsed.data.action) {
        return res
          .status(400)
          .json({ error: 'Objective has plans. Provide action: "reassign" with newParentId or "cascade".' });
      }
      if (parsed.data.action === 'reassign') {
        if (!parsed.data.newParentId) return res.status(400).json({ error: 'newParentId required for reassign' });
        plansRepo.reassignToObjective(
          children.map((c) => c.id),
          parsed.data.newParentId,
        );
      } else {
        for (const plan of children) {
          const planTasks = tasksRepo.findByPlanId(plan.id);
          for (const task of planTasks) {
            projectsRepo.removeLinksByEntity('task', task.id);
            tasksRepo.delete(task.id);
          }
          projectsRepo.removeLinksByEntity('plan', plan.id);
          plansRepo.delete(plan.id);
        }
      }
    }

    projectsRepo.removeLinksByEntity('objective', id);
    activityRepo.log('deleted', 'objective', id, `Deleted objective: ${o.title}`);
    objectivesRepo.delete(id);
    res.status(204).send();
  },
};
