/**
 * End-to-end smoke test for the AI endpoints' auth wiring over Bearer. The
 * "get latest evaluation" path does NOT call Gemini, so it is fully verifiable
 * without a key. Generating a new evaluation / a non-empty summary DOES need a
 * real GEMINI_API_KEY; with the placeholder key those return 502, which we
 * assert as "reachable + authorized" (not 401/403) and flag NEEDS-GEMINI-KEY.
 *
 * Usage: node scripts/ai-e2e.mjs  (backend running + DB seeded)
 */

const BASE = process.env.API_URL ?? "http://localhost:4000";
const CAREGIVER = { email: "caregiver@example.com", password: "password123" };

let failures = 0;
function check(name, cond, detail = "") {
  if (cond) console.log(`  ok   ${name}`);
  else {
    failures += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function login(creds) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds),
  });
  return (await res.json()).token;
}

async function req(token, path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  return { status: res.status, body: isJson ? await res.json() : null };
}

async function main() {
  console.log(`e2e AI wiring (Bearer) against ${BASE}\n`);

  const token = await login(CAREGIVER);
  check("caregiver login → token", typeof token === "string");

  const patients = await req(token, "/caregiver/patients");
  const patient = (patients.body?.patients ?? []).find((p) => p.status === "ACCEPTED");
  check("has an accepted patient", !!patient);
  if (!patient) return finish();

  const reminders = await req(token, `/patients/${patient.patientId}/reminders`);
  const reminder = (reminders.body?.reminders ?? [])[0];
  check("patient has a reminder", !!reminder);
  if (!reminder) return finish();

  // getLatest — no Gemini call; returns 200 + null (or a prior evaluation).
  const latest = await req(token, `/ai/evaluations/${reminder.id}`);
  check("get latest evaluation → 200", latest.status === 200, `got ${latest.status}`);
  check("evaluation key present", latest.body && "evaluation" in latest.body);

  // Unauthorized access is rejected.
  const noAuth = await req(null, `/ai/evaluations/${reminder.id}`);
  check("no token → 401", noAuth.status === 401, `got ${noAuth.status}`);

  // evaluate + summary are reachable & authorized; 201/200 with a real key,
  // 502 with the placeholder key. Either proves auth wiring; only 401/403 fails.
  const evaluate = await req(token, "/ai/evaluate-reminder", {
    method: "POST",
    body: JSON.stringify({ reminderId: reminder.id }),
  });
  check(
    "evaluate reachable+authorized (201 or 502)",
    [201, 502].includes(evaluate.status),
    `got ${evaluate.status}`,
  );
  if (evaluate.status === 502) console.log("       ↳ NEEDS-GEMINI-KEY: evaluate needs a real GEMINI_API_KEY");

  const summary = await req(token, `/patients/${patient.patientId}/ai/reminders-summary`, { method: "POST" });
  check(
    "summary reachable+authorized (200 or 502)",
    [200, 502].includes(summary.status),
    `got ${summary.status}`,
  );
  if (summary.status === 502) console.log("       ↳ NEEDS-GEMINI-KEY: summary needs a real GEMINI_API_KEY");

  finish();
}

function finish() {
  console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${failures} failing check(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("e2e crashed:", err);
  process.exit(1);
});
