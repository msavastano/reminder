import { useState, type FormEvent } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { remindersApi } from "../../lib/remindersApi";

interface ReminderQuickAddProps {
  patientId: string;
  onAdded: () => void;
}

export function ReminderQuickAdd({ patientId, onAdded }: ReminderQuickAddProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !when) return;
    setSubmitting(true);
    try {
      await remindersApi.create(patientId, { title: title.trim(), dueAt: new Date(when).toISOString() });
      setTitle("");
      setWhen("");
      setOpen(false);
      onAdded();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" size="lg" onClick={() => setOpen(true)} className="quick-add-trigger">
        + Add a reminder
      </Button>
    );
  }

  return (
    <Card surface="sunken" pad="sm" className="quick-add-card">
      <form onSubmit={handleSubmit} className="quick-add-form">
        <Input
          inputSize="lg"
          placeholder="What do you need to remember?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <Input inputSize="lg" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        <div className="quick-add-actions">
          <Button type="submit" size="lg" disabled={submitting || !title.trim() || !when}>
            {submitting ? "Adding…" : "Add"}
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
