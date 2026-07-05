import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { AiCheckPanel } from "../../src/components/AiCheckPanel";
import { MessagesSection } from "../../src/components/MessagesSection";
import { QuickAddReminder } from "../../src/components/QuickAddReminder";
import { useAuth } from "../../src/context/AuthContext";
import { remindersApi, type CreateReminderInput } from "../../src/lib/api/reminders";
import { formatFriendlyDateTime } from "../../src/lib/dateFormat";
import type { Reminder } from "../../src/lib/types";
import { colors, radius, space } from "../../src/theme";

export default function PatientReminderManager() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ patientId: string; name?: string }>();
  const patientId = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;
  const name = (Array.isArray(params.name) ? params.name[0] : params.name) ?? "Patient";

  const queryClient = useQueryClient();
  const remindersKey = ["reminders", patientId];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: remindersKey });

  const query = useQuery({
    queryKey: remindersKey,
    queryFn: () => remindersApi.list(patientId),
    enabled: !!patientId,
  });

  const create = useMutation({
    mutationFn: (input: CreateReminderInput) => remindersApi.create(patientId, input),
    onSuccess: invalidate,
  });
  const toggle = useMutation({
    mutationFn: (r: Reminder) => remindersApi.setCompleted(r.id, !r.completed),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => remindersApi.remove(id),
    onSuccess: invalidate,
  });

  if (!user) return <Redirect href="/login" />;

  function confirmDelete(reminder: Reminder) {
    Alert.alert("Delete reminder", `Delete "${reminder.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => remove.mutate(reminder.id) },
    ]);
  }

  const firstName = name.split(" ")[0];

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: `${firstName}'s reminders` }} />

      {query.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : query.isError ? (
        <View style={styles.center}>
          <Text style={styles.error}>Couldn't load reminders.</Text>
          <Pressable onPress={() => query.refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <QuickAddReminder
                onSubmit={async (input) => {
                  await create.mutateAsync(input);
                }}
              />
            </View>
          }
          renderItem={({ item }) => (
            <ManagerRow
              reminder={item}
              currentUserId={user.id}
              onToggle={() => toggle.mutate(item)}
              onDelete={() => confirmDelete(item)}
              busy={toggle.isPending || remove.isPending}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No reminders yet.</Text>}
          ListFooterComponent={
            <View style={styles.footer}>
              <MessagesSection patientId={patientId} currentUserId={user.id} mode="caregiver" />
            </View>
          }
          refreshing={query.isFetching}
          onRefresh={() => query.refetch()}
        />
      )}
    </View>
  );
}

function ManagerRow({
  reminder,
  currentUserId,
  onToggle,
  onDelete,
  busy,
}: {
  reminder: Reminder;
  currentUserId: string;
  onToggle: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const addedByYou = reminder.createdById === currentUserId;
  const [aiOpen, setAiOpen] = useState(false);
  return (
    <View style={[styles.card, reminder.completed && styles.cardDone]}>
      <Pressable style={styles.rowMain} onPress={onToggle} disabled={busy}>
        <View style={[styles.checkbox, reminder.completed && styles.checkboxDone]}>
          {reminder.completed ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <View style={styles.cardText}>
          <View style={styles.titleLine}>
            <Text style={[styles.cardTitle, reminder.completed && styles.cardTitleDone]}>{reminder.title}</Text>
            {reminder.recurrenceRule !== "none" ? (
              <View style={styles.recurBadge}>
                <Text style={styles.recurBadgeText}>{reminder.recurrenceRule}</Text>
              </View>
            ) : null}
          </View>
          {reminder.body ? <Text style={styles.cardBody}>{reminder.body}</Text> : null}
          <Text style={styles.cardWhen}>
            {formatFriendlyDateTime(reminder.dueAt)}
            {reminder.createdBy ? ` · added by ${addedByYou ? "you" : reminder.createdBy.name.split(" ")[0]}` : ""}
          </Text>
        </View>
      </Pressable>
      <View style={styles.rowActions}>
        <Pressable onPress={() => setAiOpen((v) => !v)} disabled={busy} hitSlop={8}>
          <Text style={styles.aiText}>{aiOpen ? "Hide AI" : "AI check"}</Text>
        </Pressable>
        <Pressable onPress={onDelete} disabled={busy} hitSlop={8}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
      {aiOpen ? <AiCheckPanel reminderId={reminder.id} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfacePage },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: space[3] },
  error: { color: colors.danger, fontSize: 15 },
  retry: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: space[5],
    paddingVertical: space[3],
  },
  retryText: { color: colors.textOnBrand, fontWeight: "700" },
  list: { padding: space[5], gap: space[3] },
  headerBlock: { marginBottom: space[3] },
  footer: { marginTop: space[6] },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: space[8] },
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: space[4],
    gap: space[2],
  },
  cardDone: { opacity: 0.6 },
  rowMain: { flexDirection: "row", gap: space[3] },
  cardText: { flex: 1, gap: space[1] },
  titleLine: { flexDirection: "row", alignItems: "center", gap: space[2], flexWrap: "wrap" },
  cardTitle: { fontSize: 17, fontWeight: "700", color: colors.textStrong },
  cardTitleDone: { textDecorationLine: "line-through" },
  cardBody: { fontSize: 15, color: colors.textBody },
  cardWhen: { fontSize: 13, color: colors.textMuted },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkmark: { color: colors.textOnBrand, fontSize: 15, fontWeight: "900", lineHeight: 18 },
  recurBadge: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.pill,
    paddingHorizontal: space[2],
    paddingVertical: 2,
  },
  recurBadgeText: { fontSize: 11, color: colors.textMuted, fontWeight: "700", textTransform: "capitalize" },
  rowActions: { flexDirection: "row", justifyContent: "flex-end", gap: space[4], paddingTop: space[1] },
  aiText: { color: colors.textLink, fontWeight: "600", fontSize: 14 },
  deleteText: { color: colors.danger, fontWeight: "600", fontSize: 14 },
});
