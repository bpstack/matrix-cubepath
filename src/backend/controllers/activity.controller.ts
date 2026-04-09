import { Request, Response } from 'express';
import { activityRepo } from '../repositories/activity.repository';
import { getDb } from '../db/connection';
import { activityLog, tasks } from '../db/schema';
import { eq, count, sql, and, gte, isNotNull } from 'drizzle-orm';
import { logger } from '../lib/logger';

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const activityController = {
  getRecent(req: Request, res: Response) {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    res.json(activityRepo.findRecent(limit));
  },

  getMetrics(_req: Request, res: Response) {
    try {
      const db = getDb();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Week start (Monday)
      const dow = (today.getDay() + 6) % 7;
      const weekStart = new Date(today.getTime() - dow * 86400000);
      const weekStartStr = toDateStr(weekStart);
      const thirtyDaysAgo = toDateStr(new Date(today.getTime() - 30 * 86400000));

      // ── STREAK ──
      const activityDates = db
        .select({ d: sql<string>`date(${activityLog.createdAt})` })
        .from(activityLog)
        .groupBy(sql`date(${activityLog.createdAt})`)
        .orderBy(sql`date(${activityLog.createdAt}) DESC`)
        .all();

      let currentStreak = 0;
      let longestStreak = 0;

      if (activityDates.length > 0) {
        const lastDate = new Date(activityDates[0].d + 'T00:00:00');
        const daysSinceLast = Math.round((today.getTime() - lastDate.getTime()) / 86400000);

        if (daysSinceLast <= 1) {
          currentStreak = 1;
          for (let i = 1; i < activityDates.length; i++) {
            const prev = new Date(activityDates[i - 1].d + 'T00:00:00');
            const curr = new Date(activityDates[i].d + 'T00:00:00');
            if (Math.round((prev.getTime() - curr.getTime()) / 86400000) === 1) {
              currentStreak++;
            } else break;
          }
        }

        let temp = 1;
        longestStreak = 1;
        for (let i = 1; i < activityDates.length; i++) {
          const prev = new Date(activityDates[i - 1].d + 'T00:00:00');
          const curr = new Date(activityDates[i].d + 'T00:00:00');
          if (Math.round((prev.getTime() - curr.getTime()) / 86400000) === 1) {
            temp++;
            longestStreak = Math.max(longestStreak, temp);
          } else {
            temp = 1;
          }
        }
        longestStreak = Math.max(longestStreak, currentStreak);
      }

      // ── WEEK DATA (Mon–Sun, completed tasks per day) ──
      const completedRows = db
        .select({
          d: sql<string>`date(${activityLog.createdAt})`,
          cnt: count(),
        })
        .from(activityLog)
        .where(
          and(
            eq(activityLog.action, 'completed'),
            eq(activityLog.entityType, 'task'),
            gte(activityLog.createdAt, weekStartStr),
          ),
        )
        .groupBy(sql`date(${activityLog.createdAt})`)
        .all();

      const weekData = Array(7).fill(0);
      for (const r of completedRows) {
        const d = new Date(r.d + 'T00:00:00');
        const idx = Math.round((d.getTime() - weekStart.getTime()) / 86400000);
        if (idx >= 0 && idx < 7) weekData[idx] = r.cnt;
      }

      const tasksThisWeek = weekData.reduce((a, b) => a + b, 0);
      const activeDays = weekData.filter((v) => v > 0).length;
      const avgPerDay = Math.round((tasksThisWeek / Math.max(activeDays, 1)) * 10) / 10;

      // ── BURNDOWN ──
      const totalPending = db
        .select({ cnt: count() })
        .from(tasks)
        .where(sql`${tasks.status} != 'done'`)
        .get()!.cnt;

      const todayIdx = Math.min(dow, 6);
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      const burndown = dayNames.map((day, i) => {
        if (i > todayIdx) return { day, remaining: null, completed: null };
        const completedAfter = weekData.slice(i + 1, todayIdx + 1).reduce((a: number, b: number) => a + b, 0);
        return { day, remaining: totalPending + completedAfter, completed: weekData[i] };
      });

      // ── WEEKLY TRENDS (created vs completed per day) ──
      const createdRows = db
        .select({
          d: sql<string>`date(${activityLog.createdAt})`,
          cnt: count(),
        })
        .from(activityLog)
        .where(
          and(
            eq(activityLog.action, 'created'),
            eq(activityLog.entityType, 'task'),
            gte(activityLog.createdAt, weekStartStr),
          ),
        )
        .groupBy(sql`date(${activityLog.createdAt})`)
        .all();

      const createdByDay: number[] = Array(7).fill(0);
      for (const r of createdRows) {
        const d = new Date(r.d + 'T00:00:00');
        const idx = Math.round((d.getTime() - weekStart.getTime()) / 86400000);
        if (idx >= 0 && idx < 7) createdByDay[idx] = r.cnt;
      }

      const weeklyTrends = dayNames.map((day, i) => ({
        day,
        completed: i <= todayIdx ? weekData[i] : null,
        created: i <= todayIdx ? createdByDay[i] : null,
      }));

      // ── KEY METRICS ──
      const wip = db.select({ cnt: count() }).from(tasks).where(eq(tasks.status, 'in_progress')).get()!.cnt;

      const completedLast30 = db
        .select({ cnt: count() })
        .from(activityLog)
        .where(
          and(
            eq(activityLog.action, 'completed'),
            eq(activityLog.entityType, 'task'),
            gte(activityLog.createdAt, thirtyDaysAgo),
          ),
        )
        .get()!.cnt;

      const throughput = Math.round((completedLast30 / 30) * 10) / 10;

      const cycleTimeRow = db
        .select({
          avgDays: sql<number | null>`AVG(julianday(${tasks.completedAt}) - julianday(${tasks.createdAt}))`,
        })
        .from(tasks)
        .where(isNotNull(tasks.completedAt))
        .get();

      const cycleTimeDays = cycleTimeRow?.avgDays != null ? Math.round(cycleTimeRow.avgDays * 10) / 10 : null;

      res.json({
        streak: { current: currentStreak, longest: longestStreak, weekData, tasksThisWeek, avgPerDay },
        burndown,
        weeklyTrends,
        keyMetrics: { velocity: tasksThisWeek, wip, throughput, cycleTimeDays },
      });
    } catch (err) {
      logger.error('activity', 'Failed to compute metrics', err);
      res.status(500).json({ error: 'Failed to compute metrics' });
    }
  },
};
