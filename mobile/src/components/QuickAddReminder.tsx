import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { CreateReminderInput } from "../lib/api/reminders";
import { timePresets } from "../lib/timePresets";
import { colors, radius, space } from "../theme";

interface Props {
  onSubmit: (input: CreateReminderInput) => Promise<void>;
}

/**
 * Collapsible reminder creator shared by the patient and caregiver screens.
 * Presentational: the parent owns the mutation + cache invalidation via onSubmit.
 * Due time is chosen from presets (see timePresets); free-form date/time via a
 * native picker is a deferred follow-up.
 */
export function QuickAddReminder({ onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [presetKey, setPresetKey] = useState(timePresets[0].key);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setTitle("");
    setPresetKey(timePresets[0].key);
    setOpen(false);
  }

  async function submit() {
    const preset = timePresets.find((p) => p.key === presetKey) ?? timePresets[0];
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), dueAt: preset.toDate().toISOString() });
      reset();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerText}>+ Add a reminder</Text>
      </Pressable>
    );
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

      <Text style={styles.label}>When</Text>
      <View style={styles.presets}>
        {timePresets.map((p) => {
          const active = p.key === presetKey;
          return (
            <Pressable
              key={p.key}
              onPress={() => setPresetKey(p.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, styles.btnPrimary, (!title.trim() || submitting) && styles.btnDisabled]}
          onPress={submit}
          disabled={!title.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.textOnBrand} />
          ) : (
            <Text style={styles.btnPrimaryText}>Add</Text>
          )}
        </Pressable>
        <Pressable style={[styles.btn, styles.btnGhost]} onPress={reset} disabled={submitting}>
          <Text style={styles.btnGhostText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    borderRadius: radius.md,
    paddingVertical: space[4],
    alignItems: "center",
  },
  triggerText: { color: colors.textLink, fontSize: 16, fontWeight: "600" },
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
  presets: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
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
  btnPrimary: { backgroundColor: colors.brand, minWidth: 96 },
  btnPrimaryText: { color: colors.textOnBrand, fontWeight: "700", fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
  btnGhost: { backgroundColor: "transparent" },
  btnGhostText: { color: colors.textMuted, fontWeight: "600", fontSize: 15 },
});
