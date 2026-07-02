import { useCallback, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { CurrentReminderHero } from "./CurrentReminderHero";
import { ReminderQuickAdd } from "./ReminderQuickAdd";
import { ReminderSearchList } from "./ReminderSearchList";
import { MessagesPanel } from "./MessagesPanel";
import { UnderstandHelper } from "./UnderstandHelper";
import { Drawer } from "../../components/Drawer";

type PatientSection = "reminders" | "messages";

export function PatientShell() {
  const { user, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [section, setSection] = useState<PatientSection>("reminders");

  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);

  if (!user) return null;

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
