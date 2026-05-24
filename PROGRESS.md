# Gym Bro — Build Progress

## What We're Building

A workout accountability app with two parallel tracks:
- **WhatsApp bot** — zero-download MVP to validate the mechanic with friends
- **iOS app (SwiftUI)** — native app built in parallel, ready when pilot succeeds

Both share a single Node.js + PostgreSQL backend.

## Plan Reference

Full implementation plan: `~/.claude/plans/quiet-prancing-rain.md`
Original spec: `gym-bro-whatsapp-mvp.md`

---

## Build Phases

### Phase 0 — Monorepo + infra
- [x] Create `backend/` folder structure
- [x] Express + TypeScript scaffold (`src/index.ts`, `tsconfig.json`, `package.json`)
- [x] `.env.example`
- [ ] `npm install` + `npm run dev` verified (run manually in terminal)
- [x] Prisma schema — all 6 tables + `PeriodClose` (idempotent cron guard)
- [ ] `npx prisma migrate dev --name init` (run manually — needs local Postgres)
- [ ] Deploy backend to Railway (needed for 24/7 cron)

### Phase 1 — WhatsApp bot core (Steps 2–6)
- [ ] Twilio sandbox setup + ngrok (manual)
- [x] `POST /webhook` — parses Twilio body, routes to handler
- [x] Message router — command / photo / onboarding state machine
- [x] User registration — first-message + `/start` flow
- [x] Solo workout logging — `/log`, `activityParser`, `challengePeriod`
- [x] Photo handler — Cloudinary upload, caption parsing, pending-photo flow

### Phase 2 — Groups (Steps 9–11)
- [x] `/create`, `/join`, invite code, `points.total = 100`
- [x] Group workout log — "Still waiting for…" reply
- [x] `/leaderboard`, `/rules`, `/settings` (creator only)
- [x] `/stats`, `/streak`, `/history`, `/help`

### Phase 3 — Backend REST API (for iOS)
- [ ] JWT middleware
- [ ] OTP auth flow (Twilio Verify → JWT)
- [ ] All REST endpoints (groups, workouts, stats)
- [ ] Multipart photo upload

### Phase 4 — iOS app (SwiftUI)
- [ ] Xcode project + folder structure
- [ ] `APIClient.swift` (URLSession + async/await)
- [ ] Auth flow: PhoneEntryView → OTPVerifyView → Keychain
- [ ] HomeView + GroupDetailView
- [ ] LogWorkoutView (PhotosPicker + activity grid)
- [ ] StatsView, CreateGroupView, JoinGroupView

### Phase 5 — Automation + notifications
- [x] Deadline cron — per-group at `deadlineHour` in `timezone`, idempotent via `PeriodClose`
- [x] Penalty assignment + streak bonuses (+20 @ 7d, +50 @ 30d)
- [ ] iOS push notifications (deadline reminders, leaderboard posted)

### Phase 6 — Pilot polish
- [ ] Edge cases (duplicate join, unknown invite code, unregistered user)
- [ ] 2-week pilot with 4–6 friends
- [ ] Track validation metrics (see spec)

---

## Pending Setup (blocked until resolved)

- [ ] Add GitHub remote so Ultraplan can run:
  ```
  git remote add origin https://github.com/YOUR_USERNAME/gym-bro.git
  ```
- [ ] Twilio account + sandbox joined
- [ ] Railway account for deployment
- [ ] Cloudinary account for photo storage

---

## Key Technical Decisions

| Area | Decision |
|---|---|
| iOS UI | SwiftUI |
| iOS auth | Phone number + OTP (Twilio Verify) |
| iOS architecture | MVVM |
| Backend | Node.js + TypeScript + Express |
| ORM | Prisma + PostgreSQL |
| WhatsApp | Twilio WhatsApp Business API |
| Photo storage | Cloudinary |
| Deployment | Railway |
