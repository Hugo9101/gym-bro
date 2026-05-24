# Telegram Migration

## WhatsApp vs Telegram

| | WhatsApp (current) | Telegram |
|---|---|---|
| Setup | Twilio account + sandbox + tunnel | Create bot via @BotFather, get token — done |
| Cost | Twilio credits (small) | Completely free |
| Friends joining | Must text `join came-recently` first | Just search the bot and message it |
| Tunnel needed | Yes (cloudflared/ngrok) | No — can use polling mode, no public URL needed |
| Code changes | Current setup | ~1 day to rewrite with `telegraf` npm package |

## Tradeoff

The only downside of Telegram: your friends need Telegram instead of WhatsApp. In Germany/Cyprus, WhatsApp is dominant — so it depends on whether your pilot group uses Telegram.

## What changes in the code

- Remove: `src/webhook.ts`, `src/services/twilio.ts`
- Add: `telegraf` npm package (Telegram bot framework)
- Rewrite: `src/index.ts` to use Telegram polling instead of Express webhook
- Keep everything else: handlers, db, utils, jobs, schema — all stays the same

No tunnel needed. No Twilio account. Bot runs locally with just `npm run dev` and works immediately.

## How to create a Telegram bot (2 min)

1. Open Telegram → search **@BotFather**
2. Send `/newbot`
3. Choose a name: `Gym Bro`
4. Choose a username: `gymbro_pilot_bot` (must end in `bot`)
5. BotFather gives you a token: `123456789:ABCdefGHI...`
6. Add to `.env`: `TELEGRAM_BOT_TOKEN=123456789:ABCdefGHI...`

## Decision

| Stick with WhatsApp | Switch to Telegram |
|---|---|
| Friends don't have Telegram | Friends have or are OK with Telegram |
| Want to validate WhatsApp-native UX | Want the simplest possible setup |
| Already have pilot group on WhatsApp | Starting fresh with pilot group |
