export type Role = "PATIENT" | "CAREGIVER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export type RecurrenceRule = "none" | "daily" | "weekly";

export interface Reminder {
  id: string;
  patientId: string;
  createdById: string;
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

export interface LinkedPatient {
  patientId: string;
  name: string;
  email: string;
}
