import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { caregiverApi } from "../src/lib/api/caregiver";
import { ApiError } from "../src/lib/apiClient";
import type { LinkedPatient } from "../src/lib/types";
import { colors, radius, space } from "../src/theme";

export default function CaregiverHome() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["caregiver-patients"],
    queryFn: () => caregiverApi.listPatients(),
    enabled: !!user,
  });

  const invite = useMutation({
    mutationFn: (email: string) => caregiverApi.invitePatient(email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["caregiver-patients"] }),
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
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <AddPatientForm onInvite={(email) => invite.mutateAsync(email)} />
            </View>
          }
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

function AddPatientForm({ onInvite }: { onInvite: (email: string) => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!email.trim()) return;
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await onInvite(email.trim());
      setNotice("Invite sent — waiting for the patient to accept.");
      setEmail("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send the invite. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <View style={styles.addWrap}>
        <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
          <Text style={styles.triggerText}>+ Add a patient</Text>
        </Pressable>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.addCard}>
      <Text style={styles.addLabel}>Patient's email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="patient@example.com"
        placeholderTextColor={colors.textSubtle}
        editable={!submitting}
        autoFocus
      />
      {error ? <Text style={styles.formError}>{error}</Text> : null}
      <View style={styles.addActions}>
        <Pressable
          style={[styles.inviteBtn, (!email.trim() || submitting) && styles.inviteDisabled]}
          onPress={submit}
          disabled={!email.trim() || submitting}
        >
          {submitting ? <ActivityIndicator color={colors.textOnBrand} /> : <Text style={styles.inviteText}>Invite</Text>}
        </Pressable>
        <Pressable
          style={styles.cancelBtn}
          onPress={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={submitting}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
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
  headerBlock: { marginBottom: space[3] },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: space[8] },
  addWrap: { gap: space[2] },
  trigger: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    borderRadius: radius.md,
    paddingVertical: space[4],
    alignItems: "center",
  },
  triggerText: { color: colors.textLink, fontSize: 16, fontWeight: "600" },
  notice: { color: colors.success, fontSize: 14, textAlign: "center" },
  addCard: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: space[4],
    gap: space[2],
  },
  addLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
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
  formError: { color: colors.danger, fontSize: 14 },
  addActions: { flexDirection: "row", gap: space[2], marginTop: space[1] },
  inviteBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: space[5],
    paddingVertical: space[3],
    minWidth: 96,
    alignItems: "center",
  },
  inviteText: { color: colors.textOnBrand, fontWeight: "700", fontSize: 15 },
  inviteDisabled: { opacity: 0.5 },
  cancelBtn: { paddingHorizontal: space[4], paddingVertical: space[3] },
  cancelText: { color: colors.textMuted, fontWeight: "600", fontSize: 15 },
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
