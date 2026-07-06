import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { remindersApi } from "../lib/api/reminders";
import { formatFriendlyDateTime } from "../lib/dateFormat";
import { colors, radius, space } from "../theme";

/**
 * Ported from frontend/src/features/patient/CurrentReminderHero.tsx. Shows the
 * single most-relevant reminder (most overdue, else next upcoming, incomplete
 * only — selected server-side by GET /patients/:id/reminders/current) with a
 * prominent "Mark complete" action.
 */
export function CurrentReminderHero({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();
  const currentKey = ["reminder-current", patientId];

  const query = useQuery({
    queryKey: currentKey,
    queryFn: () => remindersApi.current(patientId),
  });

  const complete = useMutation({
    mutationFn: (reminderId: string) => remindersApi.setCompleted(reminderId, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentKey });
      queryClient.invalidateQueries({ queryKey: ["reminders", patientId] });
    },
  });

  if (query.isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.loadingText}>Loading your reminder…</Text>
        </View>
      </View>
    );
  }

  const reminder = query.data;

  if (!reminder) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <View style={styles.emptyTile}>
          <Text style={styles.emptyTileText}>✓</Text>
        </View>
        <Text style={styles.emptyTitle}>Nothing due right now</Text>
        <Text style={styles.emptySubtitle}>You're all caught up.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.dueRow}>
        <Text style={styles.due}>{formatFriendlyDateTime(reminder.dueAt)}</Text>
        {reminder.createdBy && reminder.createdById !== patientId ? (
          <View style={styles.senderChip}>
            <Text style={styles.senderChipText}>from {reminder.createdBy.name.split(" ")[0]}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.title}>{reminder.title}</Text>
      {reminder.body ? <Text style={styles.body}>{reminder.body}</Text> : null}
      <Pressable
        style={[styles.button, complete.isPending && styles.buttonDisabled]}
        onPress={() => complete.mutate(reminder.id)}
        disabled={complete.isPending}
      >
        {complete.isPending ? (
          <ActivityIndicator color={colors.textOnBrand} />
        ) : (
          <Text style={styles.buttonText}>Mark complete</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: space[6],
    gap: space[3],
  },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: space[3] },
  loadingText: { fontSize: 15, color: colors.textMuted },
  emptyCard: { alignItems: "center", gap: space[2] },
  emptyTile: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTileText: { fontSize: 26, fontWeight: "800", color: colors.brandSoftFg },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: colors.textStrong },
  emptySubtitle: { fontSize: 15, color: colors.textMuted },
  dueRow: { flexDirection: "row", alignItems: "center", gap: space[2], flexWrap: "wrap" },
  due: { fontSize: 14, fontWeight: "600", color: colors.textMuted },
  senderChip: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.pill,
    paddingHorizontal: space[2],
    paddingVertical: 2,
  },
  senderChipText: { fontSize: 12, color: colors.textMuted, fontWeight: "700" },
  title: { fontSize: 24, fontWeight: "800", color: colors.textStrong },
  body: { fontSize: 16, color: colors.textBody },
  button: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: space[4],
    alignItems: "center",
    marginTop: space[2],
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.textOnBrand, fontSize: 17, fontWeight: "700" },
});
