import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { aiApi } from "../lib/api/ai";
import { ApiError } from "../lib/apiClient";
import { colors, radius, space } from "../theme";

/**
 * Per-reminder "AI check" (ported from the web AskAiPanel). Loads the latest
 * stored evaluation and lets a caregiver (re-)run Gemini on the reminder wording.
 * Full AI output requires GEMINI_API_KEY on the backend; without it the evaluate
 * call returns 502 and the error state is shown.
 */
export function AiCheckPanel({ reminderId }: { reminderId: string }) {
  const queryClient = useQueryClient();
  const evalKey = ["ai-eval", reminderId];

  const latest = useQuery({
    queryKey: evalKey,
    queryFn: () => aiApi.getLatest(reminderId),
  });

  const run = useMutation({
    mutationFn: () => aiApi.evaluate(reminderId),
    onSuccess: (evaluation) => queryClient.setQueryData(evalKey, evaluation),
  });

  const evaluation = latest.data;
  const errorMessage =
    run.error instanceof ApiError ? run.error.message : run.error ? "Could not reach the AI service." : null;

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>AI reminder check</Text>

      {latest.isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.brand} size="small" />
          <Text style={styles.muted}>Checking for a previous result…</Text>
        </View>
      ) : null}

      {run.isPending ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.brand} size="small" />
          <Text style={styles.muted}>Asking Gemini…</Text>
        </View>
      ) : null}

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {!latest.isLoading && !run.isPending && evaluation === null && !errorMessage ? (
        <Text style={styles.muted}>No AI check has been run for this reminder yet.</Text>
      ) : null}

      {evaluation && !run.isPending ? (
        <View style={styles.result}>
          <Field label="Clarity" value={evaluation.result.clarity} />
          {evaluation.result.couldConfusePatient ? (
            <View style={styles.warnBadge}>
              <Text style={styles.warnBadgeText}>Could confuse the patient</Text>
            </View>
          ) : null}
          <Field label="Simplified wording" value={evaluation.result.simplifiedText} />
          <Field label="Scheduling notes" value={evaluation.result.conflictNotes} />
          <Text style={styles.meta}>
            Checked {new Date(evaluation.createdAt).toLocaleString()} · {evaluation.modelName}
          </Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.button, run.isPending && styles.buttonDisabled]}
        onPress={() => run.mutate()}
        disabled={run.isPending}
      >
        <Text style={styles.buttonText}>{evaluation ? "Re-check with AI" : "Check with AI"}</Text>
      </Pressable>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: space[3],
    gap: space[2],
    marginTop: space[2],
  },
  title: { fontSize: 14, fontWeight: "700", color: colors.textStrong },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: space[2] },
  muted: { fontSize: 13, color: colors.textMuted },
  error: { fontSize: 13, color: colors.danger },
  result: { gap: space[2] },
  field: { gap: 2 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase" },
  fieldValue: { fontSize: 14, color: colors.textBody },
  warnBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.warning,
    borderRadius: radius.pill,
    paddingHorizontal: space[3],
    paddingVertical: 2,
  },
  warnBadgeText: { fontSize: 12, fontWeight: "700", color: colors.clay900 },
  meta: { fontSize: 11, color: colors.textSubtle },
  button: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    marginTop: space[1],
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 14, fontWeight: "700", color: colors.textLink },
});
