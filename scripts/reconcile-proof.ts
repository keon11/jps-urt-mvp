const phase5=process.argv.includes('--issue-5');if(phase5)process.argv.push('--issue-4');
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import {
  isolatedContext,
  startApi,
  stopApi,
  closeOriginal,
} from "./reliability-context.js";
import { login, fhirClient } from "../services/api/src/adapters.js";
import { demonstrationPassword } from "../tests/browser/local-account.js";
const label = process.argv.includes("--before-repair")
  ? "before-repair"
  : "after-repair";
const c = await isolatedContext();
let child: any;
const result: any = {
  at: new Date().toISOString(),
  label,
  isolatedDatabase: c.dbname,
  threshold:
    "one FHIR Claim resource per logical event after database failure and retry",
};
try {
  child = await startApi(c.dsn, false);
  const token = (await login("reviewer", demonstrationPassword())).access_token;
  const call = async (body: any) => {
    const r = await fetch(
      "http://localhost:3010/api/cases/authorization/authorization",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(body),
      },
    );
    return { status: r.status, data: await r.json() };
  };
  const row = (await c.db.query("SELECT * FROM cases WHERE id='authorization'"))
    .rows[0];
  if (["approved", "partial-approved"].includes(row.workflow.authorization))
    assert.equal(
      (await call({ action: "simulate-expiry", eventId: randomUUID() })).status,
      200,
    );
  const updated = (
    await c.db.query("SELECT * FROM cases WHERE id='authorization'")
  ).rows[0];
  if (updated.workflow.authorization === "submitted")
    throw Error("Unexpected pending test state");
  const client = await fhirClient();
  const params = { patient: "Patient/" + row.patient_id, _count: "1000" };
  const before = await client.searchResources("Claim", params, {
    cache: "no-cache",
  });
  const initialIds = new Set(before.map((r) => r.id));
  const eventId = randomUUID();
  await c.db.query(
    `CREATE OR REPLACE FUNCTION issue2_reconciliation_fault() RETURNS trigger AS $$ BEGIN IF NEW.id='authorization' AND NEW.workflow->'events'->-1->>'eventId'='${eventId}' THEN RAISE EXCEPTION 'injected database failure after external FHIR success';END IF;RETURN NEW;END;$$ LANGUAGE plpgsql;CREATE TRIGGER issue2_reconciliation_fault BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION issue2_reconciliation_fault();`,
  );
  const auditBefore = (await c.db.query("SELECT count(*)::int AS n FROM audit"))
    .rows[0].n;
  const body = { action: "submit", eventId };
  const failures = [await call(body), await call(body)];
  assert(failures.every((r) => r.status === 502));
  assert.equal(
    (await c.db.query("SELECT count(*)::int AS n FROM audit")).rows[0].n,
    auditBefore,
  );
  const after = await client.searchResources("Claim", params, {
    cache: "no-cache",
  });
  const created = after.filter((r) => !initialIds.has(r.id));
  result.failedRequestStatuses = failures.map((r) => r.status);
  result.createdResourceIds = created.map((r) => r.id);
  result.resourceCountAfterTwoFailedAttempts = created.length;
  result.noFalseSuccessAudit = true;
  if (label === "after-repair") {
    const changed = await call({ action: "notify", eventId });
    assert.equal(changed.status, 409);
    result.changedPayloadReplayRejected = true;
  }
  await c.db.query("DROP TRIGGER issue2_reconciliation_fault ON cases");
  const committed = await call(body);
  assert.equal(committed.status, 200);
  assert.equal((await call(body)).data.duplicate, true);
  const final = await client.searchResources("Claim", params, {
    cache: "no-cache",
  });
  result.resourceCountAfterSuccessfulRetry = final.filter(
    (r) => !initialIds.has(r.id),
  ).length;
  result.committedLogicalEvents = (
    await c.db.query("SELECT workflow FROM cases WHERE id='authorization'")
  ).rows[0].workflow.events.filter((e: any) => e.eventId === eventId).length;
  result.passed =
    result.resourceCountAfterTwoFailedAttempts === 1 &&
    result.resourceCountAfterSuccessfulRetry === 1 &&
    result.committedLogicalEvents === 1;
  // Restore the disposable case's state through its normal simulator transition for the next proof run.
  await call({
    action: "payer-response",
    outcome: "denied",
    eventId: randomUUID(),
  });
  if (label === "after-repair")
    assert.equal(
      result.passed,
      true,
      "External side effects duplicated under retry",
    );
  else if (result.passed) throw Error("Baseline fault was not reproduced");
} catch (e) {
  result.error = (e as Error).message;
  result.passed = false;
  process.exitCode = 1;
} finally {
  await c.db
    .query("DROP TRIGGER IF EXISTS issue2_reconciliation_fault ON cases")
    .catch(() => {});
  if (child) await stopApi(child);
  await c.db.end();
  await closeOriginal();
  await writeFile(
    `artifacts/${(process.argv.includes("--issue-3")||process.argv.includes("--issue-4"))?(process.argv.includes("--issue-4")?(phase5?"issue-5":"issue-4"):"issue-3"):"issue-2"}/reconciliation-${label}.json`,
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result, null, 2));
}
