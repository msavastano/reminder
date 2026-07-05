/**
 * End-to-end smoke test for the reminder CRUD contract the mobile client uses,
 * all over Bearer auth (no cookies). Mirrors the caregiver flow: log in, find an
 * accepted patient, create -> complete -> delete a reminder for them.
 *
 * Usage: node scripts/reminders-e2e.mjs  (backend running + DB seeded)
 */

const BASE = process.env.API_URL ?? "http://localhost:4000";
const EMAIL = process.env.TEST_EMAIL ?? "caregiver@example.com";
const PASSWORD = process.env.TEST_PASSWORD ?? "password123";

let failures = 0;
function check(name, cond, detail = "") {
  if (cond) console.log(`  ok   ${name}`);
  else {
    failures += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function bearer(token, path, options = {}) {
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
  console.log(`e2e reminder CRUD (Bearer) against ${BASE} as ${EMAIL}\n`);

  const login = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginBody = await login.json();
  const token = loginBody.token;
  check("caregiver login → token", typeof token === "string");

  const patients = await bearer(token, "/caregiver/patients");
  check("list patients → 200", patients.status === 200, `got ${patients.status}`);
  const accepted = (patients.body?.patients ?? []).find((p) => p.status === "ACCEPTED");
  check("has an accepted patient", !!accepted);
  if (!accepted) return finish();
  const patientId = accepted.patientId;

  const before = await bearer(token, `/patients/${patientId}/reminders`);
  const beforeCount = before.body?.reminders?.length ?? 0;

  // Create
  const created = await bearer(token, `/patients/${patientId}/reminders`, {
    method: "POST",
    body: JSON.stringify({ title: "e2e test reminder", dueAt: new Date(Date.now() + 3600_000).toISOString() }),
  });
  check("create reminder → 201", created.status === 201, `got ${created.status}`);
  const reminderId = created.body?.reminder?.id;
  check("created reminder has id", typeof reminderId === "string");

  const afterCreate = await bearer(token, `/patients/${patientId}/reminders`);
  check("list grew by 1", (afterCreate.body?.reminders?.length ?? 0) === beforeCount + 1);

  // Complete
  const completed = await bearer(token, `/reminders/${reminderId}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ completed: true }),
  });
  check("complete → 200", completed.status === 200, `got ${completed.status}`);
  check("completed flag set", completed.body?.reminder?.completed === true);

  // Delete
  const del = await bearer(token, `/reminders/${reminderId}`, { method: "DELETE" });
  check("delete → 204", del.status === 204, `got ${del.status}`);

  const afterDelete = await bearer(token, `/patients/${patientId}/reminders`);
  check("list back to original size", (afterDelete.body?.reminders?.length ?? 0) === beforeCount);

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
