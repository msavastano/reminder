import { api } from "./apiClient";
import type { CaregiverInvite, LinkedCaregiver, LinkedPatient } from "./types";

export const caregiverApi = {
  listPatients: () => api.get<{ patients: LinkedPatient[] }>("/caregiver/patients").then((r) => r.patients),
  invitePatient: (patientEmail: string) =>
    api.post<{ patient: LinkedPatient }>("/caregiver/patients/link", { patientEmail }).then((r) => r.patient),
  unlinkPatient: (patientId: string) => api.delete<void>(`/caregiver/patients/${patientId}/link`),
};

export const patientLinksApi = {
  listCaregivers: () => api.get<{ caregivers: LinkedCaregiver[] }>("/patient/caregivers").then((r) => r.caregivers),
  listInvites: () => api.get<{ invites: CaregiverInvite[] }>("/patient/invites").then((r) => r.invites),
  acceptInvite: (inviteId: string) => api.post<{ caregiver: LinkedCaregiver }>(`/patient/invites/${inviteId}/accept`),
  declineInvite: (inviteId: string) => api.post<void>(`/patient/invites/${inviteId}/decline`),
};
