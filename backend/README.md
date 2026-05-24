# Gym Bro — Habit Accountability Bot

A group accountability bot for building any habit — gym, running, reading, meditation, whatever your squad decides to track. The mechanic is simple: log your habit daily before the deadline or lose points. Consistency wins, not volume.

## What this is really about

Most habit-tracking apps are solo. This one is social. You and your friends create a group, set a daily deadline, and hold each other accountable. Miss the deadline → lose points. Hit a 7-day streak → bonus points. The leaderboard is always live.

The point is not the gym. The point is that **social stakes change behaviour**. When your friends can see you slipping, you don't slip.

---

## How it works

### The accountability loop

```
1. Group is created with a daily deadline (e.g. 10pm)
2. Each member logs their habit before the deadline (/log gym, /log run, /log read)
3. At deadline the bot checks who logged and who didn't
4. Miss → lose penalty points. Hit 7-day streak → +20 pts. Hit 30-day → +50 pts
5. Leaderboard posted to everyone. Tomorrow starts fresh.
```

### Points system

| Event | Points |
|---|---|
| Starting score | 100 pts |
| Log before deadline | +0 (you just avoid the penalty) |
| Miss the deadline | −10 pts (configurable per group) |
| 7-day streak | +20 pts bonus |
| 30-day streak | +50 pts bonus |

The leaderboard rewards **consistency over volume**. One qualifying log per day counts — extra logs are fine for history but don't change the outcome.

### Bot commands

**Personal (DM the bot):**
| Command | Description |
|---|---|
| `/start` | Register and get started |
| `/log [activity]` | Log your habit for today |
| `/stats` | Your streak, total sessions, points |
| `/streak` | Current streak only |
| `/history` | Last 7 logs |
| `/help` | All commands |

**Group commands:**
| Command | Description |
|---|---|
| `/create [name]` | Create a group, get an invite code |
| `/join [code]` | Join an existing group |
| `/leaderboard` | Current standings |
| `/rules` | Group settings |
| `/settings deadline [h]` | Change deadline hour (creator only) |
| `/settings penalty [pts]` | Change penalty points (creator only) |

### Activities supported

```
gym | running | cycling | swimming | squash | tennis | padel |
basketball | football | yoga | hiking | climbing | other
```

Use `other` for anything not on the list — reading, meditation, cold shower, whatever your group is tracking.

---

## Tech stack

| Layer | Choice |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Messaging | WhatsApp via Twilio (migrating to Telegram — see `summary_md/telegram_migration.md`) |
| Database | PostgreSQL via Prisma ORM |
| DB host | Neon (serverless Postgres, free tier) |
| Photo storage | Cloudinary |
| Scheduler | node-cron (deadline checks every minute) |
| Deployment | Railway |

---

## Project structure

```
src/
├── index.ts               # Entry point — server + cron start
├── webhook.ts             # POST /webhook (Twilio inbound messages)
├── router.ts              # Routes messages to the right handler
├── handlers/
│   ├── register.ts        # First-time user flow
│   ├── logWorkout.ts      # /log + photo uploads
│   ├── group.ts           # /create /join /leaderboard /rules /settings
│   ├── stats.ts           # /stats /streak /history
│   └── help.ts            # /help
├── jobs/
│   └── deadlineCheck.ts   # Cron: fires at deadline, assigns penalties, posts leaderboard
├── services/
│   ├── twilio.ts          # Send messages via Twilio
│   ├── media.ts           # Upload photos to Cloudinary
│   └── points.ts          # Streak calculation + bonus logic
├── db/
│   └── prisma.ts          # Prisma client singleton
└── utils/
    ├── activityParser.ts  # "squash 45min" → { activityType, note }
    ├── challengePeriod.ts # Today's date in group timezone
    └── formatters.ts      # Message templates
```

---

## Local setup

### Prerequisites
- Node.js 20+
- A Neon account (free) — [neon.tech](https://neon.tech)
- A Twilio account (free sandbox) — [twilio.com](https://twilio.com)
- A Cloudinary account (free) — [cloudinary.com](https://cloudinary.com)

### Install & run

```bash
cd backend
npm install
cp .env.example .env   # fill in your credentials
npx prisma migrate dev --name init
npm run dev
```

### Expose locally for Twilio webhook

```bash
cloudflared tunnel --url http://localhost:3000
# copy the https URL → paste into Twilio Sandbox Settings as webhook
```

### Health check

```bash
curl http://localhost:3000/health
# {"ok":true}
```

---

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `TWILIO_ACCOUNT_SID` | From Twilio console (starts with AC) |
| `TWILIO_AUTH_TOKEN` | From Twilio console |
| `TWILIO_WHATSAPP_NUMBER` | Sandbox: `whatsapp:+14155238886` |
| `CLOUDINARY_URL` | From Cloudinary dashboard |
| `DEFAULT_TIMEZONE` | IANA timezone, e.g. `Europe/Berlin` |
| `DEFAULT_DEADLINE_HOUR` | Default deadline in 24h format (e.g. `22`) |
| `DEFAULT_PENALTY_POINTS` | Default penalty per miss (e.g. `10`) |
| `PORT` | Server port (default `3000`) |

---

## Deployment

See `summary_md/push_to_production.md` for the full Railway deployment guide.

Once deployed, the bot runs 24/7 — no terminal to keep open, no tunnel to manage, permanent webhook URL.

---

## What's next

- [ ] Migrate to Telegram (simpler setup, no tunnel needed) — see `summary_md/telegram_migration.md`
- [ ] Deploy to Railway for 24/7 uptime — see `summary_md/push_to_production.md`
- [ ] Looker Studio dashboard on top of Neon for team visibility
- [ ] iOS app (SwiftUI) — REST API layer already planned in spec
