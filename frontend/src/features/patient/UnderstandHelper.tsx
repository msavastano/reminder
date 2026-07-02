import { useEffect, useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { Spinner } from "../../components/Spinner";
import { aiApi } from "../../lib/aiApi";
import { ApiError } from "../../lib/apiClient";
import type { AiReminderSummary } from "../../lib/types";

interface UnderstandHelperProps {
  patientId: string;
  refreshKey: number;
}

export function UnderstandHelper({ patientId, refreshKey }: UnderstandHelperProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<AiReminderSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSummary(null);
    setError(null);
  }, [patientId, refreshKey]);

  async function handleOpen() {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const result = await aiApi.summarizeIncomplete(patientId);
      setSummary(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the AI service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="secondary" size="lg" block onClick={handleOpen} className="understand-trigger">
        Help me understand what I need to do
      </Button>

      {open && (
        <Modal onClose={() => setOpen(false)}>
          <div className="understand-modal">
            <h2 className="understand-modal-title">Here's what's on your list</h2>

            {loading && (
              <div className="understand-modal-loading">
                <Spinner size="md" />
                <span>Working it out for you…</span>
              </div>
            )}

            {!loading && error && <p className="auth-error">{error}</p>}

            {!loading && !error && summary && (
              <div className="understand-modal-body">
                <p className="understand-modal-summary">{summary.summary}</p>
                {summary.steps.length > 0 && (
                  <ol className="understand-modal-steps">
                    {summary.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            <Button size="lg" block onClick={() => setOpen(false)}>
              Got it
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
