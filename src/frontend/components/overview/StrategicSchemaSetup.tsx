import React, { useState } from 'react';
import { ResizableTextarea } from '../ui/ResizableTextarea';
import { Dropdown } from '../ui/Dropdown';
import { useCreateMission } from '../../hooks/useMission';
import { useCreateObjective } from '../../hooks/useObjectives';
import { useCreatePlan } from '../../hooks/usePlans';
import { useCreateTask } from '../../hooks/useTasks';
import { useUiStore } from '../../stores/ui.store';
import { t } from '../../lib/i18n';

interface MissionResponse {
  id: number;
}
interface ObjectiveResponse {
  id: number;
}
interface PlanResponse {
  id: number;
}

type WizardStep = 'mission' | 'objectives' | 'plans' | 'tasks';
const WIZARD_STEPS: WizardStep[] = ['mission', 'objectives', 'plans', 'tasks'];

export function StrategicSchemaSetup() {
  const { language } = useUiStore();
  const [step, setStep] = useState<WizardStep>('mission');
  const [missionTitle, setMissionTitle] = useState('');
  const [missionDesc, setMissionDesc] = useState('');
  const [objectiveInputs, setObjectiveInputs] = useState([{ title: '', description: '' }]);
  const [planInputs, setPlanInputs] = useState<Record<number, { title: string; description: string }[]>>({
    0: [{ title: '', description: '' }],
  });
  const [taskInputs, setTaskInputs] = useState<Record<string, { title: string; priority: string }[]>>({});

  const createMission = useCreateMission();
  const createObjective = useCreateObjective();
  const createPlan = useCreatePlan();
  const createTask = useCreateTask();

  const [saving, setSaving] = useState(false);
  const stepIndex = WIZARD_STEPS.indexOf(step);

  const addObjective = () => {
    if (objectiveInputs.length >= 10) return;
    const newIdx = objectiveInputs.length;
    setObjectiveInputs([...objectiveInputs, { title: '', description: '' }]);
    setPlanInputs({ ...planInputs, [newIdx]: [{ title: '', description: '' }] });
  };

  const removeObjective = (idx: number) => {
    if (objectiveInputs.length <= 1) return;
    setObjectiveInputs(objectiveInputs.filter((_, i) => i !== idx));
    const newPlans = { ...planInputs };
    delete newPlans[idx];
    const reindexed: typeof planInputs = {};
    let j = 0;
    for (let i = 0; i < objectiveInputs.length; i++) {
      if (i === idx) continue;
      reindexed[j] = newPlans[i] || [{ title: '', description: '' }];
      j++;
    }
    setPlanInputs(reindexed);
  };

  const addPlan = (objIdx: number) => {
    const current = planInputs[objIdx] || [];
    if (current.length >= 10) return;
    setPlanInputs({ ...planInputs, [objIdx]: [...current, { title: '', description: '' }] });
  };

  const removePlan = (objIdx: number, planIdx: number) => {
    const current = planInputs[objIdx] || [];
    if (current.length <= 1) return;
    setPlanInputs({ ...planInputs, [objIdx]: current.filter((_, i) => i !== planIdx) });
  };

  const addTask = (key: string) => {
    const current = taskInputs[key] || [];
    if (current.length >= 10) return;
    setTaskInputs({ ...taskInputs, [key]: [...current, { title: '', priority: 'medium' }] });
  };

  const removeTask = (key: string, taskIdx: number) => {
    const current = taskInputs[key] || [];
    if (current.length <= 1) return;
    setTaskInputs({ ...taskInputs, [key]: current.filter((_, i) => i !== taskIdx) });
  };

  const goToStep = (s: WizardStep) => {
    if (s === 'tasks') {
      const newTaskInputs: typeof taskInputs = {};
      objectiveInputs.forEach((_, oi) => {
        (planInputs[oi] || []).forEach((_, pi) => {
          const key = `${oi}-${pi}`;
          if (!taskInputs[key]) {
            newTaskInputs[key] = [{ title: '', priority: 'medium' }];
          } else {
            newTaskInputs[key] = taskInputs[key];
          }
        });
      });
      setTaskInputs({ ...taskInputs, ...newTaskInputs });
    }
    setStep(s);
  };

  const canAdvance = () => {
    switch (step) {
      case 'mission':
        return missionTitle.trim().length > 0;
      case 'objectives':
        return objectiveInputs.some((o) => o.title.trim().length > 0);
      case 'plans':
        return Object.values(planInputs).some((arr) => arr.some((p) => p.title.trim().length > 0));
      case 'tasks':
        return true;
    }
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const missionRes = (await createMission.mutateAsync({
        title: missionTitle.trim(),
        description: missionDesc.trim() || undefined,
      })) as MissionResponse;
      const missionId = missionRes.id;
      for (let oi = 0; oi < objectiveInputs.length; oi++) {
        const obj = objectiveInputs[oi];
        if (!obj.title.trim()) continue;
        const objRes = (await createObjective.mutateAsync({
          missionId,
          title: obj.title.trim(),
          description: obj.description.trim() || undefined,
        })) as ObjectiveResponse;
        const objId = objRes.id;
        const objPlans = planInputs[oi] || [];
        for (let pi = 0; pi < objPlans.length; pi++) {
          const plan = objPlans[pi];
          if (!plan.title.trim()) continue;
          const planRes = (await createPlan.mutateAsync({
            objectiveId: objId,
            title: plan.title.trim(),
            description: plan.description.trim() || undefined,
          })) as PlanResponse;
          const planId = planRes.id;
          const key = `${oi}-${pi}`;
          const planTasks = taskInputs[key] || [];
          for (const task of planTasks) {
            if (!task.title.trim()) continue;
            await createTask.mutateAsync({ planId, title: task.title.trim(), priority: task.priority });
          }
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full bg-matrix-bg border border-matrix-border rounded px-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/60 transition-colors';

  return (
    <div>
      {/* Step tabs */}
      <div className="flex gap-px mb-4 border border-matrix-border rounded overflow-hidden">
        {WIZARD_STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => (i <= stepIndex ? goToStep(s) : undefined)}
            className={`flex-1 py-1.5 px-2 text-xs transition-colors capitalize ${
              s === step
                ? 'bg-matrix-accent/10 text-matrix-accent'
                : i < stepIndex
                  ? 'bg-matrix-bg text-gray-400 hover:text-gray-300 cursor-pointer'
                  : 'bg-matrix-bg text-gray-600 cursor-default'
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {/* Mission */}
      {step === 'mission' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-matrix-muted mb-1">Title</label>
            <input
              value={missionTitle}
              onChange={(e) => setMissionTitle(e.target.value)}
              placeholder={t('yourStrategicMission', language)}
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-matrix-muted mb-1">
              Description <span className="text-gray-600">(optional)</span>
            </label>
            <ResizableTextarea
              value={missionDesc}
              onChange={(e) => setMissionDesc(e.target.value)}
              placeholder={t('missionAimToAchieve', language)}
            />
          </div>
        </div>
      )}

      {/* Objectives */}
      {step === 'objectives' && (
        <div className="space-y-2">
          {objectiveInputs.map((obj, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-xs text-matrix-muted w-4 text-right shrink-0 pt-2">{i + 1}.</span>
              <div className="flex-1 space-y-1">
                <input
                  value={obj.title}
                  onChange={(e) => {
                    const next = [...objectiveInputs];
                    next[i] = { ...next[i], title: e.target.value };
                    setObjectiveInputs(next);
                  }}
                  placeholder={`Objective ${i + 1}...`}
                  className="w-full bg-transparent border border-matrix-border/50 rounded px-2 py-1.5 text-base text-gray-200 placeholder-gray-600 focus:outline-none focus:border-matrix-accent/40"
                />
                <ResizableTextarea
                  value={obj.description}
                  onChange={(e) => {
                    const next = [...objectiveInputs];
                    next[i] = { ...next[i], description: e.target.value };
                    setObjectiveInputs(next);
                  }}
                  placeholder={t('descriptionOptional', language)}
                />
              </div>
              {objectiveInputs.length > 1 && (
                <button
                  onClick={() => removeObjective(i)}
                  className="text-xs text-matrix-muted hover:text-matrix-danger transition-colors mt-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {objectiveInputs.length < 10 && (
            <button
              onClick={addObjective}
              className="text-xs text-matrix-muted hover:text-matrix-accent transition-colors ml-6"
            >
              + Add objective
            </button>
          )}
        </div>
      )}

      {/* Plans */}
      {step === 'plans' && (
        <div className="space-y-4">
          {objectiveInputs.map((obj, oi) => {
            if (!obj.title.trim()) return null;
            const plans = planInputs[oi] || [{ title: '', description: '' }];
            return (
              <div key={oi}>
                <p className="text-xs text-matrix-muted mb-1.5">
                  <span className="text-matrix-accent/50">{oi + 1}.</span> {obj.title}
                </p>
                <div className="ml-5 space-y-1.5">
                  {plans.map((plan, pi) => (
                    <div key={pi} className="flex gap-2 items-center">
                      <span className="text-xs text-matrix-muted w-3 text-right shrink-0">{pi + 1}.</span>
                      <input
                        value={plan.title}
                        onChange={(e) => {
                          const next = [...plans];
                          next[pi] = { ...next[pi], title: e.target.value };
                          setPlanInputs({ ...planInputs, [oi]: next });
                        }}
                        placeholder={`Plan ${pi + 1}...`}
                        className={`flex-1 ${inputCls}`}
                      />
                      {plans.length > 1 && (
                        <button
                          onClick={() => removePlan(oi, pi)}
                          className="text-xs text-matrix-muted hover:text-matrix-danger transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {plans.length < 10 && (
                    <button
                      onClick={() => addPlan(oi)}
                      className="text-xs text-matrix-muted hover:text-matrix-accent transition-colors ml-5"
                    >
                      + Add plan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tasks */}
      {step === 'tasks' && (
        <div className="space-y-4">
          {objectiveInputs.map((obj, oi) => {
            if (!obj.title.trim()) return null;
            const plans = planInputs[oi] || [];
            return plans.map((plan, pi) => {
              if (!plan.title.trim()) return null;
              const key = `${oi}-${pi}`;
              const tasks = taskInputs[key] || [{ title: '', priority: 'medium' }];
              return (
                <div key={key}>
                  <p className="text-xs text-matrix-muted mb-1.5">
                    <span className="text-matrix-accent/50">{obj.title}</span>
                    <span className="mx-1 text-gray-600">/</span>
                    {plan.title}
                  </p>
                  <div className="ml-5 space-y-1.5">
                    {tasks.map((task, ti) => (
                      <div key={ti} className="flex gap-2 items-center">
                        <span className="text-xs text-matrix-muted w-3 text-right shrink-0">{ti + 1}.</span>
                        <input
                          value={task.title}
                          onChange={(e) => {
                            const next = [...tasks];
                            next[ti] = { ...next[ti], title: e.target.value };
                            setTaskInputs({ ...taskInputs, [key]: next });
                          }}
                          placeholder={`Task ${ti + 1}...`}
                          className={`flex-1 ${inputCls}`}
                        />
                        <Dropdown
                          value={task.priority}
                          onChange={(val) => {
                            const next = [...tasks];
                            next[ti] = { ...next[ti], priority: val };
                            setTaskInputs({ ...taskInputs, [key]: next });
                          }}
                          options={[
                            { value: 'low', label: t('low', language) },
                            { value: 'medium', label: t('medium', language) },
                            { value: 'high', label: t('high', language) },
                            { value: 'urgent', label: t('urgent', language) },
                          ]}
                          className="w-24"
                        />
                        {tasks.length > 1 && (
                          <button
                            onClick={() => removeTask(key, ti)}
                            className="text-xs text-matrix-muted hover:text-matrix-danger transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    {tasks.length < 10 && (
                      <button
                        onClick={() => addTask(key)}
                        className="text-xs text-matrix-muted hover:text-matrix-accent transition-colors ml-5"
                      >
                        + Add task
                      </button>
                    )}
                  </div>
                </div>
              );
            });
          })}
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between mt-6 pt-3 border-t border-matrix-border">
        <button
          onClick={() => stepIndex > 0 && goToStep(WIZARD_STEPS[stepIndex - 1])}
          className={`text-xs px-3 py-1.5 rounded transition-colors ${stepIndex > 0 ? 'text-gray-400 hover:text-gray-300' : 'text-gray-700 cursor-default'}`}
        >
          Back
        </button>
        <div className="flex gap-1">
          {WIZARD_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full ${i <= stepIndex ? 'bg-matrix-accent' : 'bg-matrix-border'}`}
            />
          ))}
        </div>
        {step === 'tasks' ? (
          <button
            onClick={saveAll}
            disabled={saving || !canAdvance()}
            className="text-xs px-4 py-1.5 bg-matrix-accent/90 text-matrix-bg font-medium rounded hover:bg-matrix-accent transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Create Schema'}
          </button>
        ) : (
          <button
            onClick={() => canAdvance() && goToStep(WIZARD_STEPS[stepIndex + 1])}
            disabled={!canAdvance()}
            className="text-xs px-4 py-1.5 bg-matrix-accent/10 text-matrix-accent rounded hover:bg-matrix-accent/20 transition-colors disabled:opacity-50"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
