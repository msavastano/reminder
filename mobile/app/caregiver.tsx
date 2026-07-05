import { useQuery } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { caregiverApi } from "../src/lib/api/caregiver";
import type { LinkedPatient } from "../src/lib/types";
import { colors, radius, space } from "../src/theme";

export default function CaregiverHome() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const query = useQuery({
    queryKey: ["caregiver-patients"],
    queryFn: () => caregiverApi.listPatients(),
    enabled: !!user,
  });

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
          <Text style={styles.error}>Couldn't load your patients.</Text>
          <Pressable onPress={() => query.refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(item) => item.patientId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PatientRow
              patient={item}
              onPress={
                item.status === "ACCEPTED"
                  ? () =>
                      router.push({
                        pathname: "/caregiver/[patientId]",
                        params: { patientId: item.patientId, name: item.name },
                      })
                  : undefined
              }
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No linked patients yet.</Text>}
          refreshing={query.isFetching}
          onRefresh={() => query.refetch()}
        />
      )}
    </View>
  );
}

function PatientRow({ patient, onPress }: { patient: LinkedPatient; onPress?: () => void }) {
  const pending = patient.status === "PENDING";
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.cardPressed : null]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{patient.name}</Text>
        <View style={[styles.badge, pending ? styles.badgePending : styles.badgeActive]}>
          <Text style={[styles.badgeText, pending ? styles.badgePendingText : styles.badgeActiveText]}>
            {pending ? "Invite pending" : "Linked"}
          </Text>
        </View>
      </View>
      <Text style={styles.cardEmail}>{patient.email}</Text>
      {onPress ? <Text style={styles.cardHint}>Tap to manage reminders ›</Text> : null}
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
  cardPressed: { opacity: 0.7 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space[3] },
  cardTitle: { fontSize: 17, fontWeight: "700", color: colors.textStrong, flexShrink: 1 },
  cardEmail: { fontSize: 14, color: colors.textMuted },
  cardHint: { fontSize: 13, color: colors.textLink, fontWeight: "600", marginTop: space[1] },
  badge: { borderRadius: radius.pill, paddingHorizontal: space[3], paddingVertical: space[1] },
  badgeText: { fontSize: 12, fontWeight: "700" },
  badgeActive: { backgroundColor: colors.brandSoft },
  badgeActiveText: { color: colors.brandSoftFg },
  badgePending: { backgroundColor: colors.surfaceSunken },
  badgePendingText: { color: colors.textMuted },
});
