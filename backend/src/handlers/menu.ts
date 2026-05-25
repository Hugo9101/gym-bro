import { Markup } from 'telegraf';
import { sendMessage } from '../services/telegram';

export async function showActivityPicker(from: string): Promise<void> {
  await sendMessage(
    from,
    '🏋️ *Log your workout*\n\nChoose your activity:',
    Markup.inlineKeyboard([
      [Markup.button.callback('🏋️ Gym', 'log:gym'),        Markup.button.callback('🏃 Running', 'log:running')],
      [Markup.button.callback('🚴 Cycling', 'log:cycling'), Markup.button.callback('🏊 Swimming', 'log:swimming')],
      [Markup.button.callback('🎾 Tennis', 'log:tennis'),   Markup.button.callback('🎾 Padel', 'log:padel')],
      [Markup.button.callback('🏸 Squash', 'log:squash'),   Markup.button.callback('🧘 Yoga', 'log:yoga')],
      [Markup.button.callback('🥾 Hiking', 'log:hiking'),   Markup.button.callback('🏀 Basketball', 'log:basketball')],
      [Markup.button.callback('⚽ Football', 'log:football'), Markup.button.callback('🧗 Climbing', 'log:climbing')],
      [Markup.button.callback('📝 Other', 'log:other')],
    ]),
  );
}

export async function showGroupMenu(from: string): Promise<void> {
  await sendMessage(
    from,
    '👥 *Group*\n\nWhat would you like to do?',
    Markup.inlineKeyboard([
      [Markup.button.callback('➕ Create Group', 'group:create'), Markup.button.callback('🔗 Join Group', 'group:join')],
      [Markup.button.callback('📋 Rules', 'group:rules'),         Markup.button.callback('⚙️ Settings', 'group:settings')],
    ]),
  );
}

export async function showSettingsMenu(from: string): Promise<void> {
  await sendMessage(
    from,
    '⚙️ *Settings*\n\nWhat would you like to change?',
    Markup.inlineKeyboard([
      [Markup.button.callback('🕐 Deadline Hour', 'settings:deadline')],
      [Markup.button.callback('💀 Penalty Points', 'settings:penalty')],
    ]),
  );
}
