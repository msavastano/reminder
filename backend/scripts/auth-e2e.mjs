/**
 * End-to-end smoke test for the mobile Bearer-token auth path.
 *
 * Exercises the full new flow against a running backend (default
 * http://localhost:4000): login -> token in body -> Bearer /auth/me ->
 * Bearer data fetch -> negative (no token). Also confirms the legacy cookie
 * path still authenticates so the web client is unaffected.
 *
 * Usage: node scripts/auth-e2e.mjs  (start the backend first)
 * Requires the DB to be seeded (npm run prisma:seed) for the login credentials.
 */

const BASE = process.env.API_URL ?? "http://localhost:4000";
const EMAIL = process.env.TEST_EMAIL ?? "patient1@example.com";
const PASSWORD = process.env.TEST_PASSWORD ?? "password123";

let failures = 0;
function check(name, cond, detail = "") {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  console.log(`e2e auth against ${BASE} as ${EMAIL}\n`);

  // 1. Login returns a token in the body (not only Set-Cookie).
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginBody = await loginRes.json();
  check("login → 200", loginRes.status === 200, `got ${loginRes.status}`);
  check("login → token in body", typeof loginBody.token === "string" && loginBody.token.length > 20);
  check("login → user in body", loginBody.user?.email === EMAIL);
  const token = loginBody.token;
  const patientId = loginBody.user?.id;
  const setCookie = loginRes.headers.get("set-cookie") ?? "";

  // 2. Bearer token authenticates /auth/me (the mobile path — no cookie sent).
  const meRes = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meBody = await meRes.json();
  check("Bearer /auth/me → 200", meRes.status === 200, `got ${meRes.status}`);
  check("Bearer /auth/me → correct user", meBody.user?.id === patientId);

  // 3. Bearer token authorizes a real data fetch.
  const remindersRes = await fetch(`${BASE}/patients/${patientId}/reminders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const remindersBody = await remindersRes.json();
  check("Bearer reminders → 200", remindersRes.status === 200, `got ${remindersRes.status}`);
  check("Bearer reminders → array", Array.isArray(remindersBody.reminders));
  check(
    "Bearer reminders → shape",
    remindersBody.reminders?.every((r) => typeof r.id === "string" && typeof r.title === "string"),
  );

  // 4. Negative: no credentials → 401.
  const noAuthRes = await fetch(`${BASE}/auth/me`);
  check("no token → 401", noAuthRes.status === 401, `got ${noAuthRes.status}`);

  // 5. Negative: malformed Bearer token → 401.
  const badRes = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: "Bearer not-a-real-token" },
  });
  check("bad token → 401", badRes.status === 401, `got ${badRes.status}`);

  // 6. Regression: the legacy cookie path still authenticates (web unaffected).
  const cookie = setCookie.split(";")[0];
  check("login → still sets cookie", cookie.startsWith("reminder_token="));
  const cookieMeRes = await fetch(`${BASE}/auth/me`, { headers: { Cookie: cookie } });
  check("cookie /auth/me → 200", cookieMeRes.status === 200, `got ${cookieMeRes.status}`);

  // 7. Register a brand-new account (unique email each run) → 201 + token that
  //    authenticates. Exercises the mobile Register screen's backend path.
  const newEmail = `e2e+${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: newEmail, password: "password123", name: "E2E Tester", role: "PATIENT" }),
  });
  const regBody = await regRes.json();
  check("register → 201", regRes.status === 201, `got ${regRes.status}`);
  check("register → token in body", typeof regBody.token === "string" && regBody.token.length > 20);
  const regMe = await fetch(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${regBody.token}` } });
  check("register token authenticates", regMe.status === 200, `got ${regMe.status}`);

  console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${failures} failing check(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("e2e crashed:", err);
  process.exit(1);
});
