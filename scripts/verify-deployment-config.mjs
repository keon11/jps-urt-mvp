// Phase 3 deployment configuration regression check.
// Run: node scripts/verify-deployment-config.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const pkg = json('package.json');
const vercel = json('vercel.json');
const vite = readFileSync('vite.config.ts', 'utf8');
const branch = 'dev/phase-5-performance';
assert.equal(vercel.framework, 'vite');
assert.equal(vercel.installCommand, 'npm ci');
assert.equal(vercel.buildCommand, 'npm run build:preview');
assert.equal(vercel.outputDirectory, 'dist-preview');
assert.match(pkg.scripts['build:preview'], /vite build --mode preview/);
assert.match(vite, /dist-preview/);
assert.equal(vercel.git?.deploymentEnabled?.main, false);
assert.equal(vercel.git?.deploymentEnabled?.[branch], true);
assert.match(vercel.ignoreCommand ?? '', /VERCEL_GIT_COMMIT_REF/);
assert.ok(!(vercel.ignoreCommand ?? '').includes('VERCEL_ENV'), 'Build gating must not block selected branch by target environment');
for (const [key, value] of Object.entries(vercel)) {
  if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) throw new Error('Unexpected secret-like deployment setting');
}
console.log('PASS: Vercel fixture preview config is internally consistent. This does not verify hosted deployment or protection.');
