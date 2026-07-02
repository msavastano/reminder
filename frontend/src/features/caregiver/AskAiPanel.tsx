import { useEffect, useState } from "react";
import { Button } from "../../components/Button";
import { Spinner } from "../../components/Spinner";
import { Badge } from "../../components/Badge";
import { aiApi } from "../../lib/aiApi";
import { ApiError } from "../../lib/apiClient";
import type { AiEvaluation } from "../../lib/types";

interface AskAiPanelProps {
  reminderId: string;
  onClose: () => void;
}

export function AskAiPanel({ reminderId, onClose }: AskAiPanelProps) {
  const [evaluation, setEvaluation] = useState<AiEvaluation | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    aiApi.getLatest(reminderId).then(setEvaluation);
  }, [reminderId]);

  async function runEvaluation() {
    setLoading(true);
    setError(null);
    try {
      const result = await aiApi.evaluate(reminderId);
      setEvaluation(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the AI service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ask-ai-panel">
      <div className="ask-ai-header">
        <span className="ask-ai-title">AI reminder check</span>
        <button className="link-button" onClick={onClose}>
          Close
        </button>
      </div>

      {loading && (
        <div className="ask-ai-loading">
          <Spinner size="sm" />
          <span>Asking Gemini…</span>
        </div>
      )}

      {!loading && error && <p className="auth-error">{error}</p>}

      {!loading && !error && evaluation === undefined && <p className="caregiver-placeholder">Checking for a previous result…</p>}

      {!loading && !error && evaluation === null && (
        <p className="caregiver-placeholder">No AI check has been run for this reminder yet.</p>
      )}

      {!loading && !error && evaluation && (
        <div className="ask-ai-result">
          <div className="ask-ai-field">
            <span className="ask-ai-field-label">Clarity</span>
            <p className="ask-ai-field-value">{evaluation.result.clarity}</p>
          </div>
          {evaluation.result.couldConfusePatient && <Badge variant="warning">Could confuse the patient</Badge>}
          <div className="ask-ai-field">
            <span className="ask-ai-field-label">Simplified wording</span>
            <p className="ask-ai-field-value">{evaluation.result.simplifiedText}</p>
          </div>
          <div className="ask-ai-field">
            <span className="ask-ai-field-label">Scheduling notes</span>
            <p className="ask-ai-field-value">{evaluation.result.conflictNotes}</p>
          </div>
          <span className="ask-ai-meta">
            Checked {new Date(evaluation.createdAt).toLocaleString()} · {evaluation.modelName}
          </span>
        </div>
      )}

      <Button variant="secondary" size="md" onClick={runEvaluation} disabled={loading}>
        {evaluation ? "Re-check with AI" : "Check with AI"}
      </Button>
    </div>
  );
}
