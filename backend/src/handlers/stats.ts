import prisma from '../db/prisma';
import { sendMessage } from '../services/telegram';
import { getStreak } from '../services/points';
import { cap } from '../utils/formatters';

export async function handleStats(from: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { phone: from } });
  if (!user) { await sendMessage(from, 'Register first.'); return; }

  const membership = await prisma.groupMember.findFirst({
    where: { userId: user.id },
    orderBy: { joinedAt: 'desc' },
    include: { group: true },
  });
  const timezone = membership?.group.timezone ?? process.env.DEFAULT_TIMEZONE ?? 'UTC';
  const groupId = membership?.groupId ?? null;

  const [streak, totalSessions, pts] = await Promise.all([
    getStreak(user.id, groupId, timezone),
    prisma.workout.count({ where: { userId: user.id } }),
    groupId
      ? prisma.points.findUnique({ where: { userId_groupId: { userId: user.id, groupId } } })
      : null,
  ]);

  const weekAgo = new Date();
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
  const recentPeriods = await prisma.workout.findMany({
    where: { userId: user.id, loggedAt: { gte: weekAgo } },
    distinct: ['challengePeriod'],
    select: { challengePeriod: true },
  });

  const favResult = await prisma.workout.groupBy({
    by: ['activityType'],
    where: { userId: user.id },
    _count: { activityType: true },
    orderBy: { _count: { activityType: 'desc' } },
    take: 1,
  });
  const fav = favResult[0];

  let msg = `📊 Your stats, ${user.name}:\n\n`;
  msg += `🔥 Current streak: ${streak} day${streak !== 1 ? 's' : ''}\n`;
  msg += `📅 Last 7 days: ${recentPeriods.length} workout${recentPeriods.length !== 1 ? 's' : ''}\n`;
  msg += `🏆 Total sessions: ${totalSessions}\n`;
  if (pts) msg += `💰 Points: ${pts.total}\n`;
  if (fav) msg += `\nFavourite: ${cap(fav.activityType)} (${fav._count.activityType} sessions)`;

  await sendMessage(from, msg);
}

export async function handleStreak(from: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { phone: from } });
  if (!user) { await sendMessage(from, 'Register first.'); return; }

  const membership = await prisma.groupMember.findFirst({
    where: { userId: user.id },
    orderBy: { joinedAt: 'desc' },
    include: { group: true },
  });
  const timezone = membership?.group.timezone ?? process.env.DEFAULT_TIMEZONE ?? 'UTC';
  const streak = await getStreak(user.id, membership?.groupId ?? null, timezone);

  await sendMessage(from, `🔥 Current streak: ${streak} day${streak !== 1 ? 's' : ''}`);
}

export async function handleHistory(from: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { phone: from } });
  if (!user) { await sendMessage(from, 'Register first.'); return; }

  const workouts = await prisma.workout.findMany({
    where: { userId: user.id },
    orderBy: { loggedAt: 'desc' },
    take: 7,
  });

  if (!workouts.length) {
    await sendMessage(from, 'No workouts logged yet. Send /log gym to start!');
    return;
  }

  const lines = workouts.map((w) => {
    const date = new Date(w.loggedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return `• ${date}: ${cap(w.activityType)}${w.note ? ` (${w.note})` : ''}`;
  });

  await sendMessage(from, `📋 Last ${workouts.length} workouts:\n\n${lines.join('\n')}`);
}
