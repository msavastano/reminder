import { useEffect, useState } from "react";
import { messagesApi } from "../../lib/messagesApi";
import { formatFriendlyDateTime } from "../../lib/dateFormat";
import type { Message } from "../../lib/types";

interface MessagesPanelProps {
  patientId: string;
  refreshKey: number;
}

export function MessagesPanel({ patientId, refreshKey }: MessagesPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    messagesApi.list(patientId).then(setMessages);
  }, [patientId, refreshKey]);

  async function open(message: Message) {
    if (message.readAt) return;
    const updated = await messagesApi.markRead(message.id);
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  const newestFirst = [...messages].reverse();

  return (
    <div className="messages-panel-rows">
      {newestFirst.length === 0 && <p className="messages-panel-empty">No messages yet.</p>}
      {newestFirst.map((m) => (
        <button key={m.id} className={`message-row ${!m.readAt ? "message-row-unread" : ""}`} onClick={() => open(m)}>
          {!m.readAt && <span className="message-unread-dot" />}
          <div className="message-row-text">
            <span className="message-row-body">{m.body}</span>
            <span className="message-row-time">
              {m.sender && <span className="sender-chip">{m.sender.name.split(" ")[0]}</span>}
              {formatFriendlyDateTime(m.createdAt)}
              {!m.readAt && <span className="message-new-label">NEW</span>}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
