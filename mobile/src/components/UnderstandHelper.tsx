import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { aiApi } from "../lib/api/ai";
import { ApiError } from "../lib/apiClient";
import { colors, radius, space } from "../theme";

/**
 * Patient-facing "Help me understand what I need to do" (ported from the web
 * UnderstandHelper). Opens a native Modal and asks the backend to summarize the
 * patient's incomplete reminders into plain steps. Full output requires
 * GEMINI_API_KEY; the empty-list case returns a canned message without Gemini.
 */
export function UnderstandHelper({ patientId }: { patientId: string }) {
  const [open, setOpen] = useState(false);

  const summarize = useMutation({
    mutationFn: () => aiApi.summarizeIncomplete(patientId),
  });

  function handleOpen() {
    setOpen(true);
    summarize.reset();
    summarize.mutate();
  }

  const errorMessage =
    summarize.error instanceof ApiError
      ? summarize.error.message
      : summarize.error
        ? "Could not reach the AI service."
        : null;
  const summary = summarize.data;

  return (
    <>
      <Pressable style={styles.trigger} onPress={handleOpen}>
        <Text style={styles.triggerText}>Help me understand what I need to do</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Here's what's on your list</Text>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
              {summarize.isPending ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.brand} />
                  <Text style={styles.muted}>Working it out for you…</Text>
                </View>
              ) : errorMessage ? (
                <Text style={styles.error}>{errorMessage}</Text>
              ) : summary ? (
                <View style={styles.summaryBlock}>
                  <Text style={styles.summaryText}>{summary.summary}</Text>
                  {summary.steps.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <Text style={styles.stepNum}>{i + 1}</Text>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>

            <Pressable style={styles.gotIt} onPress={() => setOpen(false)}>
              <Text style={styles.gotItText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingVertical: space[4],
    alignItems: "center",
  },
  triggerText: { fontSize: 16, fontWeight: "700", color: colors.textLink },
  backdrop: { flex: 1, backgroundColor: "rgba(37,31,24,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surfaceCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space[6],
    gap: space[4],
    maxHeight: "80%",
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.textStrong },
  body: { maxHeight: 380 },
  bodyContent: { gap: space[3] },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: space[3], paddingVertical: space[4] },
  muted: { fontSize: 15, color: colors.textMuted },
  error: { fontSize: 15, color: colors.danger },
  summaryBlock: { gap: space[3] },
  summaryText: { fontSize: 17, color: colors.textBody, lineHeight: 24 },
  stepRow: { flexDirection: "row", gap: space[3], alignItems: "flex-start" },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    color: colors.textOnBrand,
    fontWeight: "800",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 26,
    overflow: "hidden",
  },
  stepText: { flex: 1, fontSize: 16, color: colors.textBody, lineHeight: 23 },
  gotIt: { backgroundColor: colors.brand, borderRadius: radius.pill, paddingVertical: space[4], alignItems: "center" },
  gotItText: { color: colors.textOnBrand, fontSize: 16, fontWeight: "700" },
});
