// Due dates are calendar days ("2026-11-20"), not moments: they're read and formatted in UTC so
// the day never shifts with the time zone of the server or the browser ("Nov 20" stays "Nov 20").
const SAME_YEAR = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const OTHER_YEAR = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

// "Nov 20" this year, "Jan 5, 2027" otherwise.
export function formatDueDate(dueDate: string, now: Date = new Date()): string {
  const date = new Date(`${dueDate}T00:00:00Z`);
  return (date.getUTCFullYear() === now.getUTCFullYear() ? SAME_YEAR : OTHER_YEAR).format(date);
}
