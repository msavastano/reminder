import { api } from "../apiClient";
import type { LinkedPatient } from "../types";

// Ported from frontend/src/lib/caregiverApi.ts (read path for the caregiver
// home screen). Invite/link mutations are added when those flows are ported.

export const caregiverApi = {
  listPatients: () =>
    api.get<{ patients: LinkedPatient[] }>("/caregiver/patients").then((r) => r.patients),
};
