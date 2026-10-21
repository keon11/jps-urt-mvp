import {
  PolicyCenter,
  AuthorizationReview,
  OperationalAlerts,
} from "./PolicyCenter";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  LayoutDashboard,
  Inbox,
  ShieldCheck,
  Stethoscope,
  ChartNoAxesCombined,
  History,
  ArrowUpRight,
  Plus,
  Search,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LogOut,
  FileJson,
  RefreshCw,
  BrainCircuit,
  Upload,
  HeartPulse,
} from "lucide-react";
import "./style.css";
declare const __FIXTURE_PREVIEW__: boolean;
const fixturePreview = __FIXTURE_PREVIEW__;

type User = { name: string; roles: string[] };
export async function api(
  url: string,
  body?: unknown,
  method?: string,
  headers?: Record<string, string>,
) {
  if (fixturePreview) {
    const { previewApi } = await import("./preview");
    return previewApi(url, body, method);
  }
  const r = await fetch("/api" + url, {
    method: method || (body ? "POST" : "GET"),
    headers: { "Content-Type": "application/json", ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await r.json();
  if (r.status === 401 && !["/session", "/me"].includes(url))
    window.dispatchEvent(new Event("ur-session-expired"));
  if (!r.ok) throw new Error(result.error || "Request failed");
  return result;
}
function App() {
  const [user, setUser] = useState<User | null>(null),
    [role, setRole] = useState("reviewer"),
    [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]),
    [selected, setSelected] = useState<string | null>(null),
    [tab, setTab] = useState("Review queue"),
    [detail, setDetail] = useState("Overview");
  const [priorityFilter, setPriorityFilter] = useState("all"),
    [stateFilter, setStateFilter] = useState("all");
  const [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [audit, setAudit] = useState<any[]>([]),
    [globalAudit, setGlobalAudit] = useState<any[]>([]),
    [services, setServices] = useState<Record<string, string>>({});
  const [spo2Input, setSpo2Input] = useState(95),
    [bpInput, setBpInput] = useState(115),
    [nightsInput, setNightsInput] = useState(1);
  const [showIntake, setShowIntake] = useState(false),
    [fixture, setFixture] = useState("respiratory"),
    [fixtureIds, setFixtureIds] = useState<string[]>([]);
  async function refresh() {
    setLoading(true);
    try {
      const [c, s, f, r] = await Promise.all([
        api("/cases"),
        api("/services"),
        api("/fixtures"),
        api("/reports"),
      ]);
      setCases(c);
      setServices(s);
      setFixtureIds(f);
      setReport(r);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const expired = () => {
      setUser(null);
      setCases([]);
      setSelected(null);
      setError("Your demonstration session expired. Sign in again.");
    };
    window.addEventListener("ur-session-expired", expired);
    return () => window.removeEventListener("ur-session-expired", expired);
  }, []);
  useEffect(() => {
    api("/me")
      .then(setUser)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (user) refresh().catch((e) => setError(e.message));
  }, [user]);
  useEffect(() => {
    if (user && tab === "Audit trail")
      api("/audit")
        .then(setGlobalAudit)
        .catch((e) => setError(e.message));
  }, [tab, cases, user]);
  useEffect(() => {
    if (selected)
      api("/cases/" + selected + "/audit")
        .then(setAudit)
        .catch((e) => setError(e.message));
  }, [selected, cases]);
  async function action(fn: () => Promise<unknown>, success?: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      if (user) await refresh();
      if (success) setNotice(success);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function ingest(bundle: unknown) {
    const r = await api("/intake", bundle, "POST", {
      "Idempotency-Key": crypto.randomUUID(),
    });
    setSelected(r.case.id);
    setShowIntake(false);
    setNotice(
      r.duplicate
        ? "This synthetic encounter is already in the queue."
        : "Synthetic FHIR bundle ingested and persisted.",
    );
  }
  useEffect(() => {
    if (!selected) return;
    const current = cases.find((c) => c.id === selected);
    if (!current) return;
    const obs = current.bundle.entry.map((e: any) => e.resource);
    setSpo2Input(
      obs.find((r: any) =>
        r.code?.coding?.some((c: any) => c.code === "59408-5"),
      )?.valueQuantity?.value ?? 95,
    );
    setBpInput(
      obs.find((r: any) =>
        r.code?.coding?.some((c: any) => c.code === "8480-6"),
      )?.valueQuantity?.value ?? 115,
    );
    setNightsInput(
      obs.find((r: any) =>
        r.code?.coding?.some((c: any) => c.code === "expected-nights"),
      )?.valueQuantity?.value ?? 1,
    );
  }, [selected]);
  useEffect(() => {
    if (!showIntake) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    dialog?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowIntake(false);
        return;
      }
      if (e.key !== "Tab" || !dialog) return;
      const controls = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input,select,[tabindex="0"]',
        ),
      ).filter((n) => n.getClientRects().length);
      const first = controls[0],
        last = controls.at(-1);
      if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        e.preventDefault();
        last?.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last || document.activeElement === dialog)
      ) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [showIntake]);
  const row = cases.find((c) => c.id === selected);
  const count = (fn: (c: any) => boolean) => cases.filter(fn).length;
  const filtered = cases
    .filter(
      (c) =>
        tab !== "Physician advisor" ||
        c.workflow.state === "escalated" ||
        c.workflow.humanDecision,
    )
    .filter((c) => stateFilter === "all" || c.workflow.state === stateFilter)
    .filter(
      (c) =>
        priorityFilter === "all" ||
        (priorityFilter === "high"
          ? c.assessment?.priority >= 70 && !c.assessment?.triageStale
          : !c.assessment || c.assessment.triageStale),
    )
    .sort(
      (a, b) =>
        (b.assessment?.triageStale ? -1 : (b.assessment?.priority ?? -1)) -
        (a.assessment?.triageStale ? -1 : (a.assessment?.priority ?? -1)),
    )
    .filter((c) =>
      (c.label + " " + c.id + " " + c.scenario)
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  const editable =
    !fixturePreview &&
    user?.roles.some((r) => ["reviewer", "admin"].includes(r));
  if (!user)
    return (
      <div className="login-shell">
        <form
          className="login-card"
          onSubmit={(e) => {
            e.preventDefault();
            action(async () => {
              setUser(await api("/session", { username: role, password }));
              setPassword("");
            });
          }}
        >
          <div className="brand">Utilization Review</div>
          <h1>Hospital utilization review</h1>
          <p>
            Local synthetic demonstration. Sign in with an authorized
            demonstration account.
          </p>
          <label>
            Demonstration role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="reviewer">Utilization reviewer</option>
              <option value="advisor">Physician advisor</option>
              <option value="admin">Administrator</option>
            </select>
          </label>
          <label>
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
          <button className="primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in to workspace"}
          </button>
          <small>
            Fictional patients · Illustrative criteria · Human decisions
            <br />
            Credentials are provided separately by the local operator.
          </small>
        </form>
      </div>
    );
  const nav = [
    ["Review queue", Inbox],
    ["Authorizations", ShieldCheck],
    ["Physician advisor", Stethoscope],
    ["Operations", ChartNoAxesCombined],
    ["Audit trail", History],
    ["Policy management", ShieldCheck],
  ] as const;
  return (
    <div className="layout">
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <aside className="sidebar">
        <div className="brand">Utilization Review</div>
        <span className="side-caption">CARE OPERATIONS</span>
        <nav>
          {nav.map(([label, Icon]) => (
            <button
              key={label}
              className={tab === label ? "nav active" : "nav"}
              aria-current={tab === label ? "page" : undefined}
              onClick={() => {
                setTab(label);
                setSelected(null);
              }}
            >
              <Icon size={18} />
              {label}
              {label === "Review queue" && (
                <span className="nav-count">{cases.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="safe">
            <ShieldCheck size={18} />
            <div>
              Synthetic environment<small>No production connections</small>
            </div>
          </div>
          <div className="user">
            <div>
              {user.name}
              <small>{user.roles.join(" · ")}</small>
            </div>
            <button
              hidden={fixturePreview}
              aria-label="Sign out"
              title="Sign out"
              className="icon-btn"
              onClick={() =>
                action(async () => {
                  await api("/session", undefined, "DELETE");
                  setUser(null);
                  setCases([]);
                  setSelected(null);
                })
              }
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="content">
        <header>
          <div className="breadcrumbs">
            Care operations <ChevronRight size={13} /> <strong>{tab}</strong>
          </div>
          <div className="header-right">
            <span className="live-dot" />{" "}
            {fixturePreview ? "Fixture preview" : "Local demonstration"}{" "}
            <span className="header-date">
              {report
                ? new Date(report.demoAsOf).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  })
                : "Demo clinical clock"}
            </span>
          </div>
        </header>
        <main id="workspace" aria-busy={busy || loading}>
          <div className="page-top">
            <div>
              <div className="eyebrow">
                CLINICAL OPERATIONS · SYNTHETIC WORKSPACE
              </div>
              <h1>{tab}</h1>
              <p>
                {tab === "Review queue"
                  ? "Encounter worklist · Select an encounter to open the clinical workbench."
                  : "Connected workflows with traceable human oversight."}
              </p>
            </div>
            <div className="toolbar">
              <button
                className="secondary"
                onClick={() => action(refresh)}
                disabled={busy}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              {editable && (
                <button className="primary" onClick={() => setShowIntake(true)}>
                  <Plus size={17} />
                  Synthetic intake
                </button>
              )}
            </div>
          </div>
          {fixturePreview && (
            <div role="status" className="preview-banner">
              <strong>Frontend preview — fictional fixtures</strong>
              <span>
                Read-only snapshot. Live backend, sign-in, AI execution and
                payer services are not connected. Run the separate local stack
                for all eight interactive demonstrations.
              </span>
            </div>
          )}
          <div className="demo-banner">
            <ShieldCheck size={17} />
            <strong>Demonstration only</strong>
            <span>
              All patients are fictional. Clinical and payer criteria are
              illustrative and unvalidated. Recommendations require human
              review.
            </span>
          </div>
          {error && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="notice">
              <CheckCircle2 size={17} />
              {notice}
            </div>
          )}
          <div className="census-strip" aria-label="Worklist census">
            <strong>{cases.length} encounters</strong>
            <span>
              {count(
                (c) =>
                  c.assessment?.priority >= 70 && !c.assessment?.triageStale,
              )}{" "}
              high priority
            </span>
            <span>
              {count((c) => c.workflow.authorization !== "approved")}{" "}
              authorization follow-ups
            </span>
            <span>
              {count((c) => c.workflow.state === "escalated")} advisor
              escalations
            </span>
            <span>FHIR R4 · Illustrative review criteria</span>
          </div>
          {!row &&
            ["Review queue", "Authorizations", "Physician advisor"].includes(
              tab,
            ) && (
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      {tab === "Authorizations"
                        ? "Authorization worklist"
                        : tab === "Physician advisor"
                          ? "Advisor worklist"
                          : "Encounter worklist"}{" "}
                      <span className="subtle-count">{filtered.length}</span>
                    </h2>
                    <p>Prioritized by review score · source-linked evidence</p>
                  </div>
                  <div className="worklist-filters">
                    <label>
                      Priority
                      <select
                        aria-label="Filter by priority"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                      >
                        <option value="all">All priorities</option>
                        <option value="high">High priority (≥70)</option>
                        <option value="unassessed">
                          Needs assessment / refresh
                        </option>
                      </select>
                    </label>
                    <label>
                      Workflow
                      <select
                        aria-label="Filter by workflow"
                        value={stateFilter}
                        onChange={(e) => setStateFilter(e.target.value)}
                      >
                        <option value="all">All workflows</option>
                        {[...new Set(cases.map((c) => c.workflow.state))].map(
                          (state) => (
                            <option key={state}>{state}</option>
                          ),
                        )}
                      </select>
                    </label>
                    <label className="search">
                      <Search size={16} />
                      <input
                        aria-label="Search encounters"
                        placeholder="Search encounters…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>ENCOUNTER / PATIENT</th>
                        <th>CURRENT STATUS</th>
                        <th>PRIORITY</th>
                        <th>RECOMMENDATION</th>
                        <th>PAYER / AUTHORIZATION</th>
                        <th>WORKFLOW</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c) => (
                        <tr
                          key={c.id}
                          className={selected === c.id ? "selected" : ""}
                        >
                          <td>
                            <button
                              className="patient-link"
                              onClick={() => {
                                setSelected(c.id);
                                setDetail(
                                  tab === "Authorizations"
                                    ? "Authorization"
                                    : tab === "Physician advisor"
                                      ? "Advisor review"
                                      : "Overview",
                                );
                              }}
                            >
                              <span>
                                {c.label}
                                <small>{c.id} · Fictional</small>
                              </span>
                            </button>
                          </td>
                          <td>
                            <span className="pill neutral">
                              {c.bundle.entry.find(
                                (e: any) =>
                                  e.resource.resourceType === "Encounter",
                              )?.resource.class.code === "IMP"
                                ? "Inpatient"
                                : "Observation"}
                            </span>
                          </td>
                          <td>
                            {c.assessment && !c.assessment.triageStale ? (
                              <span
                                className={
                                  "priority " +
                                  (c.assessment.priority >= 70 ? "high" : "")
                                }
                              >
                                <span className="priority-dot" />
                                {c.assessment.priority}
                                <small> / 100 · illustrative</small>
                              </span>
                            ) : (
                              <span className="muted">
                                {c.assessment?.triageStale
                                  ? "Needs refresh"
                                  : "Awaiting review"}
                              </span>
                            )}
                          </td>
                          <td>
                            {c.assessment?.recommendation || "Not assessed"}
                            {c.assessment && (
                              <small className="table-note">
                                {c.assessment.ai?.mode === "local-model"
                                  ? "Local AI + illustrative rules"
                                  : "Illustrative rules"}
                              </small>
                            )}
                          </td>
                          <td>
                            <span
                              className={
                                "pill " +
                                (c.workflow.authorization === "approved"
                                  ? "green"
                                  : "amber")
                              }
                            >
                              {c.workflow.authorization.replaceAll("-", " ")}
                            </span>
                            <small className="table-note">
                              {
                                c.bundle.entry.find(
                                  (e: any) =>
                                    e.resource.resourceType === "Coverage",
                                )?.resource.payor?.[0]?.display
                              }
                            </small>
                          </td>
                          <td>
                            <span className="status-text">
                              <span
                                className={"state-dot " + c.workflow.state}
                              />
                              {c.workflow.state.replaceAll("-", " ")}
                            </span>
                          </td>
                          <td>
                            <button
                              aria-label={"Open " + c.label}
                              className="icon-btn"
                              onClick={() => {
                                setSelected(c.id);
                                setDetail(
                                  tab === "Authorizations"
                                    ? "Authorization"
                                    : tab === "Physician advisor"
                                      ? "Advisor review"
                                      : "Overview",
                                );
                              }}
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loading && (
                    <div role="status" className="empty">
                      Loading encounter data…
                    </div>
                  )}
                  {!loading && !filtered.length && (
                    <div className="empty">
                      <Inbox size={32} />
                      <h3>No matching encounters</h3>
                      <p>
                        Adjust search and filters, or add a fictional encounter
                        using Synthetic intake.
                      </p>
                    </div>
                  )}
                </div>
                <div className="panel-footer">
                  <span>
                    <ShieldCheck size={13} /> FHIR R4 · Medplum source records
                  </span>
                  <span>Human oversight at every decision</span>
                </div>
              </section>
            )}
          {tab === "Policy management" && (
            <PolicyCenter
              request={api}
              roles={user.roles}
              preview={fixturePreview}
            />
          )}
          {tab === "Audit trail" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Cross-workflow audit trail</h2>
                  <p>
                    {fixturePreview
                      ? "Recorded snapshot excerpt · live audit verification requires the local backend"
                      : "Latest 250 events · append-only records with a SHA-256 chain"}
                  </p>
                </div>
              </div>
              <div className="detail-body">
                <Audit events={globalAudit} />
              </div>
            </section>
          )}
          {tab === "Operations" && (
            <><OperationalAlerts request={api} preview={fixturePreview} /><SyntheticCohort preview={fixturePreview} /></>
          )}
          {tab === "Operations" && report && (
            <Operations
              report={report}
              cases={cases}
              openCase={(id) => {
                setTab(
                  id.startsWith("policy:")
                    ? "Policy management"
                    : "Review queue",
                );
                setSelected(id.startsWith("policy:") ? null : id);
                setDetail("Overview");
              }}
            />
          )}
          {row && (
            <div className="clinical-workbench">
              <aside className="encounter-rail" aria-label="Encounter list">
                <h2>Encounters</h2>
                <p>Current synthetic census</p>
                {cases.map((c) => (
                  <button
                    key={c.id}
                    aria-label={"Open " + c.label}
                    aria-pressed={c.id === row.id}
                    onClick={() => {
                      setSelected(c.id);
                      setDetail(
                        tab === "Authorizations"
                          ? "Authorization"
                          : tab === "Physician advisor"
                            ? "Advisor review"
                            : "Overview",
                      );
                    }}
                  >
                    <strong>{c.label}</strong>
                    <small>
                      {c.id} · {c.workflow.state.replaceAll("-", " ")}
                    </small>
                    <span>
                      {c.assessment?.recommendation || "Awaiting assessment"}
                    </span>
                    <small>
                      {
                        c.bundle.entry.find(
                          (e: any) => e.resource.resourceType === "Coverage",
                        )?.resource.payor[0].display
                      }
                    </small>
                  </button>
                ))}
              </aside>
              <section className="panel case-detail">
                <div className="panel-heading">
                  <div>
                    <div className="eyebrow">
                      ENCOUNTER WORKSPACE · FICTIONAL
                    </div>
                    <h2>
                      {row.label}
                      <span className="pill neutral">{row.id}</span>
                    </h2>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => setSelected(null)}
                  >
                    Back to worklist
                  </button>
                </div>
                <div className="tabs" aria-label="Encounter sections">
                  {[
                    "Overview",
                    "Clinical evidence",
                    "Authorization",
                    "Authorization Review",
                    "Advisor review",
                    "Audit history",
                  ].map((t) => (
                    <button
                      aria-pressed={detail === t}
                      className={detail === t ? "active" : ""}
                      onClick={() => setDetail(t)}
                      key={t}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="detail-body">
                  {detail === "Overview" && (
                    <div className="two-col">
                      <div>
                        <h3>Review summary</h3>
                        {fixturePreview && (
                          <p className="preview-note">
                            Recorded fictional assessment · snapshot only; no
                            live clinical execution.
                          </p>
                        )}
                        <p>
                          {
                            row.bundle.entry.find(
                              (e: any) =>
                                e.resource.resourceType === "Condition",
                            )?.resource.code.text
                          }
                        </p>
                        <div className="review-actions">
                          <button
                            className="primary"
                            disabled={busy || fixturePreview}
                            onClick={() =>
                              action(
                                () =>
                                  api("/cases/" + row.id + "/reviews", {
                                    kind: "initial",
                                  }),
                                "Initial review completed; recommendation requires human review.",
                              )
                            }
                          >
                            <BrainCircuit size={16} />
                            {busy
                              ? "Evaluating evidence & local AI…"
                              : "Run initial review"}
                          </button>
                          <button
                            className="secondary"
                            disabled={busy || fixturePreview}
                            onClick={() =>
                              action(
                                () =>
                                  api("/cases/" + row.id + "/reviews", {
                                    kind: "continued-stay",
                                  }),
                                "Continued-stay review completed.",
                              )
                            }
                          >
                            <RefreshCw size={16} />
                            Continued-stay review
                          </button>
                        </div>
                        {row.assessment ? (
                          <Assessment a={row.assessment} />
                        ) : (
                          <div className="callout">
                            <BrainCircuit size={20} />
                            <div>
                              <strong>Ready for evidence-based review</strong>
                              <p>
                                No current assessment. Run a review to evaluate
                                illustrative CQL criteria and local AI triage.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3>Source clinical evidence</h3>
                        <table className="compact-evidence">
                          <thead>
                            <tr>
                              <th>Observation</th>
                              <th>Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.bundle.entry
                              .filter(
                                (e: any) =>
                                  e.resource.resourceType === "Observation",
                              )
                              .map((e: any) => (
                                <tr key={e.resource.id}>
                                  <td>
                                    {e.resource.code.coding[0].display}
                                    <small>
                                      FHIR version {e.resource.meta?.versionId}
                                    </small>
                                  </td>
                                  <td>
                                    {e.resource.valueQuantity.value}{" "}
                                    {e.resource.valueQuantity.unit}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        <h3>Encounter context</h3>
                        <dl>
                          <dt>FHIR patient</dt>
                          <dd className="mono">{row.patient_id}</dd>
                          <dt>Payer</dt>
                          <dd>
                            {
                              row.bundle.entry.find(
                                (e: any) =>
                                  e.resource.resourceType === "Coverage",
                              )?.resource.payor[0].display
                            }
                          </dd>
                          <dt>Workflow</dt>
                          <dd>{row.workflow.state}</dd>
                        </dl>
                        {editable && (
                          <form
                            className="vitals-form"
                            onSubmit={(e) => {
                              e.preventDefault();
                              action(
                                () =>
                                  api(
                                    "/cases/" + row.id + "/synthetic-vitals",
                                    {
                                      spo2: spo2Input,
                                      systolic: bpInput,
                                      expectedNights: nightsInput,
                                    },
                                  ),
                                "Synthetic observations updated. Prior assessment cleared; run a new review.",
                              );
                            }}
                          >
                            <h3>Simulate a clinical update</h3>
                            <p>
                              Updates only this fictional patient's observations
                              in Medplum.
                            </p>
                            <div className="vital-inputs">
                              <label>
                                Oxygen %
                                <input
                                  type="number"
                                  min="50"
                                  max="100"
                                  value={spo2Input}
                                  onChange={(e) =>
                                    setSpo2Input(Number(e.target.value))
                                  }
                                />
                              </label>
                              <label>
                                Systolic mmHg
                                <input
                                  type="number"
                                  min="40"
                                  max="240"
                                  value={bpInput}
                                  onChange={(e) =>
                                    setBpInput(Number(e.target.value))
                                  }
                                />
                              </label>
                              <label>
                                Expected nights
                                <input
                                  type="number"
                                  min="0"
                                  max="30"
                                  value={nightsInput}
                                  onChange={(e) =>
                                    setNightsInput(Number(e.target.value))
                                  }
                                />
                              </label>
                            </div>
                            <button className="secondary" disabled={busy}>
                              Save synthetic observations
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  )}
                  {detail === "Clinical evidence" && (
                    <div className="evidence-grid">
                      {row.bundle.entry.map((e: any) => (
                        <div className="evidence-card" key={e.resource.id}>
                          <span className="eyebrow">
                            {e.resource.resourceType}
                          </span>
                          <h3>
                            {e.resource.code?.coding?.[0]?.display ||
                              e.resource.code?.text ||
                              e.resource.description ||
                              e.resource.resourceType}
                          </h3>
                          {e.resource.valueQuantity && (
                            <div className="evidence-value">
                              {e.resource.valueQuantity.value}
                              <small>{e.resource.valueQuantity.unit}</small>
                            </div>
                          )}
                          <small className="mono">
                            {e.resource.id}
                            <br />
                            Version: {e.resource.meta?.versionId}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                  {detail === "Authorization" && (
                    <Authorization
                      row={row}
                      busy={busy}
                      canEdit={!!editable}
                      perform={(path, body, message) =>
                        action(
                          () => api("/cases/" + row.id + path, body),
                          message,
                        )
                      }
                    />
                  )}
                  {detail === "Advisor review" && (
                    <Advisor
                      row={row}
                      busy={busy}
                      canEdit={!!editable}
                      canDecide={
                        !fixturePreview &&
                        user.roles.some((r) => ["advisor", "admin"].includes(r))
                      }
                      perform={(path, body, message) =>
                        action(
                          () => api("/cases/" + row.id + path, body),
                          message,
                        )
                      }
                    />
                  )}
                  {detail === "Authorization Review" && (
                    <><DocumentationRisk key={row.id} caseId={row.id} preview={fixturePreview} />
                    <AuthorizationReview
                      request={api}
                      caseId={row.id}
                      roles={user.roles}
                      preview={fixturePreview}
                      onChanged={refresh}
                    /></>
                  )}
                  {detail === "Audit history" && <Audit events={audit} />}
                </div>
              </section>
            </div>
          )}
          <div className="service-strip">
            <span>
              {fixturePreview
                ? "LIVE SERVICES NOT CONNECTED"
                : "SERVICE STATUS"}
            </span>
            {Object.entries(services).map(([k, v]) => (
              <span key={k}>
                <i className={v === "ready" ? "ready" : "offline"} />
                {k === "localModel" ? "Local AI" : k}{" "}
                {v === "ready" ? "" : "· unavailable"}
              </span>
            ))}
          </div>
          <footer>
            Independent hospital utilization review demonstration
            <span>JPS RFP #20261404054 · Illustrative decision support</span>
          </footer>
        </main>
      </div>
      {showIntake && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-labelledby="intake-title"
          >
            <span className="tag">FICTIONAL DATA ONLY</span>
            <h2 id="intake-title">Synthetic FHIR intake</h2>
            <p>
              Import a prepared fictional encounter into Medplum and the review
              queue. Unrecognized or modified bundles are rejected before
              persistence.
            </p>
            <label>
              Demonstration scenario
              <select
                value={fixture}
                onChange={(e) => setFixture(e.target.value)}
              >
                {fixtureIds.map((id) => (
                  <option key={id}>{id}</option>
                ))}
              </select>
            </label>
            <div className="modal-actions">
              <button
                className="secondary"
                onClick={() =>
                  action(async () => {
                    const b = await api("/fixtures/" + fixture);
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(
                      new Blob([JSON.stringify(b, null, 2)], {
                        type: "application/fhir+json",
                      }),
                    );
                    a.download = fixture + ".json";
                    a.click();
                    URL.revokeObjectURL(a.href);
                  })
                }
              >
                <FileJson size={16} />
                Download fixture
              </button>
              <label className="secondary upload">
                <Upload size={16} />
                Import fixture JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      action(async () => {
                        if (file.size > 256000)
                          throw new Error("Fixture is too large");
                        await ingest(JSON.parse(await file.text()));
                      });
                  }}
                />
              </label>
            </div>
            <div className="callout">
              <ShieldCheck size={18} />
              <p>
                Only the six shipped, unmodified synthetic bundles are accepted.
                No real patient data.
              </p>
            </div>
            <div className="modal-actions end">
              <button
                className="secondary"
                onClick={() => setShowIntake(false)}
              >
                Cancel
              </button>
              <button
                className="primary"
                disabled={busy}
                onClick={() =>
                  action(async () => ingest(await api("/fixtures/" + fixture)))
                }
              >
                {busy ? "Processing…" : "Ingest synthetic encounter"}
                <ArrowUpRight size={16} />
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
function Operations({
  report: r,
  cases,
  openCase,
}: {
  report: any;
  cases: any[];
  openCase: (id: string) => void;
}) {
  const bars = (values: Record<string, number>, color = "teal") =>
    Object.entries(values).map(([label, value]) => (
      <div className="bar-row" key={label}>
        <div>
          <span>{label.replaceAll("-", " ")}</span>
          <strong>{value}</strong>
        </div>
        <div className="bar-track">
          <span
            className={color}
            style={{ width: (r.total ? (value / r.total) * 100 : 0) + "%" }}
          />
        </div>
      </div>
    ));
  const ratio = r.total ? ((r.statusMix.Inpatient || 0) / r.total) * 100 : 0;
  return (
    <>
      <div className="operations-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Encounter status mix</h2>
              <p>Source FHIR encounter class · current snapshot</p>
            </div>
            <HeartPulse size={19} />
          </div>
          <div className="donut-layout">
            <div
              className="donut"
              style={{
                background: `conic-gradient(#208d7b 0% ${ratio}%, #b5d8d2 ${ratio}% 100%)`,
              }}
            >
              <div>
                <strong>{r.total}</strong>
                <small>encounters</small>
              </div>
            </div>
            <div className="donut-legend">
              {Object.entries(r.statusMix).map(([label, value]: any) => (
                <div key={label}>
                  <i
                    style={{
                      background: label === "Inpatient" ? "#208d7b" : "#b5d8d2",
                    }}
                  />
                  {label}
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Encounter aging</h2>
              <p>Reproducible synthetic clinical clock</p>
            </div>
            <Clock size={18} />
          </div>
          <div className="chart-body">
            {bars(r.ageBands)}
            <small>Demo as of {r.demoAsOf}</small>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Authorization pipeline</h2>
              <p>Simulated payer states only</p>
            </div>
            <ShieldCheck size={18} />
          </div>
          <div className="chart-body">{bars(r.authorizations, "amber")}</div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Review oversight</h2>
              <p>Current state · no model accuracy claim</p>
            </div>
            <BrainCircuit size={18} />
          </div>
          <div className="oversight-grid">
            <div>
              <strong>{r.currentAssessments}</strong>
              <small>Current assessments</small>
            </div>
            <div>
              <strong>{r.aiModes["local-model"] || 0}</strong>
              <small>Schema-checked local AI results</small>
            </div>
            <div>
              <strong>{r.staleAssessments}</strong>
              <small>Priority refresh needed</small>
            </div>
            <div>
              <strong>{r.notificationOverdue}</strong>
              <small>Illustrative notification delays</small>
            </div>
          </div>
          <div className="chart-note">
            {r.reviewOverdue} unassessed encounters aged ≥24 hours · thresholds
            are illustrative
          </div>
        </section>
      </div>
      <div className="operations-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Signals requiring attention</h2>
              <p>Evidence-linked signals in current assessments</p>
            </div>
          </div>
          <div className="signal-list">
            {Object.entries(r.signals).map(([label, value]: any) => (
              <div key={label}>
                <AlertTriangle size={15} />
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
            {!Object.keys(r.signals).length && (
              <p>
                No current assessments. Run case reviews to populate signals.
              </p>
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent workflow activity</h2>
              <p>Persisted events across all demonstration roles</p>
            </div>
          </div>
          <div className="activity-list">
            {r.recentActivity.slice(0, 6).map((e: any) => (
              <button key={e.sequence} onClick={() => openCase(e.case_id)}>
                <span className="activity-icon">
                  <History size={14} />
                </span>
                <span>
                  <strong>{e.action.replaceAll("-", " ")}</strong>
                  <small>
                    {e.case_id} · {e.actor} ·{" "}
                    {new Date(e.at).toLocaleTimeString()}
                  </small>
                </span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Human review outcomes</h2>
            <p>Recorded advisory dispositions with explicit decision reasons</p>
          </div>
          <a
            className="external-link"
            hidden={fixturePreview}
            href="http://localhost:3001/d/ur-synthetic-operations"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open local Grafana <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>FICTIONAL ENCOUNTER</th>
                <th>HUMAN DISPOSITION</th>
                <th>REASON</th>
                <th>REVIEWED BY</th>
              </tr>
            </thead>
            <tbody>
              {r.humanDecisions.map((d: any) => (
                <tr key={d.case}>
                  <td>
                    <button
                      className="patient-link"
                      onClick={() => openCase(d.case)}
                    >
                      {cases.find((c) => c.id === d.case)?.label || d.case}
                    </button>
                  </td>
                  <td>
                    <span className="pill green">{d.disposition}</span>
                  </td>
                  <td>{d.reason.replaceAll("-", " ")}</td>
                  <td>{d.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!r.humanDecisions.length && (
            <div className="empty">
              <Stethoscope size={25} />
              <p>No human decisions yet.</p>
            </div>
          )}
        </div>
        <div className="panel-footer">
          <span>{r.disclaimer}</span>
        </div>
      </section>
    </>
  );
}
type WorkflowProps = {
  row: any;
  busy: boolean;
  canEdit: boolean;
  perform: (path: string, body: unknown, message: string) => unknown;
};
function Authorization({ row, busy, canEdit, perform }: WorkflowProps) {
  const [outcome, setOutcome] = useState("pending-information");
  const [pending, setPending] = useState<{
    action: string;
    outcome: string;
    eventId: string;
  } | null>(null);
  const [eventError, setEventError] = useState("");
  const state = row.workflow.authorization;
  async function event(action: string) {
    if (
      pending &&
      (pending.action !== action ||
        (action === "payer-response" && pending.outcome !== outcome))
    ) {
      setEventError(
        "Retry the unresolved event with its original action and response before starting another event.",
      );
      return;
    }
    const eventId = pending?.eventId || crypto.randomUUID();
    setPending({ action, outcome, eventId });
    setEventError("");
    const success = await perform(
      "/authorization",
      {
        action,
        eventId,
        ...(action === "payer-response" ? { outcome } : {}),
      },
      "Simulated event recorded. No insurer was contacted. Refresh the review to update priority.",
    );
    if (success === true) setPending(null);
  }
  return (
    <div className="two-col">
      <div>
        <div className="eyebrow">LOCAL PAYER SIMULATOR</div>
        <h3>Authorization & notification tracking</h3>
        {eventError && (
          <div role="alert" className="error">
            {eventError}
          </div>
        )}
        {pending && (
          <p>
            Unresolved event {pending.eventId}. Retrying preserves its identity.
          </p>
        )}
        <div className="callout">
          <ShieldCheck size={20} />
          <div>
            <strong>Illustrative payer workflow</strong>
            <p>
              Every action below stays inside this synthetic demonstration. No
              payer submission or message leaves the platform.
            </p>
          </div>
        </div>
        <dl>
          <dt>Authorization</dt>
          <dd>
            <span className="pill amber">{state.replaceAll("-", " ")}</span>
          </dd>
          <dt>Notification due</dt>
          <dd>
            {row.operational?.notificationDueAt}{" "}
            {row.operational?.notificationOverdue && (
              <span className="pill red">Overdue · illustrative</span>
            )}
          </dd>
          <dt>Notifications logged</dt>
          <dd>{row.workflow.notifications.length}</dd>
          {row.workflow.validUntil && (
            <>
              <dt>Illustrative validity</dt>
              <dd>{row.workflow.validUntil}</dd>
            </>
          )}
        </dl>
        {canEdit && (
          <div className="simulation-controls">
            <div className="review-actions">
              <button
                className="primary"
                disabled={
                  busy ||
                  ![
                    "not-submitted",
                    "pending-information",
                    "denied",
                    "expired",
                  ].includes(state)
                }
                onClick={() => event("submit")}
              >
                Simulate submission
              </button>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => event("notify")}
              >
                Log simulated notification
              </button>
            </div>
            <label>
              Simulated payer response
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
              >
                <option value="pending-information">Pending information</option>
                <option value="approved">Approved</option>
                <option value="partial-approved">Partially approved</option>
                <option value="denied">Denied</option>
              </select>
            </label>
            <div className="review-actions">
              <button
                className="secondary"
                disabled={
                  busy || !["submitted", "pending-information"].includes(state)
                }
                onClick={() => event("payer-response")}
              >
                Record simulated response
              </button>
              <button
                className="secondary"
                disabled={
                  busy || !["approved", "partial-approved"].includes(state)
                }
                onClick={() => event("simulate-expiry")}
              >
                Simulate expiration
              </button>
            </div>
          </div>
        )}
      </div>
      <div
        className="authorization-history"
        tabIndex={0}
        aria-label="Authorization event records"
      >
        <h3>Authorization event history</h3>
        {!row.workflow.events.length && <p>No simulated payer events yet.</p>}
        {[...row.workflow.events].reverse().map((e: any) => (
          <div className="timeline-event" key={e.eventId}>
            <span className="pill neutral">SIMULATED</span>
            <strong>
              {e.action.replaceAll("-", " ")} → {e.status.replaceAll("-", " ")}
            </strong>
            <small>
              {e.actor} · {new Date(e.at).toLocaleString()}
            </small>
            {e.fhirReference && (
              <small className="mono">{e.fhirReference}</small>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
function Advisor({
  row,
  busy,
  canEdit,
  canDecide,
  perform,
}: WorkflowProps & { canDecide: boolean }) {
  const [reason, setReason] = useState("status-mismatch"),
    [disposition, setDisposition] = useState("Inpatient"),
    [decisionReason, setDecisionReason] = useState(
      "evidence-supports-recommendation",
    );
  return (
    <div className="two-col">
      <div>
        <div className="eyebrow">HUMAN OVERSIGHT</div>
        <h3>Physician advisor escalation</h3>
        <p>
          Route a reviewed encounter to a physician advisor. Clinical status in
          the source FHIR Encounter remains unchanged.
        </p>
        {row.workflow.escalation && (
          <div className="callout">
            <Stethoscope size={20} />
            <div>
              <strong>
                {row.workflow.state === "escalated"
                  ? "Awaiting advisor review"
                  : "Escalation history"}
              </strong>
              <p>
                {row.workflow.escalation.reason.replaceAll("-", " ")} ·{" "}
                {row.workflow.escalation.by}
              </p>
              <small>{row.workflow.escalation.at}</small>
            </div>
          </div>
        )}
        {canEdit && (
          <div className="simulation-controls">
            <label>
              Escalation reason
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {[
                  "status-mismatch",
                  "continued-stay",
                  "documentation-gap",
                  "authorization-risk",
                  "clinical-uncertainty",
                ].map((r) => (
                  <option key={r} value={r}>
                    {r.replaceAll("-", " ")}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary"
              disabled={
                busy ||
                row.workflow.state === "escalated" ||
                !row.assessment ||
                row.assessment.triageStale
              }
              onClick={() =>
                perform(
                  "/escalations",
                  { reason },
                  "Case escalated to the physician advisor queue.",
                )
              }
            >
              <ArrowUpRight size={16} />
              Escalate to physician advisor
            </button>
          </div>
        )}
      </div>
      <div>
        <h3>Human review decision</h3>
        {row.workflow.humanDecision && (
          <div className="decision-card">
            <CheckCircle2 size={23} />
            <div>
              <strong>{row.workflow.humanDecision.disposition}</strong>
              <p>{row.workflow.humanDecision.reason.replaceAll("-", " ")}</p>
              <small>
                {row.workflow.humanDecision.by} ·{" "}
                {row.workflow.humanDecision.at}
              </small>
              <small>
                Source clinical status unchanged · advisory demonstration
                decision
              </small>
            </div>
          </div>
        )}
        {canDecide ? (
          <form
            className="decision-form"
            onSubmit={(e) => {
              e.preventDefault();
              perform(
                "/decisions",
                { disposition, reason: decisionReason },
                "Human review decision recorded with source lineage and audit history.",
              );
            }}
          >
            <label>
              Advisor disposition
              <select
                value={disposition}
                onChange={(e) => setDisposition(e.target.value)}
              >
                <option>Inpatient</option>
                <option>Observation</option>
                <option>Request more information</option>
              </select>
            </label>
            <label>
              Decision reason
              <select
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
              >
                <option value="evidence-supports-recommendation">
                  Evidence supports recommendation
                </option>
                <option value="clinical-judgment-override">
                  Clinical judgment override
                </option>
                <option value="additional-documentation-required">
                  Additional documentation required
                </option>
              </select>
            </label>
            <p>
              Overrides require an explicit reason. A current assessment and an
              active escalation are required.
            </p>
            <button
              className="primary"
              disabled={busy || row.workflow.state !== "escalated"}
            >
              Record human decision
            </button>
          </form>
        ) : (
          <div className="callout">
            <Stethoscope size={20} />
            <p>
              Only a physician advisor or administrator can record the final
              human review decision. Sign in with the advisor demo account to
              complete this step.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
function Assessment({ a }: { a: any }) {
  return (
    <div className="assessment">
      {a.triageStale && (
        <div className="error">Priority needs refresh: {a.staleReason}</div>
      )}
      <div className="result-heading">
        <span className="tag">ILLUSTRATIVE RECOMMENDATION</span>
        <span className="pill neutral">Score {a.priority}/100</span>
      </div>
      <h3>{a.recommendation}</h3>
      <p>{a.continuedStay}</p>
      <div className="risk-line">
        <AlertTriangle size={15} />
        {a.denialRisk.label} · no probability estimate
      </div>
      <h4>Why this encounter needs review</h4>
      <ul>
        {a.signals.map((s: any) => (
          <li key={s.code}>{s.label}</li>
        ))}
      </ul>
      <div className="ai-card">
        <BrainCircuit size={18} />
        <div>
          <strong>
            {a.ai.mode === "local-model"
              ? "Local AI triage"
              : "Rules-only fallback"}
          </strong>
          <p>{a.ai.summary}</p>
          <small>
            {a.ai.model} · {a.ai.limitations}
          </small>
          {a.ai.output && (
            <small className="mono">
              Evidence: {a.ai.output.evidence.join(", ")}
            </small>
          )}
        </div>
      </div>
      <details open>
        <summary>Reasoning & source lineage</summary>
        <p>
          {a.engine} · {a.ruleVersion}
        </p>
        <pre>{JSON.stringify(a.expressions, null, 2)}</pre>
        <small>
          Demo clinical clock: {a.demoAsOf}
          <br />
          Evaluated: {a.evaluatedAt}
        </small>
        <p className="mono">
          {a.sources
            .map((s: any) => s.reference + " @ " + s.version)
            .join("\n")}
        </p>
        <small>{a.provenance}</small>
      </details>
      <small>
        Advisory only. A reviewer or physician advisor must make and document
        the final decision.
      </small>
    </div>
  );
}
function Metric({
  label,
  value,
  hint,
  icon,
  tone = "teal",
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  tone?: string;
}) {
  return (
    <article className="metric">
      <div className="metric-label">{label}</div>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}
function Audit({ events }: { events: any[] }) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [events]);
  const ordered = events.toSorted((a, b) => b.sequence - a.sequence),
    size = 25;
  const total = ordered.length;
  return (
    <div className="audit-workspace">
      <div className="audit-controls">
        <span>
          {total
            ? `${page * size + 1}–${Math.min((page + 1) * size, total)} of ${total} events · newest first`
            : "No audit events recorded."}
        </span>
        <div>
          <button disabled={!page} onClick={() => setPage((p) => p - 1)}>
            Previous events
          </button>
          <button
            disabled={(page + 1) * size >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next events
          </button>
        </div>
      </div>
      <div className="audit-list" tabIndex={0} aria-label="Audit event records">
        {ordered.slice(page * size, (page + 1) * size).map((e) => (
          <div className="audit-item" key={e.sequence}>
            <span className="audit-dot" />
            <div>
              <strong>{e.action.replaceAll("-", " ")}</strong>
              <small>
                {e.actor} · {new Date(e.at).toLocaleString()} · Event #
                {e.sequence}
              </small>
              <details>
                <summary>Event details</summary>
                <pre>
                  {JSON.stringify(e.detail, null, 2).replaceAll(
                    "Clarity UR",
                    "Utilization Review",
                  )}
                </pre>
              </details>
              <small className="mono">SHA-256 {e.hash}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

function DocumentationRisk({caseId,preview}:{caseId:string;preview:boolean}){
 const[result,setResult]=useState<any>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 return <section className="panel"><div className="panel-heading"><h2>Documentation and authorization risk</h2><button disabled={preview||loading} onClick={async()=>{setLoading(true);setError('');try{setResult(await api('/cases/'+caseId+'/denial-risk-review'));}catch(e){setError((e as Error).message);}finally{setLoading(false);}}}>{loading?'Checking risk evidence…':'Review risk evidence'}</button></div><div className="detail-body"><p>Published illustrative documentation criteria only. No insurer denial probability or coverage determination.</p>{preview&&<p>Disconnected fixture preview; run the local backend for this review.</p>}{error&&<p role="alert">{error}</p>}{result&&<><p role="status">Review outcome: {result.outcome} · policy {result.policyId} · revision {result.policyRevision}</p><p>{result.explanation}</p><ul>{result.signals.map((s:any)=><li key={s.code}>{s.code} — evidence {s.evidenceStatus}; source {s.citation.sourceUrl} / SHA-256 {s.citation.sourceHash}</li>)}</ul><p>Human review required. Insurer contacted: no.</p></>}</div></section>;
}

function SyntheticCohort({preview}:{preview:boolean}){const[data,setData]=useState<any>(null),[selected,setSelected]=useState<any>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);return <section className="panel"><div className="panel-heading"><div><h2>Synthetic FHIR interoperability cohort</h2><p>Actual Synthea-generated histories · read-only engineering evidence</p></div><button disabled={preview||busy} onClick={async()=>{setBusy(true);setError('');try{setData(await api('/synthetic-cohort'));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>{busy?'Loading cohort…':'Load Synthea cohort'}</button></div><div className="detail-body">{preview&&<p>Disconnected fixture preview. Run the local stack to browse the generated cohort.</p>}{error&&<p role="alert">{error}</p>}{data&&<><p>{data.disclaimer}</p><p>Synthea {data.generator.version} · {data.patients.length} fictional patients · cohort SHA-256 {data.cohortSha256}</p><div className="table-wrap"><table><thead><tr><th>Fictional history</th><th>Encounters</th><th>Conditions</th><th>Observations</th><th>Evidence</th></tr></thead><tbody>{data.patients.map((p:any)=><tr key={p.id}><td>{p.label}</td><td>{p.counts.encounters}</td><td>{p.counts.conditions}</td><td>{p.counts.observations}</td><td><button onClick={()=>setSelected(p)}>View {p.label}</button></td></tr>)}</tbody></table></div>{selected&&<div aria-label="Synthea clinical evidence"><h3>{selected.label}</h3><p>{selected.transform}</p><p>Original generated source SHA-256 {selected.sourceSha256}</p><h4>Recent generated diagnoses</h4><ul>{selected.conditions.map((c:any)=><li key={c.reference}>{c.display} ({c.code}) · {c.reference}</li>)}</ul><h4>Recent generated observations</h4><ul>{selected.observations.map((o:any)=><li key={o.reference}>{o.display}: {o.value??'Value unavailable'} {o.unit??''} · {o.at??'Timestamp unavailable'}</li>)}</ul><p>No current-admission recommendation is inferred from these historical records.</p></div>}</>}</div></section>;}
