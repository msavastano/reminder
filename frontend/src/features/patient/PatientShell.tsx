import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { CurrentReminderHero } from "./CurrentReminderHero";
import { ReminderQuickAdd } from "./ReminderQuickAdd";
import { ReminderSearchList } from "./ReminderSearchList";
import { MessagesPanel } from "./MessagesPanel";
import { UnderstandHelper } from "./UnderstandHelper";
import { Drawer } from "../../components/Drawer";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Spinner } from "../../components/Spinner";
import { patientLinksApi } from "../../lib/caregiverApi";
import type { CaregiverInvite, LinkedCaregiver } from "../../lib/types";

type PatientSection = "reminders" | "messages";

export function PatientShell() {
  const { user, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [section, setSection] = useState<PatientSection>("reminders");
  const [caregivers, setCaregivers] = useState<LinkedCaregiver[] | undefined>(undefined);
  const [invites, setInvites] = useState<CaregiverInvite[]>([]);
  const [answering, setAnswering] = useState<string | null>(null);

  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);

  const refreshLinks = useCallback(() => {
    Promise.all([patientLinksApi.listCaregivers(), patientLinksApi.listInvites()]).then(([cg, inv]) => {
      setCaregivers(cg);
      setInvites(inv);
    });
  }, []);

  useEffect(() => {
    refreshLinks();
  }, [refreshLinks]);

  async function answerInvite(invite: CaregiverInvite, accept: boolean) {
    setAnswering(invite.inviteId);
    try {
      if (accept) {
        await patientLinksApi.acceptInvite(invite.inviteId);
      } else {
        await patientLinksApi.declineInvite(invite.inviteId);
      }
      refreshLinks();
      bump();
    } finally {
      setAnswering(null);
    }
  }

  if (!user) return null;

  if (caregivers === undefined) {
    return (
      <div className="patient-shell">
        <div className="onboarding-loading">
          <Spinner size="md" />
        </div>
      </div>
    );
  }

  // Onboarding gate: the patient experience starts once a caregiver invite is accepted.
  if (caregivers.length === 0) {
    return (
      <div className="patient-shell">
        <div className="patient-topbar">
          <span className="patient-greeting">Hi, {user.name.split(" ")[0]}</span>
          <button className="link-button" onClick={() => logout()}>
            Sign out
          </button>
        </div>
        <div className="onboarding-body">
          <Card className="onboarding-card" pad="lg">
            <div className="onboarding-tile" aria-hidden="true">
              💌
            </div>
            <h1 className="onboarding-title">Your account is ready</h1>
            {invites.length === 0 ? (
              <p className="onboarding-subtitle">
                A caregiver needs to invite you before your reminders begin. Ask your caregiver to add{" "}
                <strong>{user.email}</strong> in their Reminder app — your invite will show up right here.
              </p>
            ) : (
              <p className="onboarding-subtitle">You have an invite! Accept it to get started.</p>
            )}
            {invites.map((inv) => (
              <div key={inv.inviteId} className="invite-row">
                <div className="invite-row-text">
                  <span className="invite-row-name">{inv.caregiverName}</span>
                  <span className="invite-row-email">{inv.caregiverEmail}</span>
                </div>
                <div className="invite-row-actions">
                  <Button size="md" onClick={() => answerInvite(inv, true)} disabled={answering === inv.inviteId}>
                    Accept
                  </Button>
                  <Button
                    size="md"
                    variant="ghost"
                    onClick={() => answerInvite(inv, false)}
                    disabled={answering === inv.inviteId}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-shell">
      <div className="patient-topbar">
        <span className="patient-greeting">Hi, {user.name.split(" ")[0]}</span>
        <button className="link-button" onClick={() => logout()}>
          Sign out
        </button>
      </div>

      <div className="patient-body">
        <nav className="patient-nav" aria-label="Patient sections">
          <button
            className={`patient-nav-item ${section === "reminders" ? "patient-nav-item-active" : ""}`}
            aria-current={section === "reminders" ? "page" : undefined}
            onClick={() => setSection("reminders")}
          >
            <span className="patient-nav-icon" aria-hidden="true">
              📋
            </span>
            <span className="patient-nav-label">Reminders</span>
          </button>
          <button
            className={`patient-nav-item ${section === "messages" ? "patient-nav-item-active" : ""}`}
            aria-current={section === "messages" ? "page" : undefined}
            onClick={() => setSection("messages")}
          >
            <span className="patient-nav-icon" aria-hidden="true">
              💬
            </span>
            <span className="patient-nav-label">Messages</span>
          </button>
        </nav>

        <main className="patient-content">
          <div className="patient-column">
            {invites.map((inv) => (
              <div key={inv.inviteId} className="invite-banner">
                <span className="invite-banner-text">
                  <strong>{inv.caregiverName}</strong> would like to be one of your caregivers.
                </span>
                <div className="invite-row-actions">
                  <Button size="md" onClick={() => answerInvite(inv, true)} disabled={answering === inv.inviteId}>
                    Accept
                  </Button>
                  <Button
                    size="md"
                    variant="ghost"
                    onClick={() => answerInvite(inv, false)}
                    disabled={answering === inv.inviteId}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
            <CurrentReminderHero patientId={user.id} refreshKey={refreshKey} onCompleted={bump} />
            <UnderstandHelper patientId={user.id} refreshKey={refreshKey} />
            <div className="patient-secondary">
              <ReminderSearchList patientId={user.id} refreshKey={refreshKey} onChanged={bump} />
              <ReminderQuickAdd patientId={user.id} onAdded={bump} />
            </div>
          </div>
        </main>
      </div>

      <Drawer open={section === "messages"} onClose={() => setSection("reminders")}>
        <div className="messages-drawer-header">
          <h2 className="messages-drawer-title">Messages</h2>
          <button className="link-button" onClick={() => setSection("reminders")}>
            Close
          </button>
        </div>
        <MessagesPanel patientId={user.id} refreshKey={refreshKey} />
      </Drawer>
    </div>
  );
}
