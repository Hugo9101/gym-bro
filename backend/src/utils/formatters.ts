export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function fmtLeaderboard(members: Array<{ name: string; total: number }>): string {
  return [...members]
    .sort((a, b) => b.total - a.total)
    .map((m, i) => `  ${i + 1}. ${m.name} — ${m.total} pts`)
    .join('\n');
}
