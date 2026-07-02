import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/apiClient";
import type { Role } from "../lib/types";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Input } from "../components/Input";

export function RegisterPage() {
  const { user, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("PATIENT");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={user.role === "PATIENT" ? "/patient" : "/caregiver"} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, name, role);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <Card className="auth-card" pad="lg">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join Reminder</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span className="field-label">Your name</span>
            <Input type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Email</span>
            <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <div className="field">
            <span className="field-label">I am a…</span>
            <div className="role-toggle">
              <button
                type="button"
                className={`role-option ${role === "PATIENT" ? "role-option-active" : ""}`}
                onClick={() => setRole("PATIENT")}
              >
                Patient
              </button>
              <button
                type="button"
                className={`role-option ${role === "CAREGIVER" ? "role-option-active" : ""}`}
                onClick={() => setRole("CAREGIVER")}
              >
                Caregiver
              </button>
            </div>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <Button type="submit" block disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
