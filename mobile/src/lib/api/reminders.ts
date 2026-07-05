import { api } from "../apiClient";
import type { Reminder } from "../types";

// Ported from frontend/src/lib/remindersApi.ts. The read paths needed for the
// first screens are included; create/update/complete/delete follow the same
// pattern and are added when those screens are ported.

export const remindersApi = {
  list: (patientId: string) =>
    api.get<{ reminders: Reminder[] }>(`/patients/${patientId}/reminders`).then((r) => r.reminders),
  current: (patientId: string) =>
    api.get<{ reminder: Reminder | null }>(`/patients/${patientId}/reminders/current`).then((r) => r.reminder),
};
