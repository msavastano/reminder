import { useEffect, useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Spinner } from "../../components/Spinner";
import { remindersApi } from "../../lib/remindersApi";
import { formatFriendlyDateTime } from "../../lib/dateFormat";
import type { Reminder } from "../../lib/types";

interface CurrentReminderHeroProps {
  patientId: string;
  refreshKey: number;
  onCompleted: () => void;
}

export function CurrentReminderHero({ patientId, refreshKey, onCompleted }: CurrentReminderHeroProps) {
  const [reminder, setReminder] = useState<Reminder | null | undefined>(undefined);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    remindersApi.current(patientId).then((r) => {
      if (!cancelled) setReminder(r);
    });
    return () => {
      cancelled = true;
    };
  }, [patientId, refreshKey]);

  async function handleComplete() {
    if (!reminder) return;
    setCompleting(true);
    try {
      await remindersApi.setCompleted(reminder.id, true);
      onCompleted();
    } finally {
      setCompleting(false);
    }
  }

  if (reminder === undefined) {
    return (
      <Card className="hero-card" pad="lg">
        <div className="hero-loading">
          <Spinner size="md" />
          <span>Loading your reminder…</span>
        </div>
      </Card>
    );
  }

  if (reminder === null) {
    return (
      <Card className="hero-card hero-empty" pad="lg">
        <div className="hero-empty-tile" aria-hidden="true">
          ✓
        </div>
        <h1 className="hero-empty-title">Nothing due right now</h1>
        <p className="hero-empty-subtitle">You're all caught up.</p>
      </Card>
    );
  }

  return (
    <Card className="hero-card" pad="lg">
      <div className="hero-due">{formatFriendlyDateTime(reminder.dueAt)}</div>
      <h1 className="hero-title">{reminder.title}</h1>
      {reminder.body && <p className="hero-body">{reminder.body}</p>}
      <Button size="xl" block onClick={handleComplete} disabled={completing}>
        {completing ? "Marking done…" : "Mark complete"}
      </Button>
    </Card>
  );
}
