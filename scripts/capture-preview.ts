import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { login } from "../services/api/src/adapters.js";
import { demonstrationPassword } from "../tests/browser/local-account.js";
const t = (await login("admin", demonstrationPassword("admin"))).access_token;
async function get(path: string) {
  const r = await fetch("http://localhost:3000/api" + path, {
    headers: { Authorization: "Bearer " + t },
  });
  if (!r.ok) throw Error("Snapshot endpoint failed: " + path);
  return r.json();
}
const cases = await get("/cases");
assert.equal(cases.length, 6);
for (const c of cases) {
  assert(c.label.endsWith("Fictional"));
  assert(
    c.bundle.entry.every((e: any) =>
      e.resource.meta.tag.some(
        (t: any) =>
          t.system === "urn:ur-demo:data-classification" &&
          t.code === "synthetic",
      ),
    ),
  );
}
const policyCenter = await get("/policy-center");
policyCenter.documents = policyCenter.documents.filter((d: any) => d.synthetic);
policyCenter.changes = policyCenter.changes.slice(0, 5);
policyCenter.publications = policyCenter.publications.slice(0, 5);
policyCenter.roles = {
  clerk: false,
  supervisor: false,
  clinicalAuthority: false,
  publisher: false,
};
policyCenter.authorityNote =
  "Read-only fictional snapshot. Live governance, sign-in and clinical approvals require the separate local backend; no clinical validation is claimed.";
const trim = (e: any) =>
  e.action === "synthetic-demo-reset"
    ? {
        ...e,
        detail: {
          restoredFixture: e.case_id,
          note: "Full historical reset details remain in the local audit store.",
        },
      }
    : e;
const snapshot = {
  capturedAt: new Date().toISOString(),
  cases,
  reports: await get("/reports"),
  audit: (await get("/audit")).slice(0, 20).map(trim),
  caseAudits: Object.fromEntries(
    await Promise.all(
      cases.map(async (c: any) => [
        c.id,
        (await get("/cases/" + c.id + "/audit")).slice(-8).map(trim),
      ]),
    ),
  ),
  authorizationReviews: Object.fromEntries(
    await Promise.all(
      cases.map(async (c: any) => [
        c.id,
        await get("/cases/" + c.id + "/authorization-review"),
      ]),
    ),
  ),
  policyCenter,
};
const serialized = JSON.stringify(snapshot, null, 2) + "\n";
assert(!serialized.includes(demonstrationPassword()));
assert(
  !/access_token|refresh_token|BEGIN PRIVATE KEY|synthetic-[a-z-]+-local-only/.test(
    serialized,
  ),
);
await writeFile("apps/web/src/preview-data.json", serialized);
console.log(
  "Captured six classified fictional cases and read-only synthetic policy/authorization evidence; no credential values.",
);
