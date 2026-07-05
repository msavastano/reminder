import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Redirect } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { QuickAddReminder } from "../src/components/QuickAddReminder";
import { useAuth } from "../src/context/AuthContext";
import { remindersApi, type CreateReminderInput } from "../src/lib/api/reminders";
import { formatFriendlyDateTime } from "../src/lib/dateFormat";
import type { Reminder } from "../src/lib/types";
import { colors, radius, space } from "../src/theme";

export default function PatientHome() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const patientId = user?.id;
  const remindersKey = ["reminders", patientId];

  const query = useQuery({
    queryKey: remindersKey,
    queryFn: () => remindersApi.list(patientId as string),
    enabled: !!patientId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: remindersKey });

  const toggle = useMutation({
    mutationFn: (r: Reminder) => remindersApi.setCompleted(r.id, !r.completed),
    onSuccess: invalidate,
  });

  const create = useMutation({
    mutationFn: (input: CreateReminderInput) => remindersApi.create(patientId as string, input),
    onSuccess: invalidate,
  });

  // Deep-link / logged-out safety.
  if (!user) return <Redirect href="/login" />;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {user.name.split(" ")[0]}</Text>
        <View style={styles.headerActions}>
          <Link href="/messages" asChild>
            <Pressable hitSlop={8}>
              <Text style={styles.headerLink}>Messages</Text>
            </Pressable>
          </Link>
          <Pressable onPress={logout} hitSlop={8}>
            <Text style={styles.signOut}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      {query.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : query.isError ? (
        <View style={styles.center}>
          <Text style={styles.error}>Couldn't load your reminders.</Text>
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
            <ReminderRow reminder={item} onToggle={() => toggle.mutate(item)} busy={toggle.isPending} />
          )}
          ListEmptyComponent={<Text style={styles.empty}>You have no reminders yet.</Text>}
          refreshing={query.isFetching}
          onRefresh={() => query.refetch()}
        />
      )}
    </View>
  );
}

function ReminderRow({
  reminder,
  onToggle,
  busy,
}: {
  reminder: Reminder;
  onToggle: () => void;
  busy: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, reminder.completed && styles.cardDone, pressed && styles.cardPressed]}
      onPress={onToggle}
      disabled={busy}
    >
      <View style={[styles.checkbox, reminder.completed && styles.checkboxDone]}>
        {reminder.completed ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, reminder.completed && styles.cardTitleDone]}>{reminder.title}</Text>
        {reminder.body ? <Text style={styles.cardBody}>{reminder.body}</Text> : null}
        <Text style={styles.cardWhen}>{formatFriendlyDateTime(reminder.dueAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfacePage },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space[5],
    paddingTop: space[3],
    paddingBottom: space[2],
  },
  greeting: { fontSize: 20, fontWeight: "700", color: colors.textStrong },
  headerActions: { flexDirection: "row", alignItems: "center", gap: space[4] },
  headerLink: { fontSize: 15, fontWeight: "600", color: colors.textLink },
  signOut: { fontSize: 15, fontWeight: "600", color: colors.textLink },
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
  empty: { textAlign: "center", color: colors.textMuted, marginTop: space[8] },
  card: {
    flexDirection: "row",
    gap: space[3],
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: space[4],
  },
  cardPressed: { opacity: 0.7 },
  cardDone: { opacity: 0.6 },
  cardText: { flex: 1, gap: space[1] },
  cardTitle: { fontSize: 17, fontWeight: "700", color: colors.textStrong },
  cardTitleDone: { textDecorationLine: "line-through" },
  cardBody: { fontSize: 15, color: colors.textBody },
  cardWhen: { fontSize: 14, color: colors.textMuted },
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
});
