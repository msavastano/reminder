/**
 * End-to-end smoke test for the caregiver<->patient linking + invite contract
 * the mobile client uses, over Bearer auth: caregiver invites a patient, patient
 * accepts; then a second invite is declined. Idempotent — unlinks up front and
 * cleans up after, so it can run repeatedly against the seeded DB.
 *
 * Usage: node scripts/links-e2e.mjs  (backend running + DB seeded)
 */

const BASE = process.env.API_URL ?? "http://localhost:4000";
// caregiver2 (Priya) is seeded linked to patient1 only, so patient2 is a clean target.
const CAREGIVER = { email: "caregiver2@example.com", password: "password123" };
const PATIENT = { email: "patient2@example.com", password: "password123" };

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
  console.log(`e2e linking/invites (Bearer) against ${BASE}\n`);

  const caregiverToken = await login(CAREGIVER);
  const patientToken = await login(PATIENT);
  check("logins → tokens", !!caregiverToken && !!patientToken);

  // Clean slate: remove any pre-existing link from a prior run.
  const patientId = (await req(patientToken, "/auth/me")).body?.user?.id;
  await req(caregiverToken, `/caregiver/patients/${patientId}/link`, { method: "DELETE" });

  // 1. Invite -> PENDING.
  const invited = await req(caregiverToken, "/caregiver/patients/link", {
    method: "POST",
    body: JSON.stringify({ patientEmail: PATIENT.email }),
  });
  check("invite → 201", invited.status === 201, `got ${invited.status}`);
  check("invite is PENDING", invited.body?.patient?.status === "PENDING");

  // 2. Patient sees the pending invite.
  const invites1 = await req(patientToken, "/patient/invites");
  const invite = (invites1.body?.invites ?? []).find((i) => i.caregiverEmail === CAREGIVER.email);
  check("patient sees invite", !!invite);

  // 3. Accept -> now an accepted caregiver.
  const accepted = await req(patientToken, `/patient/invites/${invite.inviteId}/accept`, { method: "POST" });
  check("accept → 200", accepted.status === 200, `got ${accepted.status}`);
  const caregivers = await req(patientToken, "/patient/caregivers");
  check(
    "caregiver now linked",
    (caregivers.body?.caregivers ?? []).some((c) => c.email === CAREGIVER.email),
  );

  // 4. Caregiver can now see the accepted patient.
  const patients = await req(caregiverToken, "/caregiver/patients");
  const linked = (patients.body?.patients ?? []).find((p) => p.patientId === patientId);
  check("caregiver sees accepted patient", linked?.status === "ACCEPTED");

  // 5. Unlink, then re-invite and decline.
  const unlink = await req(caregiverToken, `/caregiver/patients/${patientId}/link`, { method: "DELETE" });
  check("unlink → 204", unlink.status === 204, `got ${unlink.status}`);

  await req(caregiverToken, "/caregiver/patients/link", {
    method: "POST",
    body: JSON.stringify({ patientEmail: PATIENT.email }),
  });
  const invites2 = await req(patientToken, "/patient/invites");
  const invite2 = (invites2.body?.invites ?? []).find((i) => i.caregiverEmail === CAREGIVER.email);
  check("re-invited (pending again)", !!invite2);

  const declined = await req(patientToken, `/patient/invites/${invite2.inviteId}/decline`, { method: "POST" });
  check("decline → 204", declined.status === 204, `got ${declined.status}`);
  const invites3 = await req(patientToken, "/patient/invites");
  check(
    "invite gone after decline",
    !(invites3.body?.invites ?? []).some((i) => i.caregiverEmail === CAREGIVER.email),
  );

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
