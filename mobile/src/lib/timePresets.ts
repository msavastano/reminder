// Quick due-time options for reminder creation on mobile. This replaces the
// web's <input type="datetime-local"> with a small set of tappable presets —
// good UX for the patient/caregiver quick-add flow. A full native date/time
// picker (@react-native-community/datetimepicker) for arbitrary times and
// reminder editing is a deferred follow-up.

export interface TimePreset {
  key: string;
  label: string;
  toDate: () => Date;
}

function at(base: Date, hour: number, minute = 0): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Today at `hour`, rolling to tomorrow if that time has already passed. */
function nextTimeToday(hour: number): Date {
  const now = new Date();
  let target = at(now, hour);
  if (target.getTime() <= now.getTime()) {
    target = at(new Date(now.getTime() + 24 * 60 * 60 * 1000), hour);
  }
  return target;
}

export const timePresets: TimePreset[] = [
  { key: "1h", label: "In 1 hour", toDate: () => new Date(Date.now() + 60 * 60 * 1000) },
  { key: "3h", label: "In 3 hours", toDate: () => new Date(Date.now() + 3 * 60 * 60 * 1000) },
  { key: "evening", label: "This evening", toDate: () => nextTimeToday(18) },
  { key: "tomorrow-am", label: "Tomorrow 9 AM", toDate: () => at(new Date(Date.now() + 24 * 60 * 60 * 1000), 9) },
  { key: "next-week", label: "Next week", toDate: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
];
