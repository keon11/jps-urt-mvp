import { spawn, type ChildProcess } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import pg from "pg";
import { pool } from "../services/api/src/db.js";
import { config } from "../services/api/src/config.js";
import { hash } from "../services/api/src/fixtures.js";
export async function docker(args: string[], input?: string, output?: string) {
  const child = spawn(
    "docker",
    ["compose", "exec", "-T", "postgres", ...args],
    { stdio: ["pipe", output ? "pipe" : "ignore", "pipe"] },
  );
  let error = "";
  child.stderr!.on("data", (b) => (error += b.toString().slice(0, 2000)));
  const done = new Promise<void>((resolve, reject) =>
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(Error("PostgreSQL utility failed: " + error)),
    ),
  );
  if (input) await pipeline(createReadStream(input), child.stdin!);
  else child.stdin!.end();
  if (output) await pipeline(child.stdout!, createWriteStream(output));
  await done;
}
export async function verifyAudit(db: pg.Pool) {
  const { rows } = await db.query("SELECT * FROM audit ORDER BY sequence");
  let previous = "GENESIS";
  for (const r of rows) {
    const expected = hash({
      caseId: r.case_id,
      actor: r.actor,
      action: r.action,
      detail: r.detail,
      at: r.at.toISOString(),
      previous,
    });
    if (r.previous_hash !== previous || r.hash !== expected)
      throw Error("Restored audit chain mismatch");
    previous = r.hash;
  }
  return { verified: true, events: rows.length, lastHash: previous };
}
export async function isolatedContext() {
  await mkdir(".runtime", { recursive: true });
  const path = ".runtime/issue2-reliability.json";
  let saved: any;
  try {
    saved = JSON.parse(await readFile(path, "utf8"));
  } catch {
    const dbname = "ur_issue2_" + Date.now();
    if (!/^ur_issue2_\d+$/.test(dbname))
      throw Error("Invalid isolated database name");
    const dump = ".runtime/issue2-baseline.dump";
    const url = new URL(config.database);
    const before = {
      cases: (await pool.query("SELECT count(*)::int AS n FROM cases")).rows[0]
        .n,
      audit: await verifyAudit(pool),
    };
    const start = performance.now();
    await docker(
      ["pg_dump", "-U", url.username, "-Fc", "-d", url.pathname.slice(1)],
      undefined,
      dump,
    );
    await pool.query(`CREATE DATABASE "${dbname}"`);
    await docker(
      [
        "pg_restore",
        "--no-owner",
        "--no-acl",
        "-U",
        url.username,
        "-d",
        dbname,
      ],
      dump,
    );
    saved = {
      dbname,
      dump,
      createdAt: new Date().toISOString(),
      backupRestoreSeconds: (performance.now() - start) / 1000,
      before,
    };
    await writeFile(path, JSON.stringify(saved, null, 2));
  }
  if (!/^ur_issue2_\d+$/.test(saved.dbname))
    throw Error("Unexpected restore target");
  const url = new URL(config.database);
  url.pathname = "/" + saved.dbname;
  const db = new pg.Pool({ connectionString: url.href, max: 8 });
  return { ...saved, dsn: url.href, db };
}
export async function startApi(dsn: string, readOnly: boolean) {
  const log = createWriteStream(".runtime/issue2-benchmark-api.log", {
    flags: "a",
  });
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "services/api/src/server.ts"],
    {
      env: {
        ...process.env,
        PORT: "3010",
        DATABASE_URL: dsn,
        BENCHMARK_READ_ONLY: readOnly ? "true" : "false",
        TRACE_FILE: ".runtime/benchmark-traces.jsonl",
        TRACE_SAMPLE_RATE: "0.05",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null)
      throw Error("Isolated API exited; inspect private runtime log");
    try {
      if (
        (
          await fetch("http://localhost:3010/health", {
            signal: AbortSignal.timeout(300),
          })
        ).ok
      )
        return child;
    } catch {}
    await new Promise((r) => setTimeout(r, 150));
  }
  child.kill("SIGTERM");
  throw Error("Isolated API readiness timeout");
}
export async function stopApi(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
    child.kill("SIGTERM");
  });
}
export const closeOriginal = () => pool.end();
