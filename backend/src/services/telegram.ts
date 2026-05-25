import { Telegraf, Markup } from 'telegraf';

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendMessage(to: string, text: string, extra?: any): Promise<void> {
  await bot.telegram.sendMessage(to, text, { parse_mode: 'Markdown', ...extra });
}

export function mainMenuKeyboard() {
  return Markup.keyboard([
    ['🏋️ Log Workout', '📊 My Stats'],
    ['👥 Group', '🏆 Leaderboard'],
    ['❓ Help'],
  ]).resize();
}
