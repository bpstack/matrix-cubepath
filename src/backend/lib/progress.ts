import { plansRepo } from '../repositories/plans.repository';
import { tasksRepo } from '../repositories/tasks.repository';
import { objectivesRepo } from '../repositories/objectives.repository';

function taskProgress(status: string): number {
  switch (status) {
    case 'done':
      return 100;
    case 'in_progress':
      return 50;
    default:
      return 0;
  }
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function calcPlanProgress(planId: number): number {
  const planTasks = tasksRepo.findByPlanId(planId);
  return avg(planTasks.map((t) => taskProgress(t.status)));
}

export function calcObjectiveProgress(objectiveId: number): number {
  const objPlans = plansRepo.findByObjectiveId(objectiveId);
  return avg(objPlans.map((p) => calcPlanProgress(p.id)));
}

export function calcMissionProgress(missionId: number): number {
  const objs = objectivesRepo.findByMissionId(missionId);
  return avg(objs.map((o) => calcObjectiveProgress(o.id)));
}
