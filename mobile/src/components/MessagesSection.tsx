import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { messagesApi } from "../lib/api/messages";
import { formatFriendlyDateTime } from "../lib/dateFormat";
import type { Message } from "../lib/types";
import { colors, radius, space } from "../theme";

interface Props {
  patientId: string;
  currentUserId: string;
  /** "patient" can tap unread messages to mark them read; "caregiver" can send. */
  mode: "patient" | "caregiver";
}

/**
 * Self-contained messages thread, embedded by the patient messages screen
 * (mode="patient", tap-to-read) and the caregiver patient manager
 * (mode="caregiver", with a composer). Ported from the web MessagesPanel /
 * MessageComposer.
 */
export function MessagesSection({ patientId, currentUserId, mode }: Props) {
  const queryClient = useQueryClient();
  const messagesKey = ["messages", patientId];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: messagesKey });

  const [body, setBody] = useState("");

  const query = useQuery({
    queryKey: messagesKey,
    queryFn: () => messagesApi.list(patientId),
    enabled: !!patientId,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => messagesApi.markRead(id),
    onSuccess: invalidate,
  });
  const send = useMutation({
    mutationFn: (text: string) => messagesApi.send(patientId, text),
    onSuccess: () => {
      setBody("");
      invalidate();
    },
  });

  const messages = query.data ?? [];
  const newestFirst = [...messages].reverse();

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Messages</Text>

      {mode === "caregiver" ? (
        <View style={styles.composer}>
          <TextInput
            style={styles.textarea}
            placeholder="Send a message…"
            placeholderTextColor={colors.textSubtle}
            value={body}
            onChangeText={setBody}
            multiline
            editable={!send.isPending}
          />
          <Pressable
            style={[styles.sendBtn, (!body.trim() || send.isPending) && styles.disabled]}
            onPress={() => body.trim() && send.mutate(body.trim())}
            disabled={!body.trim() || send.isPending}
          >
            {send.isPending ? (
              <ActivityIndicator color={colors.textOnBrand} />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {query.isLoading ? (
        <ActivityIndicator color={colors.brand} style={{ marginVertical: space[4] }} />
      ) : newestFirst.length === 0 ? (
        <Text style={styles.empty}>No messages yet.</Text>
      ) : (
        <View style={styles.list}>
          {newestFirst.map((m) => (
            <MessageRow
              key={m.id}
              message={m}
              currentUserId={currentUserId}
              onOpen={
                mode === "patient" && !m.readAt ? () => markRead.mutate(m.id) : undefined
              }
            />
          ))}
        </View>
      )}
    </View>
  );
}

function MessageRow({
  message,
  currentUserId,
  onOpen,
}: {
  message: Message;
  currentUserId: string;
  onOpen?: () => void;
}) {
  const unread = !message.readAt;
  const who =
    message.sender && message.senderId !== currentUserId ? message.sender.name.split(" ")[0] : "you";
  return (
    <Pressable
      style={[styles.msg, unread && styles.msgUnread]}
      onPress={onOpen}
      disabled={!onOpen}
    >
      <View style={styles.msgTop}>
        {unread ? <View style={styles.dot} /> : null}
        <Text style={styles.msgBody}>{message.body}</Text>
      </View>
      <Text style={styles.msgMeta}>
        {who} · {formatFriendlyDateTime(message.createdAt)} · {message.readAt ? "Read" : "Unread"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[3] },
  heading: { fontSize: 18, fontWeight: "700", color: colors.textStrong },
  composer: { gap: space[2] },
  textarea: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    fontSize: 16,
    color: colors.textStrong,
    minHeight: 60,
    textAlignVertical: "top",
  },
  sendBtn: {
    alignSelf: "flex-end",
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: space[5],
    paddingVertical: space[3],
    minWidth: 88,
    alignItems: "center",
  },
  sendText: { color: colors.textOnBrand, fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.5 },
  empty: { color: colors.textMuted, fontSize: 14, paddingVertical: space[2] },
  list: { gap: space[2] },
  msg: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: space[3],
    gap: space[1],
  },
  msgUnread: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  msgTop: { flexDirection: "row", alignItems: "center", gap: space[2] },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.brand },
  msgBody: { fontSize: 15, color: colors.textBody, flexShrink: 1 },
  msgMeta: { fontSize: 12, color: colors.textMuted },
});
