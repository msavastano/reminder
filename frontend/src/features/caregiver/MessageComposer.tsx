import { useEffect, useState, type FormEvent } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { messagesApi } from "../../lib/messagesApi";
import { formatFriendlyDateTime } from "../../lib/dateFormat";
import type { Message } from "../../lib/types";

interface MessageComposerProps {
  patientId: string;
}

export function MessageComposer({ patientId }: MessageComposerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    messagesApi.list(patientId).then(setMessages);
  }, [patientId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      const message = await messagesApi.send(patientId, body.trim());
      setMessages((prev) => [...prev, message]);
      setBody("");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card pad="md" className="composer-card">
      <h2 className="manager-title composer-title">Messages</h2>
      <div className="composer-history">
        {messages.length === 0 && <p className="caregiver-placeholder">No messages yet.</p>}
        {messages.map((m) => (
          <div key={m.id} className="composer-message">
            <span className="composer-message-body">{m.body}</span>
            <span className="composer-message-meta">
              {formatFriendlyDateTime(m.createdAt)} · {m.readAt ? "Read" : "Unread"}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="composer-form">
        <textarea
          className="k-input composer-textarea"
          placeholder="Send a message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
        />
        <Button type="submit" disabled={sending || !body.trim()}>
          {sending ? "Sending…" : "Send"}
        </Button>
      </form>
    </Card>
  );
}
