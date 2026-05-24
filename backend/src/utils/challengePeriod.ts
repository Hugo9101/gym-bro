// Returns midnight UTC representing the current calendar date in the given IANA timezone.
// Stored as a PostgreSQL date — comparisons within the same timezone are consistent.
export function getCurrentPeriod(timezone: string): Date {
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()); // en-CA gives YYYY-MM-DD
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function getCurrentHour(timezone: string): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
    10,
  );
}
