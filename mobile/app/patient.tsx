import { useQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { remindersApi } from "../src/lib/api/reminders";
import { formatFriendlyDateTime } from "../src/lib/dateFormat";
import type { Reminder } from "../src/lib/types";
import { colors, radius, space } from "../src/theme";

export default function PatientHome() {
  const { user, logout } = useAuth();

  const patientId = user?.id;
  const query = useQuery({
    queryKey: ["reminders", patientId],
    queryFn: () => remindersApi.list(patientId as string),
    enabled: !!patientId,
  });

  // Deep-link / logged-out safety.
  if (!user) return <Redirect href="/login" />;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {user.name.split(" ")[0]}</Text>
        <Pressable onPress={logout} hitSlop={8}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
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
          renderItem={({ item }) => <ReminderRow reminder={item} />}
          ListEmptyComponent={<Text style={styles.empty}>You have no reminders yet.</Text>}
          refreshing={query.isFetching}
          onRefresh={() => query.refetch()}
        />
      )}
    </View>
  );
}

function ReminderRow({ reminder }: { reminder: Reminder }) {
  return (
    <View style={[styles.card, reminder.completed && styles.cardDone]}>
      <View style={styles.cardTop}>
        <Text style={[styles.cardTitle, reminder.completed && styles.cardTitleDone]}>{reminder.title}</Text>
        {reminder.completed ? (
          <View style={styles.badgeDone}>
            <Text style={styles.badgeDoneText}>Done</Text>
          </View>
        ) : null}
      </View>
      {reminder.body ? <Text style={styles.cardBody}>{reminder.body}</Text> : null}
      <Text style={styles.cardWhen}>{formatFriendlyDateTime(reminder.dueAt)}</Text>
    </View>
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
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space[3] },
  cardTitle: { fontSize: 17, fontWeight: "700", color: colors.textStrong, flexShrink: 1 },
  cardTitleDone: { textDecorationLine: "line-through" },
  cardBody: { fontSize: 15, color: colors.textBody },
  cardWhen: { fontSize: 14, color: colors.textMuted },
  badgeDone: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space[3],
    paddingVertical: space[1],
  },
  badgeDoneText: { color: colors.brandSoftFg, fontSize: 12, fontWeight: "700" },
});
