import express from 'express';
import 'dotenv/config';
import { bot } from './services/telegram';
import { startDeadlineCron } from './jobs/deadlineCheck';
import { route, routeCallback } from './router';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Gym Bro backend running on port ${PORT}`);
  startDeadlineCron();
});

// Text messages
bot.on('text', async (ctx) => {
  const from = ctx.chat.id.toString();
  // Strip @botname suffix Telegram appends in group chats
  const body = ctx.message.text.replace(/@\w+/g, '').trim();
  try {
    await route(from, body);
  } catch (err) {
    console.error('[telegram] error:', err);
  }
});

// Inline keyboard button presses
bot.on('callback_query', async (ctx) => {
  if (!('data' in ctx.callbackQuery)) return;
  const from = ctx.from.id.toString();
  const data = ctx.callbackQuery.data;
  try {
    await ctx.answerCbQuery();
    await routeCallback(from, data);
  } catch (err) {
    console.error('[telegram] callback error:', err);
  }
});

// Photo messages
bot.on('photo', async (ctx) => {
  const from = ctx.chat.id.toString();
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const caption = (ctx.message.caption ?? '').replace(/@\w+/g, '').trim();
  try {
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);
    await route(from, caption, fileLink.href);
  } catch (err) {
    console.error('[telegram] error:', err);
  }
});

bot.launch();
console.log('[telegram] bot started (polling)');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
