import prisma from '../db/prisma';
import { sendMessage } from '../services/telegram';
import { uploadFromUrl } from '../services/media';
import { parseActivity, ACTIVITY_PICKER } from '../utils/activityParser';
import { getCurrentPeriod } from '../utils/challengePeriod';
import { getStreak } from '../services/points';
import { cap } from '../utils/formatters';

// phone → pending photo URL while waiting for activity reply
export const pendingPhoto = new Map<string, string>();

export async function handleLog(from: string, body: string, mediaUrl?: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { phone: from } });
  if (!user) {
    await sendMessage(from, 'Please register first by sending any message.');
    return;
  }

  const membership = await prisma.groupMember.findFirst({
    where: { userId: user.id },
    orderBy: { joinedAt: 'desc' },
    include: { group: true },
  });
  const group = membership?.group ?? null;
  const timezone = group?.timezone ?? process.env.DEFAULT_TIMEZONE ?? 'UTC';
  const period = getCurrentPeriod(timezone);

  let photoUrl: string | null = null;
  // Strip /log prefix if present (photo captions may include it)
  let activityRaw = body.replace(/^\/log\s*/i, '').trim();

  if (mediaUrl) {
    try {
      photoUrl = await uploadFromUrl(mediaUrl);
    } catch {
      // continue without photo on upload failure
    }
    if (!activityRaw) {
      pendingPhoto.set(from, photoUrl ?? '');
      await sendMessage(from, ACTIVITY_PICKER);
      return;
    }
  } else if (pendingPhoto.has(from)) {
    photoUrl = pendingPhoto.get(from) ?? null;
    pendingPhoto.delete(from);
    activityRaw = body.trim();
  }

  if (!activityRaw) {
    await sendMessage(from, `What activity? e.g. /log gym\n\n${ACTIVITY_PICKER}`);
    return;
  }

  const { activityType, note } = parseActivity(activityRaw);

  await prisma.workout.create({
    data: { userId: user.id, groupId: group?.id ?? null, activityType, photoUrl, note, challengePeriod: period },
  });

  const streak = await getStreak(user.id, group?.id ?? null, timezone);
  let reply = `✅ ${user.name} logged: ${cap(activityType)}\n🔥 Streak: ${streak} day${streak !== 1 ? 's' : ''}`;

  if (group) {
    const allMembers = await prisma.groupMember.findMany({
      where: { groupId: group.id },
      include: { user: true },
    });
    const loggedThisPeriod = await prisma.workout.findMany({
      where: { groupId: group.id, challengePeriod: period },
      distinct: ['userId'],
      select: { userId: true },
    });
    const loggedIds = new Set(loggedThisPeriod.map((w) => w.userId));
    const waiting = allMembers.filter((m) => !loggedIds.has(m.userId)).map((m) => m.user.name);
    reply += waiting.length
      ? `\n\nStill waiting for: ${waiting.join(', ')}`
      : '\n\n🎉 Everyone logged today!';
  }

  await sendMessage(from, reply);
}
