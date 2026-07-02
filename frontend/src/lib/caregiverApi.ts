import { api } from "./apiClient";
import type { LinkedPatient } from "./types";

export const caregiverApi = {
  listPatients: () => api.get<{ patients: LinkedPatient[] }>("/caregiver/patients").then((r) => r.patients),
  linkPatient: (patientEmail: string) =>
    api.post<{ patient: LinkedPatient }>("/caregiver/patients/link", { patientEmail }).then((r) => r.patient),
  unlinkPatient: (patientId: string) => api.delete<void>(`/caregiver/patients/${patientId}/link`),
};
