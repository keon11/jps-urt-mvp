import { load } from "cheerio";
import { diffWordsWithSpace } from "diff";
import { readFile } from "node:fs/promises";
import { pool } from "./db.js";
import { createHash } from "node:crypto";
export const requirementCodes = [
  "physician-note",
  "authorization-receipt",
] as const;
export type RequirementCode = (typeof requirementCodes)[number];
export function extractPolicy(
  html: string,
  sourceUrl: string,
  retrievedAt = new Date().toISOString(),
) {
  const $ = load(html);
  $("script,style,nav,header,footer").remove();
  const main = $("main").first().length ? $("main").first() : $("body");
  const meta = (name: string) =>
    $(`meta[name="${name}"]`).attr("content") || null;
  const digest = createHash("sha256").update(html).digest("hex");
  const synthetic = meta("classification") === "synthetic";
  const date = (name: string) => {
    const value = meta(name);
    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value))
      throw new Error("Invalid policy date");
    if (
      value &&
      new Date(value + "T00:00:00Z").toISOString().slice(0, 10) !== value
    )
      throw new Error("Invalid calendar date");
    return value;
  };
  const text = main.text().replace(/\s+/g, " ").trim();
  const tables = main
    .find("table")
    .toArray()
    .map((t) =>
      $(t)
        .find("tr")
        .toArray()
        .map((r) =>
          $(r)
            .find("th,td")
            .toArray()
            .map((c) => $(c).text().trim()),
        ),
    );
  const rules = synthetic
    ? main
        .find("[data-requirement]")
        .toArray()
        .map((node) => {
          const code = $(node).attr("data-requirement") as RequirementCode;
          if (!requirementCodes.includes(code))
            throw new Error("Unsupported candidate requirement");
          return {
            code,
            clinical: true,
            illustrative: true,
            citation: {
              sourceUrl,
              sourceHash: digest,
              selector: `[data-requirement="${code}"]`,
              quote: $(node).text().trim(),
            },
          };
        })
    : [];
  if (new Set(rules.map((r) => r.code)).size !== rules.length)
    throw new Error("Conflicting duplicate requirements");
  return {
    id: synthetic ? `synthetic-${meta("policy-version")}` : digest,
    policyId: meta("policy-id"),
    version: meta("policy-version"),
    title: $("title").text().trim(),
    sourceUrl,
    sourceHash: digest,
    retrievedAt,
    publishedDate: date("published-date"),
    effectiveDate: date("effective-date"),
    synthetic,
    policyType: synthetic ? "illustrative-documentation" : "unverified",
    planApplicability: synthetic ? ["Fictional Meridian", "Fictional Harbor", "Fictional Summit"] : [],
    applicabilityVerified: synthetic,
    text,
    tables,
    rules,
    provenance: {
      extractor: "cheerio",
      version: "1.1.2",
      format: "html",
      sourceBytes: Buffer.byteLength(html),
      permission: synthetic
        ? "repository-owned fictional fixture"
        : "official public page; no license-gated endpoint used",
    },
    uncertainties: synthetic
      ? []
      : [
          "Applicability and effective date require human verification. No executable rule inferred from this official page.",
        ],
  };
}
export type PolicyDocument = ReturnType<typeof extractPolicy>;
export function comparePolicies(before: PolicyDocument, after: PolicyDocument) {
  if (
    !before.synthetic ||
    !after.synthetic ||
    before.policyId !== after.policyId
  )
    throw new Error("Compare revisions of the same synthetic policy");
  return {
    before: before.id,
    after: after.id,
    added: after.rules.filter(
      (r) => !before.rules.some((p) => p.code === r.code),
    ),
    removed: before.rules.filter(
      (r) => !after.rules.some((p) => p.code === r.code),
    ),
    comparison: {engine:'jsdiff',version:'8.0.4'},
    textDiff: diffWordsWithSpace(before.text, after.text),
    uncertainties: [...before.uncertainties, ...after.uncertainties],
    illustrative: true,
  };
}
export async function initPolicyEvidence() {
  await pool.query(`CREATE TABLE IF NOT EXISTS policy_documents(id text PRIMARY KEY,source_hash text NOT NULL UNIQUE,document jsonb NOT NULL,original text NOT NULL);
 DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='policy_document_immutable') THEN CREATE TRIGGER policy_document_immutable BEFORE UPDATE OR DELETE ON policy_documents FOR EACH ROW EXECUTE FUNCTION immutable_audit();END IF;END $$;`);
  for (const v of [1, 2]) {
    const html = await readFile(
      `fixtures/policies/authorization-v${v}.html`,
      "utf8",
    );
    const d = extractPolicy(
      html,
      `urn:ur-demo:policy:authorization:v${v}`,
      "2026-10-21T00:00:00Z",
    );
    await pool.query(
      "INSERT INTO policy_documents VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING",
      [d.id, d.sourceHash, d, html],
    );
    const existing = await pool.query(
      "SELECT source_hash FROM policy_documents WHERE id=$1",
      [d.id],
    );
    if (existing.rows[0].source_hash !== d.sourceHash)
      throw new Error("Policy fixture changed without a new version");
  }
}
export async function policyEvidence() {
  const { rows } = await pool.query(
    "SELECT document FROM policy_documents ORDER BY id",
  );
  const documents = rows.map((r) => r.document as PolicyDocument);
  return {
    documents,
    diff: comparePolicies(
      documents.find((d) => d.id === "synthetic-1")!,
      documents.find((d) => d.id === "synthetic-2")!,
    ),
    disclaimer:
      "Candidate rules only. Synthetic revisions are not official payer revisions.",
  };
}

// A page-byte change is not proof of an official policy revision.
export function compareSourceEvidence(before:PolicyDocument,after:PolicyDocument){
 if(before.sourceUrl!==after.sourceUrl)throw Error('Source URL mismatch');
 const diff=diffWordsWithSpace(before.text,after.text);
 return {sourceUrl:after.sourceUrl,beforeHash:before.sourceHash,afterHash:after.sourceHash,bytesChanged:before.sourceHash!==after.sourceHash,textChanged:before.text!==after.text,addedSegments:diff.filter(d=>d.added).length,removedSegments:diff.filter(d=>d.removed).length,officialRevisionVerified:false,effectiveDate:after.effectiveDate,publishedDate:after.publishedDate,activationAllowed:false,interpretation:'Page content comparison only; dates, plan applicability and authorized criteria require human verification.'};
}
