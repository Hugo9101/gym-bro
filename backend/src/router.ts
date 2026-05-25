import prisma from './db/prisma';
import { handleRegistration, handleRename, onboardingState } from './handlers/register';
import { handleLog, pendingPhoto } from './handlers/logWorkout';
import { handleCreate, handleJoin, handleLeaderboard, handleRules, handleSettings, handleMyGroup } from './handlers/group';
import { handleStats, handleStreak, handleHistory } from './handlers/stats';
import { handleHelp } from './handlers/help';
import { showActivityPicker, showGroupMenu, showSettingsMenu } from './handlers/menu';
import { sendMessage, mainMenuKeyboard } from './services/telegram';

// Pending text input state for multi-step inline-button flows
export const pendingInput = new Map<string, 'create_name' | 'join_code' | 'settings_deadline' | 'settings_penalty'>();

// Reply keyboard button labels → internal action
const MENU_BUTTONS: Record<string, string> = {
  '🏋️ Log Workout': 'SHOW_ACTIVITY_PICKER',
  '📊 My Stats':     '/stats',
  '👥 Group':        'SHOW_GROUP_MENU',
  '🏆 Leaderboard':  '/leaderboard',
  '❓ Help':          '/help',
};

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

  // Photo message
  if (mediaUrl) {
    await handleLog(from, body, mediaUrl);
    return;
  }

  // Waiting for activity text after a photo
  if (pendingPhoto.has(from) && !body.startsWith('/')) {
    await handleLog(from, body);
    return;
  }

  // Pending text input from an inline button flow (create/join/settings)
  const pending = pendingInput.get(from);
  if (pending && !body.startsWith('/')) {
    pendingInput.delete(from);
    switch (pending) {
      case 'create_name':         await handleCreate(from, body);                   return;
      case 'join_code':           await handleJoin(from, body);                     return;
      case 'settings_deadline':   await handleSettings(from, `deadline ${body}`);   return;
      case 'settings_penalty':    await handleSettings(from, `penalty ${body}`);    return;
    }
  }

  // Reply keyboard button press (arrives as plain text)
  const menuAction = MENU_BUTTONS[body];
  if (menuAction) {
    if (menuAction === 'SHOW_ACTIVITY_PICKER') { await showActivityPicker(from); return; }
    if (menuAction === 'SHOW_GROUP_MENU')       { await showGroupMenu(from);     return; }
    body = menuAction; // treat as a command below
  }

  if (!body.startsWith('/')) {
    await sendMessage(from, 'Tap a button below or send /help 👇', mainMenuKeyboard());
    return;
  }

  const [cmd, ...rest] = body.trim().split(/\s+/);
  const args = rest.join(' ');

  switch (cmd!.toLowerCase()) {
    case '/start':
      await sendMessage(
        from,
        `Welcome back, ${user.name}! 💪\n\nTap a button below to get started.`,
        mainMenuKeyboard(),
      );
      break;
    case '/rename':
      await handleRename(from, args);
      break;
    case '/log':
      if (!args) { await showActivityPicker(from); }
      else        { await handleLog(from, args); }
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
      if (!args) {
        pendingInput.set(from, 'create_name');
        await sendMessage(from, '➕ *Create a group*\n\nWhat do you want to call it?');
      } else {
        await handleCreate(from, args);
      }
      break;
    case '/join':
      if (!args) {
        pendingInput.set(from, 'join_code');
        await sendMessage(from, '🔗 *Join a group*\n\nEnter the invite code:');
      } else {
        await handleJoin(from, args);
      }
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

// Handles inline button (callback_query) presses
export async function routeCallback(from: string, data: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { phone: from } });
  if (!user) {
    await sendMessage(from, 'Please register first by sending /start.');
    return;
  }

  const colonIdx = data.indexOf(':');
  const action = colonIdx >= 0 ? data.slice(0, colonIdx) : data;
  const param  = colonIdx >= 0 ? data.slice(colonIdx + 1) : '';

  switch (action) {
    case 'log':
      await handleLog(from, param);
      break;

    case 'group':
      switch (param) {
        case 'mygroup':
          await handleMyGroup(from);
          break;
        case 'create':
          pendingInput.set(from, 'create_name');
          await sendMessage(from, '➕ *Create a group*\n\nWhat do you want to call it?');
          break;
        case 'join':
          pendingInput.set(from, 'join_code');
          await sendMessage(from, '🔗 *Join a group*\n\nEnter the invite code:');
          break;
        case 'rules':
          await handleRules(from);
          break;
        case 'settings':
          await showSettingsMenu(from);
          break;
      }
      break;

    case 'settings':
      switch (param) {
        case 'deadline':
          pendingInput.set(from, 'settings_deadline');
          await sendMessage(from, '🕐 *Change deadline*\n\nEnter the new deadline hour (0–23):');
          break;
        case 'penalty':
          pendingInput.set(from, 'settings_penalty');
          await sendMessage(from, '💀 *Change penalty*\n\nEnter the new penalty points (e.g. 10):');
          break;
      }
      break;

    default:
      await sendMessage(from, 'Unknown action. Try tapping a menu button.');
  }
}
