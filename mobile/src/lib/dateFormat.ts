// Ported from frontend/src/lib/dateFormat.ts. Only formatFriendlyDateTime
// carries over — toDateTimeLocalValue is web-only (<input type="datetime-local">)
// and is replaced by a native date picker when reminder editing is ported.
// Hermes ships Intl, so toLocale* works on device.

export function formatFriendlyDateTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);

  if (dayDiff === 0) return `Today at ${time}`;
  if (dayDiff === 1) return `Tomorrow at ${time}`;
  if (dayDiff === -1) return `Yesterday at ${time}`;
  if (dayDiff > 1 && dayDiff < 7) return `${date.toLocaleDateString(undefined, { weekday: "long" })} at ${time}`;
  if (dayDiff < 0) return `${Math.abs(dayDiff)} days ago at ${time}`;
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at ${time}`;
}
