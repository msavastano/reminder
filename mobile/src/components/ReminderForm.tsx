import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { CreateReminderInput } from "../lib/api/reminders";
import type { RecurrenceRule } from "../lib/types";
import { colors, radius, space } from "../theme";
import { DateTimeField } from "./DateTimeField";

export interface ReminderFormInitial {
  title?: string;
  body?: string | null;
  dueAt?: string;
  recurrenceRule?: RecurrenceRule;
}

interface Props {
  /** Prefill for editing; omit for a fresh reminder (defaults due to +1h). */
  initial?: ReminderFormInitial;
  /** Show the body field and recurrence chips (caregiver create/edit). */
  detailed?: boolean;
  submitLabel: string;
  onSubmit: (input: CreateReminderInput) => Promise<void>;
  onCancel: () => void;
}

const RECURRENCE: { key: RecurrenceRule; label: string }[] = [
  { key: "none", label: "Doesn't repeat" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
];

/**
 * Shared reminder editor used for both create and edit, on the patient
 * (simple: title + when) and caregiver (detailed: + body + recurrence) screens.
 * Due date/time uses the native DateTimeField.
 */
export function ReminderForm({ initial, detailed = false, submitLabel, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [due, setDue] = useState<Date>(initial?.dueAt ? new Date(initial.dueAt) : new Date(Date.now() + 60 * 60 * 1000));
  const [recurrence, setRecurrence] = useState<RecurrenceRule>(initial?.recurrenceRule ?? "none");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        body: detailed ? body.trim() || undefined : undefined,
        dueAt: due.toISOString(),
        recurrenceRule: detailed ? recurrence : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.card}>
      <TextInput
        style={styles.input}
        placeholder="What do you need to remember?"
        placeholderTextColor={colors.textSubtle}
        value={title}
        onChangeText={setTitle}
        autoFocus
        editable={!submitting}
      />

      {detailed ? (
        <TextInput
          style={styles.input}
          placeholder="Details (optional)"
          placeholderTextColor={colors.textSubtle}
          value={body}
          onChangeText={setBody}
          editable={!submitting}
        />
      ) : null}

      <Text style={styles.label}>When</Text>
      <DateTimeField value={due} onChange={setDue} />

      {detailed ? (
        <>
          <Text style={styles.label}>Repeats</Text>
          <View style={styles.chips}>
            {RECURRENCE.map((r) => {
              const active = r.key === recurrence;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => setRecurrence(r.key)}
                  style={[styles.chip, active && styles.chipActive]}
                  disabled={submitting}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{r.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, styles.btnPrimary, (!title.trim() || submitting) && styles.btnDisabled]}
          onPress={submit}
          disabled={!title.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.textOnBrand} />
          ) : (
            <Text style={styles.btnPrimaryText}>{submitLabel}</Text>
          )}
        </Pressable>
        <Pressable style={[styles.btn, styles.btnGhost]} onPress={onCancel} disabled={submitting}>
          <Text style={styles.btnGhostText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: space[4],
    gap: space[3],
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    fontSize: 16,
    color: colors.textStrong,
  },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 14, color: colors.textBody },
  chipTextActive: { color: colors.textOnBrand, fontWeight: "700" },
  actions: { flexDirection: "row", gap: space[2], marginTop: space[1] },
  btn: { borderRadius: radius.pill, paddingVertical: space[3], paddingHorizontal: space[5], alignItems: "center" },
  btnPrimary: { backgroundColor: colors.brand, minWidth: 120 },
  btnPrimaryText: { color: colors.textOnBrand, fontWeight: "700", fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
  btnGhost: { backgroundColor: "transparent" },
  btnGhostText: { color: colors.textMuted, fontWeight: "600", fontSize: 15 },
});
