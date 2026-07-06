import { api } from "../apiClient";
import type { AiEvaluation, AiReminderSummary } from "../types";

// Ported from frontend/src/lib/aiApi.ts.

export const aiApi = {
  evaluate: (reminderId: string) =>
    api.post<{ evaluation: AiEvaluation }>("/ai/evaluate-reminder", { reminderId }).then((r) => r.evaluation),
  getLatest: (reminderId: string) =>
    api.get<{ evaluation: AiEvaluation | null }>(`/ai/evaluations/${reminderId}`).then((r) => r.evaluation),
  summarizeIncomplete: (patientId: string) =>
    api
      .post<{ summary: AiReminderSummary }>(`/patients/${patientId}/ai/reminders-summary`)
      .then((r) => r.summary),
};
