import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import type { CreateReminderInput } from "../lib/api/reminders";
import { colors, radius, space } from "../theme";
import { ReminderForm } from "./ReminderForm";

interface Props {
  onSubmit: (input: CreateReminderInput) => Promise<void>;
  /** Caregiver create shows body + recurrence; patient quick-add stays simple. */
  detailed?: boolean;
}

/**
 * Collapsible "add a reminder" entry point shared by the patient and caregiver
 * screens. Expands into the shared ReminderForm (with the native date picker).
 */
export function QuickAddReminder({ onSubmit, detailed = false }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerText}>+ Add a reminder</Text>
      </Pressable>
    );
  }

  return (
    <ReminderForm
      detailed={detailed}
      submitLabel="Add"
      onCancel={() => setOpen(false)}
      onSubmit={async (input) => {
        await onSubmit(input);
        setOpen(false);
      }}
    />
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
});
