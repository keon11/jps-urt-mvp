import React, { useEffect, useState } from "react";
type Request = (url: string, body?: unknown) => Promise<any>;
type Props = { request: Request; roles: string[]; preview: boolean };
const labels: Record<string, string> = {
  "request-approval": "Request Approval",
  "verify-evidence": "Verify evidence",
  "analyze-conflicts": "Analyze conflicts",
  "run-tests": "Test candidate",
  "supervisor-approve": "Supervisor approval",
  approve: "Approve",
  reject: "Reject",
  "request-evidence": "Request more evidence",
  publish: "Publish approved version",
  rollback: "Roll back publication",
};
export function PolicyCenter({ request, roles, preview }: Props) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [reason, setReason] = useState("documentation-requirement-update");
  const refresh = () => request("/policy-center").then(setData);
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, [preview]);
  async function act(fn: () => Promise<any>, message: string) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await fn();
      await refresh();
      setNotice(message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <div
        role={error ? "alert" : "status"}
        className={error ? "error" : "callout"}
      >
        {error || "Loading policy evidence and governance state…"}
      </div>
    );
  const active = data.documents.find(
    (d: any) => d.id === data.registry.active_document,
  );
  const actions = (c: any) => {
    const list: string[] = [];
    if (data.roles.clerk && c.state === "draft") list.push("request-approval");
    if (data.roles.supervisor) {
      if (c.state === "evidence-verification") list.push("verify-evidence");
      if (c.state === "conflict-analysis") list.push("analyze-conflicts");
      if (c.state === "testing") list.push("run-tests");
      if (c.state === "authorized-approval" && !c.supervisor)
        list.push("supervisor-approve");
    }
    if (
      data.roles.clinicalAuthority &&
      c.state === "authorized-approval" &&
      c.supervisor
    )
      list.push("approve");
    if (data.roles.publisher && c.state === "approved") list.push("publish");
    if (data.roles.publisher && c.state === "monitoring") list.push("rollback");
    if (
      (data.roles.supervisor || data.roles.clinicalAuthority) &&
      !["monitoring", "rolled-back", "rejected"].includes(c.state)
    )
      list.push("reject");
    if (
      (data.roles.supervisor || data.roles.clinicalAuthority) &&
      !["draft", "monitoring", "rolled-back", "rejected"].includes(c.state)
    )
      list.push("request-evidence");
    return list;
  };
  return (
    <div className="policy-center" aria-busy={busy}>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Policy Management Center</h2>
            <p>
              Synthetic rules only · evidence verification and independent human
              approvals
            </p>
          </div>
          <button
            disabled={busy}
            onClick={() => act(refresh, "Policy state refreshed")}
          >
            Refresh policies
          </button>
        </div>
        <div className="detail-body">
          {error && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="notice">
              {notice}
            </div>
          )}
          <div className="policy-status">
            <strong>Active: {active.id}</strong>
            <span>Effective {active.effectiveDate}</span>
            <span>Revision {data.registry.revision}</span>
            <span>
              {data.registry.suspended
                ? "SUSPENDED — no approvals permitted"
                : "Monitoring · illustrative, unvalidated"}
            </span>
          </div>
          <p>{data.authorityNote}</p>
          <p>
            Published requirements:{" "}
            {active.rules.map((r: any) => r.code).join(", ")}. Pending requests
            never affect active evaluations.
          </p>
          {(data.roles.publisher || data.roles.clinicalAuthority) && (
            <button
              disabled={busy || data.registry.suspended}
              onClick={() =>
                act(
                  () =>
                    request("/policy-suspension", {
                      eventId: crypto.randomUUID(),
                      expectedRevision: data.registry.revision,
                    }),
                  "Rule suspended for authorized review",
                )
              }
            >
              Flag and suspend active rule
            </button>
          )}
        </div>
      </section>
      <div className="two-col policy-columns">
        <section className="panel">
          <div className="panel-heading">
            <h2>Evidence and version comparison</h2>
          </div>
          <div className="detail-body">
            {data.documents
              .filter((d: any) => d.synthetic)
              .map((d: any) => (
                <details key={d.id} open>
                  <summary>{d.title}</summary>
                  <dl>
                    <dt>Source</dt>
                    <dd>{d.sourceUrl}</dd>
                    <dt>Published</dt>
                    <dd>{d.publishedDate}</dd>
                    <dt>Effective</dt>
                    <dd>{d.effectiveDate}</dd>
                    <dt>SHA-256</dt>
                    <dd className="mono">{d.sourceHash}</dd>
                    <dt>Extraction</dt>
                    <dd>
                      {d.provenance.extractor} {d.provenance.version}
                    </dd>
                  </dl>
                  {d.rules.map((r: any) => (
                    <blockquote key={r.code}>
                      <strong>{r.code}</strong>
                      <p>{r.citation.quote}</p>
                      <small>
                        Source selector: {r.citation.selector} · illustrative
                        candidate
                      </small>
                    </blockquote>
                  ))}
                </details>
              ))}
            <h3>Proposed revision difference</h3>
            <p className="policy-diff">
              {data.diff.textDiff.map((d: any, i: number) =>
                d.added ? (
                  <ins key={i}>{d.value}</ins>
                ) : d.removed ? (
                  <del key={i}>{d.value}</del>
                ) : (
                  <span key={i}>{d.value}</span>
                ),
              )}
            </p>
            <p>
              Official-source context:{" "}
              {data.documents.filter((d: any) => !d.synthetic).length} cached
              page(s). No authentic official revision or executable official
              criterion is claimed.
            </p>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Correction requests and approvals</h2>
          </div>
          <div className="detail-body">
            {data.roles.clerk && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  act(
                    () =>
                      request("/policy-changes", {
                        documentId:
                          active.id === "synthetic-1"
                            ? "synthetic-2"
                            : "synthetic-1",
                        reason,
                        eventId: crypto.randomUUID(),
                      }),
                    "Draft correction created with source evidence",
                  );
                }}
              >
                <label>
                  Correction reason
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    <option value="documentation-requirement-update">
                      Documentation requirement update
                    </option>
                    <option value="suspected-policy-error">
                      Suspected policy error
                    </option>
                  </select>
                </label>
                <p>
                  Attach the stored{" "}
                  {active.id === "synthetic-1" ? "version 2" : "version 1"}{" "}
                  fictional source and its verified hash. No patient uploads are
                  accepted.
                </p>
                <button className="primary" disabled={busy}>
                  Request policy change
                </button>
              </form>
            )}
            {!data.changes.length && <p>No visible correction requests.</p>}
            <div className="change-request-list" tabIndex={0} aria-label="Policy correction request history">
            {data.changes.map((c: any) => (
              <article className="change-request" key={c.id}>
                <h3>
                  {c.target_document} · {c.state.replaceAll("-", " ")}
                </h3>
                <small>
                  {c.id} · {c.proposer_name} · version {c.lock_version}
                </small>
                <p>
                  Based on {c.base_document}. Supervisor:{" "}
                  {c.supervisor?.name || "pending"}; clinical authority:{" "}
                  {c.clinical?.name || "pending"}.
                </p>
                {c.test_report && (
                  <p>
                    Candidate conformance:{" "}
                    {c.test_report.passed ? "passed" : "failed"} (
                    {c.test_report.results.length} synthetic cases). Clinical
                    validation not performed.
                  </p>
                )}
                <div className="review-actions">
                  {actions(c).map((action) => (
                    <button
                      key={action}
                      disabled={busy}
                      onClick={() =>
                        act(
                          () =>
                            request("/policy-changes/" + c.id + "/actions", {
                              action,
                              eventId: crypto.randomUUID(),
                              expectedVersion: c.lock_version,
                            }),
                          labels[action] + " recorded",
                        )
                      }
                    >
                      {labels[action]}
                    </button>
                  ))}
                </div>
              </article>
            ))}
            </div>
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>Publication and rollback history</h2>
        </div>
        <div className="detail-body">
          {!data.publications.length && (
            <p>
              No publication events. The starting version is a fictional
              demonstration baseline.
            </p>
          )}
          <div className="publication-list" tabIndex={0} aria-label="Policy publication history">
          {data.publications.map((p: any) => (
            <p key={p.sequence}>
              {p.action} · {p.from_document} → {p.to_document} · {p.actor} ·{" "}
              {p.at}
            </p>
          ))}
          </div>
        </div>
      </section>
    </div>
  );
}
export function AuthorizationReview({
  request,
  caseId,
  roles,
  preview,
  onChanged,
}: {
  request: Request;
  caseId: string;
  roles: string[];
  preview: boolean;
  onChanged: () => Promise<void>;
}) {
  const [data, setData] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const load = () =>
    request("/cases/" + caseId + "/authorization-review").then(setData);
  useEffect(() => {
    setData(null);
    load().catch((e) => setError(e.message));
  }, [caseId, preview]);
  async function decide(action: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request("/cases/" + caseId + "/authorization-review", {
        action,
        eventId: crypto.randomUUID(),
        expectedPolicyRevision: data.evaluation.policyRevision,
        assessmentSourceHash:
          data.evaluation.assessmentSourceHash || "unassessed",
      });
      await onChanged();
      await load();
      setNotice(
        "Internal review recorded. No insurer contacted; source encounter status unchanged.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <div role={error ? "alert" : "status"}>
        {error || "Loading applicable authorization requirements…"}
      </div>
    );
  const e = data.evaluation,
    canAct = roles.some((r) => ["reviewer", "admin"].includes(r));
  return (
    <div>
      <h3>Internal Authorization Review</h3>
      <p>{e.disclaimer}</p>
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="notice">
          {notice}
        </div>
      )}
      <div className="policy-status">
        <strong>
          {e.documentId} · {e.outcome}
        </strong>
        <span>
          Effective {e.effectiveDate} · revision {e.policyRevision}
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Evidence status</th>
            <th>Supporting source</th>
          </tr>
        </thead>
        <tbody>
          {e.requirements.map((r: any) => (
            <tr key={r.code}>
              <td>
                {r.code}
                <small>{r.citation.quote}</small>
              </td>
              <td>
                {r.status === "missing"
                  ? "Missing evidence — request information"
                  : "Documented"}
              </td>
              <td className="mono">
                {r.evidence
                  .map(
                    (s: any) => s.reference + " @ " + (s.version || s.eventId),
                  )
                  .join("\n") || "No supporting record"}
                <small>Policy source: {r.citation.sourceHash}</small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {canAct && (
        <div className="review-actions">
          <button disabled={busy} onClick={() => decide("request-information")}>
            Request case information
          </button>
          <button
            disabled={busy || !e.assessmentCurrent}
            onClick={() => decide("escalate")}
          >
            Escalate authorization review
          </button>
          <button
            className="primary"
            disabled={
              busy ||
              e.suspended ||
              e.missing.length > 0 ||
              !e.assessmentCurrent
            }
            onClick={() => decide("approve-internal-next-step")}
          >
            Approve internal next step
          </button>
        </div>
      )}
      <h3>Internal decision history</h3>
      {!data.history.length && (
        <p>No internal authorization decisions recorded.</p>
      )}
      <div className="internal-history" tabIndex={0} aria-label="Internal authorization decision history">
      {data.history.map((h: any) => (
        <div className="timeline-event" key={h.eventId}>
          <strong>
            {h.action}
            {h.stale ? " · historical, policy or evidence changed" : ""}
          </strong>
          <small>
            {h.actor} · {h.at}
          </small>
          <small>
            Policy {h.evaluation.documentId} · source {h.assessmentSourceHash}
          </small>
        </div>
      ))}
      </div>
    </div>
  );
}
export function OperationalAlerts({
  request,
  preview,
}: {
  request: Request;
  preview: boolean;
}) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState("");
  async function refresh() {
    try {
      setData(await request("/operational-alerts"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    if (!preview) refresh();
  }, [preview]);
  if (preview) return null;
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Dependency health alerts</h2>
          <p>
            Measured service readiness · local evaluation, no external
            notifications
          </p>
        </div>
        <button onClick={refresh}>Check dependency alerts</button>
      </div>
      <div className="detail-body">
        {error && (
          <div role="alert" className="error">
            {error}
          </div>
        )}
        {!data && !error && <p role="status">Checking service health…</p>}
        {data && (
          <>
            <p>Checked {data.checkedAt}</p>
            {data.alerts.length ? (
              data.alerts.map((a: any) => (
                <p className="error" key={a.service}>
                  {a.service}: {a.message}
                </p>
              ))
            ) : (
              <p>No dependency-health alerts at the last check.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
