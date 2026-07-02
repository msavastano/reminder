import { api } from "./apiClient";
import type { RecurrenceRule, Reminder } from "./types";

export interface CreateReminderInput {
  title: string;
  body?: string;
  dueAt: string;
  recurrenceRule?: RecurrenceRule;
}

export interface UpdateReminderInput {
  title?: string;
  body?: string;
  dueAt?: string;
  recurrenceRule?: RecurrenceRule;
}

export const remindersApi = {
  list: (patientId: string) => api.get<{ reminders: Reminder[] }>(`/patients/${patientId}/reminders`).then((r) => r.reminders),
  current: (patientId: string) =>
    api.get<{ reminder: Reminder | null }>(`/patients/${patientId}/reminders/current`).then((r) => r.reminder),
  create: (patientId: string, input: CreateReminderInput) =>
    api.post<{ reminder: Reminder }>(`/patients/${patientId}/reminders`, input).then((r) => r.reminder),
  update: (id: string, input: UpdateReminderInput) =>
    api.patch<{ reminder: Reminder }>(`/reminders/${id}`, input).then((r) => r.reminder),
  setCompleted: (id: string, completed: boolean) =>
    api.patch<{ reminder: Reminder }>(`/reminders/${id}/complete`, { completed }).then((r) => r.reminder),
  remove: (id: string) => api.delete<void>(`/reminders/${id}`),
};
