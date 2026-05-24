import prisma from '../db/prisma';
import { getCurrentPeriod } from '../utils/challengePeriod';

export async function getStreak(userId: number, groupId: number | null, timezone: string): Promise<number> {
  const periods = await prisma.workout.findMany({
    where: { userId, ...(groupId !== null ? { groupId } : {}) },
    orderBy: { challengePeriod: 'desc' },
    distinct: ['challengePeriod'],
    select: { challengePeriod: true },
  });

  if (!periods.length) return 0;

  let streak = 0;
  let cursor = getCurrentPeriod(timezone);

  for (const { challengePeriod } of periods) {
    if (new Date(challengePeriod).getTime() === cursor.getTime()) {
      streak++;
      cursor = new Date(cursor);
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function applyStreakBonus(userId: number, groupId: number, streak: number): Promise<void> {
  const bonus = streak === 7 ? 20 : streak === 30 ? 50 : 0;
  if (!bonus) return;
  await prisma.points.update({
    where: { userId_groupId: { userId, groupId } },
    data: { total: { increment: bonus } },
  });
}
