"""Render final acceptance only from completed machine evidence; preserve all limits."""
from pathlib import Path
import json,re,subprocess,hashlib,datetime
root=Path(__file__).resolve().parent.parent;p=root/'artifacts/phase-6'
def read(n):return json.loads((p/n).read_text())
def count(n):
 s=(p/n).read_text();assert re.search(r'fail 0\b',s);return int(re.search(r'pass (\d+)\b',s).group(1))
u=count('final-unit.txt');i=count('final-integration.txt');s=(p/'final-browser.txt').read_text();assert '10 passed' in s and not re.search(r'\d+ failed',s)
assert u>=45 and i>=25
for width in [1440,1920]:
 st=read(f'final-preview-{width}-results.json')['stats'];assert st['expected']==1 and st['unexpected']==0 and st['flaky']==0
assert read('final-npm-audit.json')['metadata']['vulnerabilities']['total']==0
r=read('final-restore-proof.json');f=read('fault-recovery.json');rec=read('reconciliation-after-repair.json');assert r['passed'] and f['passed'] and rec['passed']
assert read('policy-correctness.json')['passed'] and read('denial-validation.json')['passed']
epic=read('epic-conformance.json');assert not epic['epicRuntimeValidated'] and not epic['jpsConnected'];assert len(epic['syntheticResults'])==6
b=read('performance-baseline/benchmark-results.json');c=read('performance-candidate/benchmark-results.json');e=read('performance-extended/benchmark-results.json')
for label,result in [('baseline',b),('candidate',c),('extended',e)]:
 assert result['load']['seconds']>=(600 if label=='extended' else 120) and result['liveMvpUnchanged']
 assert read('performance-'+label+'/soak-measurements-verification.json')['aggregateMatchesRaw']
assert b['host']==c['host']==e['host'];assert read('dataset-start.json')['sha256']==read('dataset-end.json')['sha256']
assert len(read('queue-equivalence.json')['checks'])==32
subprocess.run(['node','scripts/source-fingerprint.mjs','--phase-6','--check'],cwd=root,check=True)
trace=read('traceability-verification.json');proposal=read('proposal-pricing-verification.json');assert trace['unmappedNonemptyLines']==0 and proposal['officialBytesUnchanged'] and proposal['internalCostInputsBlank'] and proposal['pdfPages']<=25
run=(root/'.runtime/phase6-live-run').read_text().strip()
for issue in ['issue-2','phase-6']:
 m=json.loads((root/'artifacts'/issue/run/'manifest.json').read_text())
 for im in m['images']:assert hashlib.sha256((root/im['file']).read_bytes()).hexdigest()==im['sha256']
d=read('performance-extended/stage-diagnostics.json');auth=d['authentication'];metrics=(p/'performance-extended/process-metrics.txt').read_text()
stages={}
for stage in ['acquire','page','count']:
 suffix='{stage="'+stage+'",outcome="success"}'
 total=float(re.search(r'^ur_worklist_stage_seconds_sum'+re.escape(suffix)+r' ([\d.eE+-]+)',metrics,re.M).group(1));n=int(re.search(r'^ur_worklist_stage_seconds_count'+re.escape(suffix)+r' (\d+)',metrics,re.M).group(1));stages[stage]={'completedSamples':n,'meanMs':total/n*1000}
