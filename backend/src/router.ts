import prisma from './db/prisma';
import { handleRegistration, handleRename, onboardingState } from './handlers/register';
import { handleLog, pendingPhoto } from './handlers/logWorkout';
import { handleCreate, handleJoin, handleLeaderboard, handleRules, handleSettings } from './handlers/group';
import { handleStats, handleStreak, handleHistory } from './handlers/stats';
import { handleHelp } from './handlers/help';
import { sendMessage } from './services/telegram';

export async function route(from: string, body: string, mediaUrl?: string): Promise<void> {
  if (onboardingState.has(from)) {
    await handleRegistration(from, body);
    return;
  }

  const user = await prisma.user.findUnique({ where: { phone: from } });
  if (!user) {
    await handleRegistration(from, body);
    return;
  }

  // Photo message (with or without caption)
  if (mediaUrl) {
    await handleLog(from, body, mediaUrl);
    return;
  }

  // Pending photo: waiting for activity reply
  if (pendingPhoto.has(from) && !body.startsWith('/')) {
    await handleLog(from, body);
    return;
  }

  if (!body.startsWith('/')) {
    await sendMessage(from, 'Send /help for commands, /log gym to log a workout, or send a photo 📸');
    return;
  }

  const [cmd, ...rest] = body.trim().split(/\s+/);
  const args = rest.join(' ');

  switch (cmd!.toLowerCase()) {
    case '/start':
      await sendMessage(from, `Welcome back, ${user.name}! 💪\nSend /help for commands.`);
      break;
    case '/rename':
      await handleRename(from, args);
      break;
    case '/log':
      await handleLog(from, args);
      break;
    case '/stats':
      await handleStats(from);
      break;
    case '/streak':
      await handleStreak(from);
      break;
    case '/history':
      await handleHistory(from);
      break;
    case '/help':
      await handleHelp(from);
      break;
    case '/create':
      await handleCreate(from, args);
      break;
    case '/join':
      await handleJoin(from, args);
      break;
    case '/leaderboard':
      await handleLeaderboard(from);
      break;
    case '/rules':
      await handleRules(from);
      break;
    case '/settings':
      await handleSettings(from, args);
      break;
    default:
      await sendMessage(from, `Unknown command: ${cmd}\nSend /help for a list of commands.`);
  }
}
