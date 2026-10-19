// Calendar day in the user's own timezone, e.g. "2026-09-25".
// (toISOString() uses UTC, which puts a US dinner or an Iran after-midnight
// snack on the wrong day.)
export function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
