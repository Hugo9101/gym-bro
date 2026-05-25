import prisma from '../db/prisma';
import { sendMessage, mainMenuKeyboard } from '../services/telegram';

export const onboardingState = new Map<string, 'awaiting_name'>();

export async function handleRename(from: string, args: string): Promise<void> {
  const name = args.trim();
  if (!name) { await sendMessage(from, 'Usage: /rename [your new name]'); return; }
  await prisma.user.update({ where: { phone: from }, data: { name } });
  await sendMessage(from, `✅ Name updated to ${name}`);
}

export async function handleRegistration(from: string, body: string): Promise<void> {
  if (onboardingState.get(from) === 'awaiting_name') {
    const name = body.trim();
    if (!name) {
      await sendMessage(from, "I didn't catch that. What's your name?");
      return;
    }
    await prisma.user.create({ data: { phone: from, name } });
    onboardingState.delete(from);
    await sendMessage(
      from,
      `Got it, ${name}! You're all set 💪\n\nTap a button below to get started.`,
      mainMenuKeyboard(),
    );
    return;
  }

  onboardingState.set(from, 'awaiting_name');
  await sendMessage(from, 'Hey! Welcome to Gym Bro 💪 What\'s your name?');
}
