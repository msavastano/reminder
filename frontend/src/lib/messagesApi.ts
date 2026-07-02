import { api } from "./apiClient";
import type { Message } from "./types";

export const messagesApi = {
  list: (patientId: string) => api.get<{ messages: Message[] }>(`/patients/${patientId}/messages`).then((r) => r.messages),
  send: (patientId: string, body: string) =>
    api.post<{ message: Message }>(`/patients/${patientId}/messages`, { body }).then((r) => r.message),
  markRead: (id: string) => api.patch<{ message: Message }>(`/messages/${id}/read`).then((r) => r.message),
};
