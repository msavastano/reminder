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

/** For <input type="datetime-local"> value binding. */
export function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
