import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Badge } from "../../components/Badge";
import { remindersApi } from "../../lib/remindersApi";
import { formatFriendlyDateTime, toDateTimeLocalValue } from "../../lib/dateFormat";
import type { LinkedPatient, RecurrenceRule, Reminder } from "../../lib/types";
import { MessageComposer } from "./MessageComposer";
import { AskAiPanel } from "./AskAiPanel";

interface FormState {
  title: string;
  body: string;
  when: string;
  recurrenceRule: RecurrenceRule;
}

const EMPTY_FORM: FormState = { title: "", body: "", when: "", recurrenceRule: "none" };

export function PatientReminderManager() {
  const { patientId } = useParams<{ patientId: string }>();
  const patients = useOutletContext<LinkedPatient[]>();
  const patient = patients?.find((p) => p.patientId === patientId);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [askAiFor, setAskAiFor] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (patientId) remindersApi.list(patientId).then(setReminders);
  }, [patientId]);

  useEffect(() => {
    refresh();
    setFormOpen(false);
    setEditing(null);
  }, [refresh]);

  function openCreateForm() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEditForm(reminder: Reminder) {
    setEditing(reminder);
    setForm({
      title: reminder.title,
      body: reminder.body ?? "",
      when: toDateTimeLocalValue(reminder.dueAt),
      recurrenceRule: reminder.recurrenceRule,
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!patientId || !form.title.trim() || !form.when) return;
    setSubmitting(true);
    try {
      const dueAt = new Date(form.when).toISOString();
      if (editing) {
        await remindersApi.update(editing.id, {
          title: form.title.trim(),
          body: form.body.trim() || undefined,
          dueAt,
          recurrenceRule: form.recurrenceRule,
        });
      } else {
        await remindersApi.create(patientId, {
          title: form.title.trim(),
          body: form.body.trim() || undefined,
          dueAt,
          recurrenceRule: form.recurrenceRule,
        });
      }
      setFormOpen(false);
      refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(reminder: Reminder) {
    await remindersApi.setCompleted(reminder.id, !reminder.completed);
    refresh();
  }

  async function remove(reminder: Reminder) {
    if (!window.confirm(`Delete "${reminder.title}"?`)) return;
    await remindersApi.remove(reminder.id);
    refresh();
  }

  if (!patientId) return null;

  return (
    <div className="manager">
      <div className="manager-header">
        <h1 className="manager-title">{patient?.name ?? "Patient"}'s reminders</h1>
        {!formOpen && <Button onClick={openCreateForm}>New reminder</Button>}
      </div>

      {formOpen && (
        <Card pad="md" className="reminder-form-card">
          <form onSubmit={handleSubmit} className="reminder-form">
            <label className="field">
              <span className="field-label">Title</span>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus />
            </label>
            <label className="field">
              <span className="field-label">Details (optional)</span>
              <Input value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </label>
            <div className="reminder-form-row">
              <label className="field">
                <span className="field-label">Due</span>
                <Input
                  type="datetime-local"
                  value={form.when}
                  onChange={(e) => setForm({ ...form, when: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">Repeats</span>
                <select
                  className="k-input recurrence-select"
                  value={form.recurrenceRule}
                  onChange={(e) => setForm({ ...form, recurrenceRule: e.target.value as RecurrenceRule })}
                >
                  <option value="none">Doesn't repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
            </div>
            <div className="quick-add-actions">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : editing ? "Save changes" : "Create reminder"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="manager-list">
        {reminders.length === 0 && !formOpen && <p className="caregiver-placeholder">No reminders yet.</p>}
        {reminders.map((r) => (
          <Card key={r.id} pad="sm" className="manager-row-wrapper">
            <div className="manager-row">
              <input type="checkbox" checked={r.completed} onChange={() => toggle(r)} />
              <div className="manager-row-text">
                <div className="manager-row-title-line">
                  <span className={r.completed ? "manager-row-title-completed" : "manager-row-title"}>{r.title}</span>
                  {r.recurrenceRule !== "none" && <Badge variant="neutral">{r.recurrenceRule}</Badge>}
                </div>
                {r.body && <span className="manager-row-body">{r.body}</span>}
                <span className="manager-row-due">{formatFriendlyDateTime(r.dueAt)}</span>
              </div>
              <div className="manager-row-actions">
                <Button variant="ghost" size="md" onClick={() => setAskAiFor(askAiFor === r.id ? null : r.id)}>
                  Ask AI
                </Button>
                <Button variant="ghost" size="md" onClick={() => openEditForm(r)}>
                  Edit
                </Button>
                <Button variant="ghost" size="md" onClick={() => remove(r)}>
                  Delete
                </Button>
              </div>
            </div>
            {askAiFor === r.id && <AskAiPanel reminderId={r.id} onClose={() => setAskAiFor(null)} />}
          </Card>
        ))}
      </div>

      <MessageComposer patientId={patientId} />
    </div>
  );
}
