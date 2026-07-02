import { useCallback, useEffect, useState, type FormEvent } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { caregiverApi } from "../../lib/caregiverApi";
import { ApiError } from "../../lib/apiClient";
import type { LinkedPatient } from "../../lib/types";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";

export function CaregiverShell() {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(() => {
    caregiverApi.listPatients().then(setPatients);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAddPatient(e: FormEvent) {
    e.preventDefault();
    setAddError(null);
    setSubmitting(true);
    try {
      await caregiverApi.invitePatient(email.trim());
      setEmail("");
      setAddOpen(false);
      refresh();
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : "Could not invite that patient.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="caregiver-shell">
      <aside className="caregiver-rail">
        <div className="caregiver-rail-header">Reminder</div>
        <nav className="patient-rail-list">
          {patients.map((p) =>
            p.status === "ACCEPTED" ? (
              <NavLink
                key={p.patientId}
                to={`/caregiver/${p.patientId}`}
                className={({ isActive }) => `patient-rail-item ${isActive ? "patient-rail-item-active" : ""}`}
              >
                <span className="patient-rail-avatar">{p.name.charAt(0)}</span>
                <span className="patient-rail-name">{p.name}</span>
              </NavLink>
            ) : (
              <div key={p.patientId} className="patient-rail-item patient-rail-item-pending" title="Waiting for the patient to accept your invite">
                <span className="patient-rail-avatar">{p.name.charAt(0)}</span>
                <span className="patient-rail-name">{p.name}</span>
                <span className="patient-rail-status">Invited</span>
              </div>
            ),
          )}
        </nav>

        {addOpen ? (
          <form className="add-patient-form" onSubmit={handleAddPatient}>
            <Input
              type="email"
              placeholder="patient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
            {addError && <p className="auth-error">{addError}</p>}
            <div className="quick-add-actions">
              <Button type="submit" size="md" disabled={submitting}>
                {submitting ? "Inviting…" : "Invite"}
              </Button>
              <Button type="button" variant="ghost" size="md" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <button className="add-patient-trigger" onClick={() => setAddOpen(true)}>
            + Invite patient
          </button>
        )}

        <div className="caregiver-rail-footer">
          <span>{user?.name}</span>
          <button className="link-button" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="caregiver-main">
        <Outlet context={patients} />
      </main>
    </div>
  );
}
