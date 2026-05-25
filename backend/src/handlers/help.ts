import { sendMessage, mainMenuKeyboard } from '../services/telegram';

const HELP = `Gym Bro commands 💪

*Personal (DM the bot):*
/start — register or welcome back
/rename [name] — change your display name
/log [activity] — log a workout
/stats — your stats & points
/streak — current streak
/history — last 7 workouts
/help — this message

*Group commands:*
/create [name] — create a group & get invite code
/join [code] — join a group
/leaderboard — current standings
/rules — group challenge settings
/settings deadline [h] — change deadline hour (creator only)
/settings penalty [pts] — change penalty points (creator only)

Send a *photo* to log a workout — caption is optional.

Activities: gym | running | cycling | swimming | squash | tennis | padel | basketball | football | yoga | hiking | climbing | other`;

export async function handleHelp(from: string): Promise<void> {
  await sendMessage(from, HELP, mainMenuKeyboard());
}
