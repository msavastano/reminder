import { GoogleGenAI, Type } from "@google/genai";
import type { Reminder } from "@prisma/client";

export const GEMINI_MODEL_NAME = "gemini-3.1-flash-lite";

export interface AiEvaluationResult {
  clarity: string;
  couldConfusePatient: boolean;
  simplifiedText: string;
  conflictNotes: string;
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    clarity: {
      type: Type.STRING,
      description: "A short, plain-language read on how clear this reminder's wording is.",
    },
    couldConfusePatient: {
      type: Type.BOOLEAN,
      description: "Whether the current wording could confuse a memory-impaired reader.",
    },
    simplifiedText: {
      type: Type.STRING,
      description: "A simplified, friendlier rewrite of the reminder's title and details combined into one short sentence.",
    },
    conflictNotes: {
      type: Type.STRING,
      description:
        "Any scheduling conflict or duplicate-intent concern with this reminder's timing. If none, say so plainly (e.g. 'No conflicts noticed.').",
    },
  },
  required: ["clarity", "couldConfusePatient", "simplifiedText", "conflictNotes"],
};

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to backend/.env to enable the AI reminder evaluation feature.",
    );
  }
  client = new GoogleGenAI({ apiKey });
  return client;
}

function buildPrompt(reminder: Reminder): string {
  return [
    "You are helping a caregiver review a reminder written for someone living with Alzheimer's or another memory condition.",
    "Evaluate the reminder below and respond with the requested JSON fields only.",
    "",
    `Title: ${reminder.title}`,
    `Details: ${reminder.body ?? "(none)"}`,
    `Due: ${reminder.dueAt.toISOString()}`,
    `Repeats: ${reminder.recurrenceRule}`,
  ].join("\n");
}

export async function evaluateReminder(reminder: Reminder): Promise<AiEvaluationResult> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: buildPrompt(reminder),
    config: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }
  return JSON.parse(text) as AiEvaluationResult;
}

export interface AiReminderSummaryResult {
  summary: string;
  steps: string[];
}

const SUMMARY_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A short, warm, plain-language overview (1-2 sentences) of what the patient needs to do, addressed directly to them.",
    },
    steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "A short ordered list of plain-language action steps, one per reminder, in the order they should be done. Each step should be a single simple sentence.",
    },
  },
  required: ["summary", "steps"],
};

function buildSummaryPrompt(reminders: Reminder[]): string {
  const list = reminders
    .map(
      (r, i) =>
        `${i + 1}. Title: ${r.title}\n   Details: ${r.body ?? "(none)"}\n   Due: ${r.dueAt.toISOString()}\n   Repeats: ${r.recurrenceRule}`,
    )
    .join("\n");
  return [
    "You are helping someone living with Alzheimer's or another memory condition understand their to-do list.",
    "Below is their list of reminders that are not yet completed, in order of due date.",
    "Write a short, warm, very plain-language summary they can read themselves, plus a short ordered list of what to do.",
    "Keep sentences short and simple. Avoid clinical or technical language. Speak directly to the person (use 'you').",
    "Do not mention that this text was written by AI.",
    "",
    list,
  ].join("\n");
}

export async function summarizeIncompleteReminders(reminders: Reminder[]): Promise<AiReminderSummaryResult> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL_NAME,
    contents: buildSummaryPrompt(reminders),
    config: {
      responseMimeType: "application/json",
      responseSchema: SUMMARY_RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }
  return JSON.parse(text) as AiReminderSummaryResult;
}
