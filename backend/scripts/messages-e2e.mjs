/**
 * End-to-end smoke test for the messaging contract the mobile client uses, over
 * Bearer auth. Caregiver sends a message; the patient lists it (unread) and
 * marks it read. Also checks that a patient cannot send (403).
 *
 * Usage: node scripts/messages-e2e.mjs  (backend running + DB seeded)
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
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  return { status: res.status, body: isJson ? await res.json() : null };
}

async function main() {
  console.log(`e2e messaging (Bearer) against ${BASE}\n`);

  const caregiverToken = await login(CAREGIVER);
  check("caregiver login → token", typeof caregiverToken === "string");

  const patients = await req(caregiverToken, "/caregiver/patients");
  const patient = (patients.body?.patients ?? []).find((p) => p.status === "ACCEPTED");
  check("has an accepted patient", !!patient);
  if (!patient) return finish();

  const marker = `e2e ${Date.now()}`;
  const sent = await req(caregiverToken, `/patients/${patient.patientId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body: marker }),
  });
  check("caregiver send → 201", sent.status === 201, `got ${sent.status}`);
  const messageId = sent.body?.message?.id;
  check("sent message unread", sent.body?.message?.readAt == null);

  // Patient logs in with the email returned by the caregiver's patient list.
  const patientToken = await login({ email: patient.email, password: "password123" });
  check("patient login → token", typeof patientToken === "string");

  const inbox = await req(patientToken, `/patients/${patient.patientId}/messages`);
  check("patient list → 200", inbox.status === 200, `got ${inbox.status}`);
  const found = (inbox.body?.messages ?? []).find((m) => m.id === messageId);
  check("patient sees the message", !!found && found.body === marker);

  const read = await req(patientToken, `/messages/${messageId}/read`, { method: "PATCH" });
  check("patient mark read → 200", read.status === 200, `got ${read.status}`);
  check("readAt is set", !!read.body?.message?.readAt);

  // Negative: patients cannot send messages (only caregivers).
  const forbidden = await req(patientToken, `/patients/${patient.patientId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body: "should be rejected" }),
  });
  check("patient send → 403", forbidden.status === 403, `got ${forbidden.status}`);

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
