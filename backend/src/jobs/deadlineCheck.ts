import cron from 'node-cron';
import prisma from '../db/prisma';
import { sendMessage } from '../services/telegram';
import { getCurrentPeriod, getCurrentHour } from '../utils/challengePeriod';
import { fmtLeaderboard } from '../utils/formatters';
import { getStreak, applyStreakBonus } from '../services/points';

export function startDeadlineCron(): void {
  cron.schedule('* * * * *', async () => {
    try {
      await checkDeadlines();
    } catch (err) {
      console.error('[cron] deadline check failed:', err);
    }
  });
  console.log('[cron] deadline checker started');
}

async function checkDeadlines(): Promise<void> {
  const groups = await prisma.group.findMany({
    include: { members: { include: { user: true } } },
  });

  for (const group of groups) {
    if (!group.members.length) continue;
    if (getCurrentHour(group.timezone) !== group.deadlineHour) continue;

    const period = getCurrentPeriod(group.timezone);

    const alreadyClosed = await prisma.periodClose.findUnique({
      where: { groupId_challengePeriod: { groupId: group.id, challengePeriod: period } },
    });
    if (alreadyClosed) continue;

    await prisma.periodClose.create({ data: { groupId: group.id, challengePeriod: period } });

    const logged = await prisma.workout.findMany({
      where: { groupId: group.id, challengePeriod: period },
      distinct: ['userId'],
      select: { userId: true },
    });
    const loggedIds = new Set(logged.map((l) => l.userId));

    const madeIt: Array<{ name: string; streak: number }> = [];
    const missed: Array<{ name: string }> = [];

    for (const { userId, user } of group.members) {
      if (loggedIds.has(userId)) {
        const streak = await getStreak(userId, group.id, group.timezone);
        await applyStreakBonus(userId, group.id, streak);
        madeIt.push({ name: user.name, streak });
      } else {
        await prisma.penalty.upsert({
          where: { userId_groupId_challengePeriod: { userId, groupId: group.id, challengePeriod: period } },
          create: { userId, groupId: group.id, challengePeriod: period, points: group.penaltyPoints, reason: 'missed_deadline' },
          update: {},
        });
        await prisma.points.update({
          where: { userId_groupId: { userId, groupId: group.id } },
          data: { total: { decrement: group.penaltyPoints } },
        });
        missed.push({ name: user.name });
      }
    }

    const lines: string[] = ['⏰ Challenge period closed!\n'];
    if (madeIt.length) {
      lines.push('✅ Made it:');
      madeIt.forEach((m) => lines.push(`  • ${m.name} (🔥 ${m.streak}-day streak)`));
    }
    if (missed.length) {
      lines.push('\n❌ Missed it:');
      missed.forEach((m) => lines.push(`  • ${m.name} — -${group.penaltyPoints} pts`));
    }

    const allPoints = await prisma.points.findMany({ where: { groupId: group.id }, include: { user: true } });
    lines.push('\n📊 Leaderboard:');
    lines.push(fmtLeaderboard(allPoints.map((p) => ({ name: p.user.name, total: p.total }))));
    lines.push("\nTomorrow's challenge starts now. Let's go 💪");

    const message = lines.join('\n');
    for (const { user } of group.members) {
      try {
        await sendMessage(user.phone, message);
      } catch (err) {
        console.error(`[cron] failed to message ${user.phone}:`, err);
      }
    }
  }
}
