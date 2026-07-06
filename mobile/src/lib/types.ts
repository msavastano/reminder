// Copied verbatim from the web app's frontend/src/lib/types.ts. These describe
// the JSON API contract (date fields are ISO strings), so they are platform-
// neutral and safe to duplicate here per the "duplicate, don't share" decision.

export type Role = "PATIENT" | "CAREGIVER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export type RecurrenceRule = "none" | "daily" | "weekly";

export interface UserRef {
  id: string;
  name: string;
  role: Role;
}

export interface Reminder {
  id: string;
  patientId: string;
  createdById: string;
  createdBy?: UserRef;
  title: string;
  body: string | null;
  dueAt: string;
  recurrenceRule: RecurrenceRule;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  sender?: UserRef;
  patientId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface AiEvaluationResult {
  clarity: string;
  couldConfusePatient: boolean;
  simplifiedText: string;
  conflictNotes: string;
}

export interface AiEvaluation {
  id: string;
  reminderId: string;
  requestedById: string;
  result: AiEvaluationResult;
  modelName: string;
  createdAt: string;
}

export interface AiReminderSummary {
  summary: string;
  steps: string[];
}

export type LinkStatus = "PENDING" | "ACCEPTED";

export interface LinkedPatient {
  patientId: string;
  name: string;
  email: string;
  status: LinkStatus;
}

export interface LinkedCaregiver {
  caregiverId: string;
  name: string;
  email: string;
}

export interface CaregiverInvite {
  inviteId: string;
  caregiverId: string;
  caregiverName: string;
  caregiverEmail: string;
  invitedAt: string;
}
