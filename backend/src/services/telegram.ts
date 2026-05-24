import { Telegraf } from 'telegraf';

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

export async function sendMessage(to: string, body: string): Promise<void> {
  await bot.telegram.sendMessage(to, body);
}
