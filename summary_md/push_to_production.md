# Push Gym Bro to Production

Deploy the backend to Railway so the bot runs 24/7 without your Mac.

---

## Step 1 — Push code to GitHub

In your terminal:

```bash
cd ~/Desktop/Gym_Bro
git add -A
git commit -m "Complete WhatsApp bot implementation"
```

Then go to [github.com/new](https://github.com/new):
- Name: `gym-bro`
- Visibility: Private
- Click **Create repository**

Copy the commands GitHub shows under **"push an existing repository"** and run them. Looks like:

```bash
git remote add origin https://github.com/Hugo9101/gym-bro.git
git push -u origin main
```

---

## Step 2 — Create Railway project

1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Click **New Project** → **Deploy from GitHub repo**
4. Select the `gym-bro` repo
5. Railway detects Node.js automatically and starts the first deploy

---

## Step 3 — Set environment variables

In Railway → your project → **Variables** tab, add each of these:

| Variable | Value |
|---|---|
| `TWILIO_ACCOUNT_SID` | From your `.env` |
| `TWILIO_AUTH_TOKEN` | From your `.env` |
| `TWILIO_WHATSAPP_NUMBER` | `whatsapp:+14155238886` |
| `DATABASE_URL` | Your Neon connection string |
| `CLOUDINARY_URL` | From your `.env` |
| `DEFAULT_TIMEZONE` | `Europe/Nicosia` |
| `DEFAULT_DEADLINE_HOUR` | `22` |
| `DEFAULT_PENALTY_POINTS` | `10` |
| `PORT` | `3000` |

Railway will redeploy automatically after you save variables.

---

## Step 4 — Generate a public URL

1. In Railway → your project → **Settings** → **Networking**
2. Click **Generate Domain**
3. Copy the URL — looks like `https://gym-bro-production.up.railway.app`

---

## Step 5 — Update Twilio webhook

1. Go to [console.twilio.com](https://console.twilio.com) → **Messaging → Try it Out → Send a WhatsApp message**
2. Click **Sandbox Settings**
3. Set **"When a message comes in"** to:
   ```
   https://gym-bro-production.up.railway.app/webhook
   ```
4. Method: **HTTP POST** → **Save**

---

## Step 6 — Verify

Open in your browser:
```
https://gym-bro-production.up.railway.app/health
```

Should return `{"ok":true}`. Then send a WhatsApp message to the bot — it should respond as normal.

You can now close your local terminals. The bot runs 24/7 on Railway.

---

## What changes after this

| Before | After |
|---|---|
| Must keep Mac + terminals on | Bot runs 24/7 on Railway |
| Tunnel URL changes on restart | Permanent Railway URL |
| Cron may miss deadlines if Mac sleeps | Deadline cron fires reliably every night |
| Local-only testing | Friends can use it for real |
