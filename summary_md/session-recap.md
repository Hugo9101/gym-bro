# Gym Bro — Build Session Recap

**Sessions:** 2026-05-20 → 2026-05-23
**Repo:** `~/Desktop/Gym_Bro`

---

## What was built

The complete WhatsApp bot backend — from empty scaffold to a fully wired Express + Prisma + Twilio application. Every file listed in the spec's project structure now exists and is implemented.

---

## Files created / changed

### Schema
| File | Change |
|---|---|
| `prisma/schema.prisma` | Full schema — 6 spec tables + `PeriodClose` (idempotent cron guard) |

**Models:** `User`, `Group`, `GroupMember`, `Workout`, `Penalty`, `Points`, `PeriodClose`

Key decisions baked in:
- `Workout.challengePeriod` → `@db.Date` (timezone-aware daily/weekly bucketing)
- `Penalty` → `@@unique([userId, groupId, challengePeriod])` — prevents double-penalising
- `PeriodClose` → composite PK `(groupId, challengePeriod)` — lets the cron skip groups it already processed, even when all members logged (no penalties row exists to check against)

---

### Entry point & routing
| File | What it does |
|---|---|
| `src/index.ts` | Express server, mounts `/webhook`, starts deadline cron on boot |
| `src/webhook.ts` | Parses Twilio form POST (`From`, `Body`, `NumMedia`, `MediaUrl0`), replies 200 immediately, then routes async |
| `src/router.ts` | State machine: onboarding → registered → command / photo / pending-photo |

---

### Handlers
| File | Commands covered |
|---|---|
| `src/handlers/register.ts` | First-message name collection, `/start` |
| `src/handlers/logWorkout.ts` | `/log [activity]`, photo + caption, photo → pending → activity reply |
| `src/handlers/group.ts` | `/create`, `/join`, `/leaderboard`, `/rules`, `/settings deadline`, `/settings penalty` |
| `src/handlers/stats.ts` | `/stats`, `/streak`, `/history` |
| `src/handlers/help.ts` | `/help` |

---

### Services
| File | What it does |
|---|---|
| `src/services/twilio.ts` | Lazy Twilio client singleton, `sendMessage(to, body)` |
| `src/services/media.ts` | Downloads media from Twilio (Basic auth via `https` module), uploads to Cloudinary |
| `src/services/points.ts` | `getStreak()` — counts consecutive logged periods backwards; `applyStreakBonus()` — +20 @ 7d, +50 @ 30d |

---

### Jobs & utils
| File | What it does |
|---|---|
| `src/jobs/deadlineCheck.ts` | `node-cron` every minute → checks each group's `deadlineHour` in its `timezone` → closes period, assigns penalties, posts leaderboard to all members |
| `src/utils/activityParser.ts` | Parses `"squash 45min"` → `{ activityType: 'squash', note: '45min' }` |
| `src/utils/challengePeriod.ts` | `getCurrentPeriod(tz)` — today's date as UTC midnight in any IANA timezone; `getCurrentHour(tz)` |
| `src/utils/formatters.ts` | `fmtLeaderboard()`, `cap()` |

---

### Config fixes
| File | Change |
|---|---|
| `package.json` | `@types/express` downgraded `^5.0.0` → `^4.17.21` (matched Express 4 runtime); `cloudinary ^2.5.1` added |

---

## Architecture decisions made

| Topic | Decision |
|---|---|
| Group chat vs 1:1 | 1:1 DM fallback for MVP (Twilio sandbox limitation); "active group" = most recently joined |
| Idempotent cron | `PeriodClose` table rather than relying on penalty rows (handles "all logged" case) |
| Photo download | Node `https` module with Twilio Basic auth — no extra HTTP dependency |
| Streak scope | Per-group when in group context; all workouts for personal DMs |
| Timezone storage | IANA string per group; `challengePeriod` stored as PostgreSQL `date` (UTC midnight) |
| Streak bonuses | Applied at period close (not on `/log`), only at exactly 7 or 30 days |

---

## What still needs doing

### Immediate (manual)
- [ ] `npm install && npm run dev` — verify server starts (needs Node/npm in PATH)
- [ ] `npx prisma migrate dev --name init` — create tables in local Postgres
- [ ] Twilio sandbox: join from phone, set webhook to `https://<ngrok-url>/webhook`
- [ ] `npx ngrok http 3000` — expose local server

### Next build steps
- [ ] Step 3 — Deploy to Railway + managed Postgres (needed for 24/7 cron during pilot)
- [ ] Step 15 — Edge case hardening (bad invite codes, unregistered users in groups, try/catch audit)
- [ ] Step 16 — `PILOT.md` + 2-week pilot with 4–6 friends
- [ ] Phase 3 — REST API layer for iOS (JWT, OTP auth, all endpoints)
- [ ] Phase 4 — SwiftUI iOS app

---

## Key file locations

```
Gym_Bro/
├── backend/
│   ├── prisma/schema.prisma      ← full DB schema
│   ├── src/
│   │   ├── index.ts              ← entry point
│   │   ├── webhook.ts            ← POST /webhook
│   │   ├── router.ts             ← message routing
│   │   ├── handlers/             ← all bot commands
│   │   ├── jobs/deadlineCheck.ts ← cron + leaderboard
│   │   ├── services/             ← Twilio, Cloudinary, points
│   │   └── utils/                ← parsers, formatters
│   └── package.json
├── PROGRESS.md                   ← checkbox tracker
├── gym-bro-whatsapp-mvp.md       ← full spec
├── gym-bro-build-prompts.md      ← step-by-step build prompts
└── summary_md/
    └── session-recap.md          ← this file
```
