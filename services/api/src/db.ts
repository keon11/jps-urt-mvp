import pg from 'pg';
import {config} from './config.js';
export const pool=new pg.Pool({connectionString:config.database,max:8,connectionTimeoutMillis:5000});
export async function initDb(){
 await pool.query(`
 CREATE TABLE IF NOT EXISTS cases (
 id text PRIMARY KEY, patient_id text NOT NULL, encounter_id text NOT NULL,
 label text NOT NULL, scenario text NOT NULL, bundle jsonb NOT NULL,
 workflow jsonb NOT NULL, assessment jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
 );
 CREATE TABLE IF NOT EXISTS audit (
 sequence bigserial PRIMARY KEY, case_id text NOT NULL, actor text NOT NULL,
 action text NOT NULL, detail jsonb NOT NULL, at timestamptz NOT NULL DEFAULT now(),
 previous_hash text NOT NULL, hash text NOT NULL UNIQUE
 );
 CREATE TABLE IF NOT EXISTS idempotency (key text PRIMARY KEY, payload_hash text NOT NULL, case_id text NOT NULL);
 `);
 // Reject updates/deletes through the application database account, including accidental maintenance.
 await pool.query(`CREATE OR REPLACE FUNCTION immutable_audit() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'audit is append-only'; END; $$ LANGUAGE plpgsql;
 DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='audit_immutable') THEN
 CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON audit FOR EACH ROW EXECUTE FUNCTION immutable_audit();
 END IF; END $$;`);
 await pool.query(`CREATE OR REPLACE VIEW ur_operational_metrics AS SELECT
 count(*)::int AS active_encounters,
 count(*) FILTER (WHERE assessment IS NOT NULL AND COALESCE(assessment->>'triageStale','false')!='true')::int AS current_assessments,
 count(*) FILTER (WHERE (assessment->>'priority')::int>=70 AND COALESCE(assessment->>'triageStale','false')!='true')::int AS priority_review,
 count(*) FILTER (WHERE workflow->>'state'='escalated')::int AS escalated,
 count(*) FILTER (WHERE workflow->>'state'='reviewed')::int AS reviewed,
 count(*) FILTER (WHERE workflow->>'authorization'!='approved')::int AS authorization_attention
 FROM cases;
 DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='ur_metrics') THEN
 CREATE ROLE ur_metrics LOGIN PASSWORD 'synthetic-metrics-local-only'; END IF; END $$;
 GRANT USAGE ON SCHEMA public TO ur_metrics;
 GRANT SELECT ON ur_operational_metrics TO ur_metrics;`);

}