summary={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'classification':'SYNTHETIC LOCAL ENGINEERING; DRAFT SUBMISSION PREPARATION ONLY','engineeringChecksPassed':True,'allProductionRequirementsMet':False,'readyToSubmit':False,'submitted':False,'signed':False,'tests':{'unit':u,'liveIntegration':i,'liveBrowser':10,'fixtureWidths':[1440,1920]},'eightDemonstrationsPreserved':True,'performance':{'controlled120sBaseline':b['load'],'controlled120sCandidate':c['load'],'extendedDiagnostic':e['load'],'extendedZeroErrors':not e['load']['errors'],'oneHourTimeoutEliminationProven':False,'stageMeans':stages,'renewalCalls':len(auth),'renewalMaxMs':max([x['durationMs'] for x in auth],default=0),'driverEventLoop':d['driverEventLoop'],'limits':'One controlled short pair plus 600s instrumented follow-up. Prior three Phase 5 hours and their failures remain; no new hour or hospital SLA claimed.'},'restoration':r,'faults':f,'reconciliation':rec,'traceabilityParagraphs':trace['nonemptyLinesCovered'],'proposalPDFPages':proposal['pdfPages'],'screenshots':run,'externalBlockers':['Authentic entity/signatory/three references/HUB evidence/vendor registration','Authorized complete prices and commercial/legal/insurance/BAA review','Completed official B/D/F/G and contract/addendum approvals','Epic/JPS authorized sandbox access and hospital permissions','Authorized payer/clinical criteria and qualified independent clinical validation','Vercel project linkage and access/protection verification','Representative sustained capacity, timeout-root-cause reproduction and enterprise HA/DR/security assurance']}
(p/'acceptance-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
rows=[]
for label,result in [('Current Phase 5 source baseline',b),('Single checkout + stage instrumentation',c),('Extended diagnostic (additional driver instrumentation)',e)]:
 l=result['load'];rows.append(f"| {label} | {l['seconds']:.3f} | {l['requests']:,} | {l['throughputPerSecond']:.2f} | {l['p95Ms']:.2f} | {l['maxMs']:.2f} | {json.dumps(l['errors'])} | {l['peakApiRssBytes']/1048576:.2f} |")
text=f'''# Phase 6 final engineering acceptance and submission preparation

[Development branch](https://github.com/keon11/jps-urt-mvp/tree/dev/phase-6-submission-acceptance). Starting verified source: f121f8fd53dae9f787bdd36f47807930ec75eba4. Prior MVP phases remain ancestors; main is unchanged. [Machine proof](../artifacts/phase-6/acceptance-summary.json).

## Verified engineering result

All eight synthetic hospital demonstrations and the unnamed desktop workstation are preserved. Final results: **{u} unit, {i} live integration, 10 browser tests passed**, plus fixture checks at 1440/1920. Build, policy/denial synthetic correctness, six synthetic FHIR mappings, query equivalence (32), deployment configuration, audit and npm audit (zero reported vulnerabilities) passed. None establishes clinical accuracy, complete regulatory/payer correctness, real Epic/payer connectivity, HIPAA compliance or production readiness.

Reused existing pg/Prometheus/Playwright and installed document tools; no new hospital runtime dependency, infrastructure or engine. Worklist now acquires one connection for the unchanged page/count statements and releases it even after either failure. Exact current counts, parameterized escaping, ordering, auth and the separate eight-connection clinical/write pool are preserved. Read-pool max remains two; request deadlines remain five seconds. Fixed-cardinality stage metrics contain no identity, query text or clinical content. Isolated read-only benchmark metrics collect process registry values without loading every clinical bundle via operational reporting; normal app reporting is unchanged.

## Actual performance and remaining failures

| Configuration | Seconds | Responses | Req/s | p95 ms | Max ms | Errors | Sampled peak API MiB |
|---|---:|---:|---:|---:|---:|---|---:|
{chr(10).join(rows)}

The controlled pair changes throughput by {(c['load']['throughputPerSecond']/b['load']['throughputPerSecond']-1)*100:+.2f}% and p95 by {(c['load']['p95Ms']/b['load']['p95Ms']-1)*100:+.2f}%. Sampled memory increased; one paired shared-host trial is not a statistical guarantee. The 600s follow-up includes extra driver instrumentation and token renewal, so it is not another identical A/B sample. All requests/statuses remain losslessly retained and independently recomputed. Full case-row hashes match over the follow-up snapshot interval; read-only enforcement and audit/live-MVP checks passed.

Final measured average stages (ms): acquire {stages['acquire']['meanMs']:.3f}, page {stages['page']['meanMs']:.3f}, count {stages['count']['meanMs']:.3f}. Pool queueing is the measured dominant average at this bounded concurrency. Renewal calls: {len(auth)}, maximum {summary['performance']['renewalMaxMs']:.2f}ms. Driver event-loop p99/max: {d['driverEventLoop']['p99Ms']:.2f}/{d['driverEventLoop']['maxMs']:.2f}ms. Error-stage details are in stage-diagnostics.json. These observations do not explain every historical outage. Host quota/scheduling, driver/auth delays and pool acquisition remain distinctions to measure on dedicated resources.

**Timeout elimination remains unproven.** The prior Phase 5 final hour recorded 45 timeouts and 11 HTTP 502s; that failure is not replaced by a shorter zero-error interval. No one-hour Phase 6 reliability pass, hospital capacity, WAN/clinical inference throughput, HA or SLA is claimed. A representative sustained run with dedicated load generation and correlated outage evidence remains necessary.

## Recovery and desktop evidence

Actual FHIR/CQF/AI readiness recovery: {f['fhirRecoverySeconds']:.2f}/{f['ruleEngineRecoverySeconds']:.2f}/{f['aiRecoverySeconds']:.2f}s. Failed FHIR/rule reviews preserved prior assessment without false success audit; labeled AI fallback and real inference recovery verified. Reconciliation retained one FHIR receipt and one logical committed event after retries; altered replay rejected.

Private application restore verified {len(r['tables'])} table hashes, {r['audit']['events']} audit events and an authenticated restored worklist in {r['seconds']:.2f}s. It is not a coordinated/off-host restore of every FHIR/identity/model volume. [Restoration procedure](PHASE-6-RESTORE.md). Fresh [workstation manifest](../artifacts/issue-2/{run}/manifest.json) and [risk/Synthea manifest](../artifacts/phase-6/{run}/manifest.json); [Selected visual inspection and limits](../artifacts/phase-6/visual-verification.json).

## Draft submission deliverables — not ready to submit

The official public RFP and seven linked attachments were refreshed; retained RFP/Addendum 1 hashes matched. [Complete source-paragraph matrix](submission/PHASE-6-TRACEABILITY.md) inventories **{trace['nonemptyLinesCovered']} nonempty source paragraphs**, including administrative/forms/background, sentence subclauses and compound capability facets. Zero unmapped source paragraphs means inventory completeness, not legal compliance or that all minimum requirements are implemented. Owner/counsel review governs all compound/legal obligations.

[Proposal draft](submission/PHASE-6-PROPOSAL-DRAFT.md), [editable DOCX](../artifacts/phase-6/RFP20261404054_OWNER-REQUIRED_PROPOSAL-DRAFT.docx), [{proposal['pdfPages']}-page PDF](../artifacts/phase-6/RFP20261404054_OWNER-REQUIRED_PROPOSAL-DRAFT.pdf), [internal costing workbook](../artifacts/phase-6/RFP20261404054_INTERNAL-PRICING_OWNER-INPUT.xlsx), and [original unfilled Exhibit A](../artifacts/phase-6/RFP20261404054_Exhibit-A_ORIGINAL-UNFILLED.xlsx). The original bytes remain unchanged. Template zeros are not vendor prices; internal actual inputs are blank and formulas conditional. Formula structure verified; spreadsheet application recalculation and DOCX pagination were not executed. PDF summary is one page; PDF has draft/entity-placeholder footer on every page. Owner must replace placeholders and verify final formats/page counts.

[Required forms and founder actions](submission/PHASE-6-VENDOR-FORMS.md): B/D/F are embedded in original RFP; C and both G forms are separate public attachments; E not used. Signature, corporate facts, actual prices, three references, HUB evidence, registration, insurance/legal/BAA, questionnaire evidence and authorized addendum/contract review are outstanding. No organizational questionnaire answer is an attestation. Form 1295 is a post-award step as described in the RFP.

Deadline retained from Addendum 1: **November 3, 2026, 2:00 p.m. CST**, as written. Owner must recheck all addenda immediately before any separately authorized submission. RFP requires the prescribed upload portal, genuine entity/file naming, editable contract/redline and response formats. No registration, outreach, payment, signature, contact, submission or contractual acceptance occurred.

## Preview and stable package

Vercel config selects only the Phase 6 development branch and keeps main/prior branches disabled. Fixture frontend uses no credentials/backend/AI/payer service. Authenticated team inspection returned zero projects; no linked preview/protection was verified and no deployment attempted. Prior create-project 403 is historical, not a new attempt. Founder must import/link the existing repository and configure approved access/protection. [Actual inspection](../artifacts/phase-6/vercel-status.json). Backend remains separate on loopback. Vercel deployment skill used: skill://plugin_connector_690a90ec05c881918afb6a55dc9bbaa1/deployments-cicd/SKILL.md.

[Technical demonstration transfer](../artifacts/phase-6/RFP20261404054_TECHNICAL-DEMONSTRATION_DRAFT.zip) and manifest contain allowlisted drafts, actual test/benchmark evidence, screenshots and disconnected fixture assets. They exclude runtime secrets, account values, private dumps and the private Git bundle. This ZIP is an engineering transfer, not automatically an accepted bid attachment. [Exact execution/limits](PHASE-6-EXECUTION.md), [predeclared gates](PHASE-6-ACCEPTANCE.md).

Remaining founder actions: authentic company/signatory/reference/HUB/vendor facts; approved prices and legal/insurance/BAA/official forms; Epic/JPS and payer/criteria permissions; independent clinical validation; Vercel import/protection; production security, sustained performance and coordinated recovery acceptance. Engineering checks passed within stated scope; production requirements and submission readiness remain **false**.
'''
(root/'docs/PHASE-6-REPORT.md').write_text(text);print('PASS: rendered actual engineering evidence; production and submission readiness remain false.')
