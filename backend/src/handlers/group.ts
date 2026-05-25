import prisma from '../db/prisma';
import { sendMessage } from '../services/telegram';
import { fmtLeaderboard } from '../utils/formatters';

function randomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function uniqueCode(): Promise<string> {
  let code = randomCode();
  while (await prisma.group.findUnique({ where: { inviteCode: code } })) code = randomCode();
  return code;
}

async function activeGroup(userId: number) {
  return prisma.groupMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: 'desc' },
    include: { group: true },
  });
}

export async function handleCreate(from: string, args: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { phone: from } });
  if (!user) { await sendMessage(from, 'Register first: send any message to get started.'); return; }

  const name = args.trim();
  if (!name) { await sendMessage(from, 'Usage: /create [group name]'); return; }

  const inviteCode = await uniqueCode();
  const timezone = process.env.DEFAULT_TIMEZONE ?? 'UTC';

  const group = await prisma.group.create({ data: { name, inviteCode, createdById: user.id, timezone } });
  await prisma.groupMember.create({ data: { groupId: group.id, userId: user.id } });
  await prisma.points.create({ data: { userId: user.id, groupId: group.id, total: 100 } });

  await sendMessage(from, `✅ Group "${name}" created!\n\nInvite code: *${inviteCode}*\nShare with friends: /join ${inviteCode}\n\nDeadline: ${group.deadlineHour}:00 daily | Penalty: ${group.penaltyPoints} pts`);
}

export async function handleJoin(from: string, args: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { phone: from } });
  if (!user) { await sendMessage(from, 'Register first: send any message to get started.'); return; }

  const code = args.trim().toUpperCase();
  if (!code) { await sendMessage(from, 'Usage: /join [invite code]'); return; }

  const group = await prisma.group.findUnique({ where: { inviteCode: code } });
  if (!group) { await sendMessage(from, `No group found with code "${code}". Double-check and try again.`); return; }

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: group.id, userId: user.id } },
  });
  if (existing) { await sendMessage(from, `You're already in "${group.name}"!`); return; }

  await prisma.groupMember.create({ data: { groupId: group.id, userId: user.id } });
  await prisma.points.upsert({
    where: { userId_groupId: { userId: user.id, groupId: group.id } },
    create: { userId: user.id, groupId: group.id, total: 100 },
    update: {},
  });

  const count = await prisma.groupMember.count({ where: { groupId: group.id } });
  await sendMessage(from, `🎉 You joined "${group.name}"!\n${count} member${count !== 1 ? 's' : ''} in the group.\n\nDeadline: ${group.deadlineHour}:00 daily | Penalty: ${group.penaltyPoints} pts`);
}

export async function handleMyGroup(from: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { phone: from } });
  if (!user) { await sendMessage(from, 'Register first.'); return; }

  const membership = await activeGroup(user.id);
  if (!membership) {
    await sendMessage(from, "You're not in any group yet.\n\nUse the Group menu to create or join one.");
    return;
  }

  const g = membership.group;

  const [members, pts] = await Promise.all([
    prisma.groupMember.findMany({ where: { groupId: g.id }, include: { user: true }, orderBy: { joinedAt: 'asc' } }),
    prisma.points.findMany({ where: { groupId: g.id }, include: { user: true } }),
  ]);

  const pointsMap = new Map(pts.map((p) => [p.userId, p.total]));
  const memberLines = members
    .map((m) => {
      const score = pointsMap.get(m.userId) ?? 100;
      const tag = m.userId === g.createdById ? ' 👑' : '';
      return `• ${m.user.name}${tag} — ${score} pts`;
    })
    .join('\n');

  const msg =
    `👥 *${g.name}*\n\n` +
    `${memberLines}\n\n` +
    `🔑 Invite code: \`${g.inviteCode}\`\n` +
    `🕐 Deadline: ${g.deadlineHour}:00 (${g.timezone})\n` +
    `💀 Penalty: ${g.penaltyPoints} pts per miss`;

  await sendMessage(from, msg);
}

export async function handleLeaderboard(from: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { phone: from } });
  if (!user) { await sendMessage(from, 'Register first.'); return; }

  const membership = await activeGroup(user.id);
  if (!membership) { await sendMessage(from, "You're not in any group yet. Use /join [code] to join one."); return; }

  const pts = await prisma.points.findMany({
    where: { groupId: membership.groupId },
    include: { user: true },
  });

  await sendMessage(from, `📊 Leaderboard — ${membership.group.name}\n\n${fmtLeaderboard(pts.map((p) => ({ name: p.user.name, total: p.total })))}`);
}

export async function handleRules(from: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { phone: from } });
  if (!user) { await sendMessage(from, 'Register first.'); return; }

  const membership = await activeGroup(user.id);
  if (!membership) { await sendMessage(from, "You're not in any group."); return; }

  const g = membership.group;
  await sendMessage(from, `📋 Rules — ${g.name}\n\nFrequency: ${g.challengeFrequency}\nDeadline: ${g.deadlineHour}:00 (${g.timezone})\nPenalty: ${g.penaltyPoints} pts per miss\nStarting points: 100`);
}

export async function handleSettings(from: string, args: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { phone: from } });
  if (!user) { await sendMessage(from, 'Register first.'); return; }

  const membership = await activeGroup(user.id);
  if (!membership) { await sendMessage(from, "You're not in any group."); return; }

  const group = membership.group;
  if (group.createdById !== user.id) {
    await sendMessage(from, '🚫 Only the group creator can change settings.');
    return;
  }

  const [sub, val] = args.trim().split(/\s+/);

  if (sub === 'deadline') {
    const hour = parseInt(val ?? '', 10);
    if (isNaN(hour) || hour < 0 || hour > 23) { await sendMessage(from, 'Usage: /settings deadline [0-23]'); return; }
    await prisma.group.update({ where: { id: group.id }, data: { deadlineHour: hour } });
    await sendMessage(from, `✅ Deadline updated to ${hour}:00 (${group.timezone})`);
  } else if (sub === 'penalty') {
    const pts = parseInt(val ?? '', 10);
    if (isNaN(pts) || pts < 0) { await sendMessage(from, 'Usage: /settings penalty [points]'); return; }
    await prisma.group.update({ where: { id: group.id }, data: { penaltyPoints: pts } });
    await sendMessage(from, `✅ Penalty updated to ${pts} pts per miss`);
  } else {
    await sendMessage(from, 'Usage:\n/settings deadline [0-23]\n/settings penalty [points]');
  }
}
