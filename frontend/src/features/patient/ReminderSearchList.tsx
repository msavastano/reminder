import { useEffect, useMemo, useState } from "react";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { remindersApi } from "../../lib/remindersApi";
import { formatFriendlyDateTime } from "../../lib/dateFormat";
import type { Reminder } from "../../lib/types";

interface ReminderSearchListProps {
  patientId: string;
  refreshKey: number;
  onChanged: () => void;
}

export function ReminderSearchList({ patientId, refreshKey, onChanged }: ReminderSearchListProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    remindersApi.list(patientId).then(setReminders);
  }, [patientId, refreshKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reminders;
    return reminders.filter((r) => r.title.toLowerCase().includes(q) || r.body?.toLowerCase().includes(q));
  }, [reminders, query]);

  async function toggle(reminder: Reminder) {
    await remindersApi.setCompleted(reminder.id, !reminder.completed);
    onChanged();
  }

  return (
    <Card pad="sm" className="search-list-card">
      <Input
        type="search"
        placeholder="Search your reminders…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-list-input"
      />
      <div className="search-list-rows">
        {filtered.length === 0 && <p className="search-list-empty">No reminders found.</p>}
        {filtered.map((r) => (
          <label key={r.id} className={`search-list-row ${r.completed ? "search-list-row-completed" : ""}`}>
            <input type="checkbox" checked={r.completed} onChange={() => toggle(r)} />
            <div className="search-list-row-text">
              <span className="search-list-row-title">{r.title}</span>
              <span className="search-list-row-due">
                {formatFriendlyDateTime(r.dueAt)}
                {r.createdBy && r.createdById !== patientId && (
                  <span className="sender-chip">from {r.createdBy.name.split(" ")[0]}</span>
                )}
              </span>
            </div>
          </label>
        ))}
      </div>
    </Card>
  );
}
