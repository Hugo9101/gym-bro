export const ACTIVITY_TYPES = [
  'gym', 'running', 'cycling', 'swimming', 'squash', 'tennis', 'padel',
  'basketball', 'football', 'yoga', 'hiking', 'climbing', 'other',
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];

export function parseActivity(raw: string): { activityType: ActivityType; note: string | null } {
  const [first, ...rest] = raw.trim().split(/\s+/);
  const candidate = (first ?? '').toLowerCase();
  const activityType: ActivityType = (ACTIVITY_TYPES as readonly string[]).includes(candidate)
    ? (candidate as ActivityType)
    : 'other';
  const note = rest.length > 0 ? rest.join(' ') : null;
  return { activityType, note };
}

export const ACTIVITY_PICKER =
  'What activity was this? Reply with:\ngym | running | cycling | swimming | squash | tennis | padel | basketball | football | yoga | hiking | climbing | other';
