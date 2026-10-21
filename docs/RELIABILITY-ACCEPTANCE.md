# Predeclared Issue #2 reliability gates

Declared before any sprint load benchmark. These gates characterize one synthetic local demonstration host, not high availability or enterprise production readiness.

- Isolated database: 10,000 additional fictional queue records; keep the original six-case database unchanged. Workload uses real authenticated paginated queue reads, 50 rows per response, against the application API.
- Load: 25 concurrent sessions for 120 seconds, p95 request latency <=1,000ms, unexpected-error fraction <1%, sustained throughput >=20 requests/second. Report count, p50/p95/p99/max, actual elapsed duration, throughput, CPU and memory. Clinical inference is excluded from this read throughput measurement and its measured latency is reported separately.
- API process restart: ready and persisted state readable within 15 seconds; committed decisions and audit hash remain unchanged.
- FHIR service outage: failed review must not overwrite the previous assessment or append a success audit event. After restoring the service, readiness recovers within 60 seconds.
- Local AI outage: explicit rules-only fallback, no fabricated model success. Model readiness recovers within 60 seconds after restart.
- Database backup/restore: restore an actual pg_dump into an isolated database within 120 seconds, verify full case counts and every audit hash. Keep the dump private under ignored .runtime. No drop/reset of the working database.
- Idempotency/reconciliation: identical retries yield one committed logical event; changed payload/actor reuse is rejected. Test an external FHIR success followed by a database failure; identify and repair duplicate-resource behavior before claiming reconciliation.
- Observability: real request metrics, dependency-health alert evaluation and a source-free local trace sample must be observable. No tokens, patient content or document text in exported trace attributes.

If a threshold fails, preserve the failure output, diagnose, optimize with measured justification, and rerun the same threshold. No after-the-fact target reductions. A 120-second soak is explicitly limited and does not establish continuous-operation, multi-node, disaster-recovery or clinical reliability.
