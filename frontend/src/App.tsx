import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { RootRedirect } from "./pages/RootRedirect";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PatientShell } from "./features/patient/PatientShell";
import { CaregiverShell } from "./features/caregiver/CaregiverShell";
import { CaregiverHome } from "./features/caregiver/CaregiverHome";
import { PatientReminderManager } from "./features/caregiver/PatientReminderManager";

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/patient"
        element={
          <ProtectedRoute role="PATIENT">
            <PatientShell />
          </ProtectedRoute>
        }
      />
      <Route
        path="/caregiver"
        element={
          <ProtectedRoute role="CAREGIVER">
            <CaregiverShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<CaregiverHome />} />
        <Route path=":patientId" element={<PatientReminderManager />} />
      </Route>
    </Routes>
  );
}

export default App;
