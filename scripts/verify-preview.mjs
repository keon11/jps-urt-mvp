import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
async function files(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? files(dir + "/" + e.name) : [dir + "/" + e.name],
      ),
    )
  ).flat();
}
const paths = await files("dist-preview");
const realm = JSON.parse(await readFile("infra/realm.json", "utf8"));
const forbidden = [
  ...realm.users.flatMap((u) =>
    u.credentials.filter((c) => c.type === "password").map((c) => c.value),
  ),
  "BEGIN PRIVATE KEY",
  "BEGIN RSA PRIVATE KEY",
  "ghp_",
  "github_pat_",
];
for (const path of paths) {
  const content = await readFile(path, "utf8");
  for (const value of forbidden)
    assert(!content.includes(value), `Forbidden credential pattern in ${path}`);
  assert(
    !/synthetic-[a-z-]+-local-only/.test(content),
    `Local-only credential in ${path}`,
  );
  assert(!path.endsWith(".map"), "Public source map");
}
const config = JSON.parse(await readFile("vercel.json", "utf8"));
assert.equal(config.outputDirectory, "dist-preview");
assert.equal(config.buildCommand, "npm run build:preview");
assert.equal(config.git.deploymentEnabled.main, false);
assert.equal(config.git.deploymentEnabled["dev/phase-6-submission-acceptance"],true);
assert.equal(config.git.deploymentEnabled["dev/phase-5-performance"],false);
assert(config.ignoreCommand.includes("dev/phase-6-submission-acceptance"));
assert(!config.rewrites, "No backend rewrites allowed");
assert(!config.functions, "No backend deployment allowed");
const snapshot = JSON.parse(
  await readFile("apps/web/src/preview-data.json", "utf8"),
);
assert.equal(snapshot.cases.length, 6);
assert.equal(snapshot.reports.total, snapshot.cases.length);
for (const c of snapshot.cases) {
  assert(c.label.endsWith("Fictional"));
  for (const e of c.bundle.entry)
    assert(
      e.resource.meta.tag.some(
        (t) =>
          t.system === "urn:ur-demo:data-classification" &&
          t.code === "synthetic",
      ),
    );
}
assert(snapshot.policyCenter.documents.every(d=>d.synthetic),'Official policy text must not be bundled');
assert(Object.values(snapshot.policyCenter.roles).every(v=>v===false),'Fixture governance must be read only');
assert.equal(Object.keys(snapshot.authorizationReviews).length,6);
console.log(
  `PASS: ${paths.length} preview artifacts scanned; no embedded demo credentials/source maps; static-only config; six marked fictional cases; snapshot counts match.`,
);
