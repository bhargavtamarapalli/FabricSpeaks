#!/usr/bin/env node
/*
  scripts/admin-e2e.js

  Purpose: Lightweight end-to-end admin workflow validator.
  - Checks Docker (fs-postgres) and starts db if needed (uses `npm run db:up`).
  - Checks TCP connectivity to Postgres on localhost:5432.
  - Runs the existing admin RBAC Vitest file `server/__tests__/rbac.admin.test.ts`.
  - Writes a JSON and markdown report to `reports/admin-e2e-<timestamp>.(json|md)`.

  Usage: `node scripts/admin-e2e.js` or `npm run e2e:admin`
*/

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import net from 'net';

const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, 'reports');
const ADMIN_TEST_PATH = 'server/__tests__/rbac.admin.test.ts';
const VITEST_CONFIG = 'vitest.server.config.ts';

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts });
  } catch (err) {
    if (err && err.stdout) return err.stdout.toString();
    throw err;
  }
}

function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function dockerContainerRunning(name) {
  try {
    const out = run(`docker ps --filter name=${name} --format "{{.Names}}"`);
    return out.trim().length > 0;
  } catch (e) {
    return false;
  }
}

function tcpConnect(host, port, timeout = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      done = true;
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => { if (!done) { done = true; resolve(false); } });
    socket.on('timeout', () => { if (!done) { done = true; resolve(false); } });
    socket.connect(port, host);
  });
}

async function main() {
  console.log('Admin E2E: Starting environment checks...');

  // 1) Check Docker container
  const dbContainerName = 'fs-postgres';
  let dockerOk = dockerContainerRunning(dbContainerName);
  if (!dockerOk) {
    console.log(`Docker container '${dbContainerName}' not running. Attempting to start via 'npm run db:up'...`);
    try {
      run('npm run db:up', { cwd: ROOT });
      // wait briefly
      await new Promise((r) => setTimeout(r, 3000));
      dockerOk = dockerContainerRunning(dbContainerName);
    } catch (e) {
      console.error('Failed to start docker-compose. Please ensure Docker is running.');
      dockerOk = false;
    }
  }

  // 2) Check TCP to Postgres
  console.log('Checking TCP connectivity to Postgres (localhost:5432)...');
  const dbReachable = await tcpConnect('127.0.0.1', 5432, 3000);
  if (!dbReachable) console.warn('Postgres not reachable on localhost:5432. Tests may fail.');

  // 3) Run Vitest admin test file(s)
  ensureReportsDir();
  const startTs = new Date().toISOString();
  console.log('Running Admin RBAC test file using vitest...');

  // Build command: npx vitest run <file> --config <config>
  const vitestCmd = `npx vitest run ${ADMIN_TEST_PATH} --run --config ${VITEST_CONFIG}`;
  let vitestOutput = '';
  let vitestExitCode = 0;
  try {
    // Use spawnSync so we can capture exit code and output
    const result = spawnSync('npx', ['vitest', 'run', ADMIN_TEST_PATH, '--run', '--config', VITEST_CONFIG], { encoding: 'utf8' });
    vitestOutput = (result.stdout || '') + (result.stderr || '');
    vitestExitCode = result.status ?? 0;
  } catch (err) {
    vitestOutput = String(err);
    vitestExitCode = 1;
  }

  const success = vitestExitCode === 0;
  const endTs = new Date().toISOString();

  // 4) Generate reports
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonReportPath = path.join(REPORTS_DIR, `admin-e2e-${timestamp}.json`);
  const mdReportPath = path.join(REPORTS_DIR, `admin-e2e-${timestamp}.md`);

  const report = {
    run: 'admin-e2e',
    start: startTs,
    end: endTs,
    docker_container: dbContainerName,
    docker_running: dockerOk,
    db_reachable: dbReachable,
    vitest_cmd: vitestCmd,
    vitest_exit_code: vitestExitCode,
    vitest_success: success,
    vitest_output_snippet: vitestOutput.slice(0, 20_000)
  };

  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2), 'utf8');

  const mdLines = [];
  mdLines.push(`# Admin E2E Report — ${timestamp}`);
  mdLines.push('');
  mdLines.push(`Run started: ${startTs}`);
  mdLines.push(`Run finished: ${endTs}`);
  mdLines.push('');
  mdLines.push('## Environment');
  mdLines.push(`- Docker container '${dbContainerName}' running: ${dockerOk}`);
  mdLines.push(`- Postgres reachable (localhost:5432): ${dbReachable}`);
  mdLines.push('');
  mdLines.push('## Test Result');
  mdLines.push('- Vitest command: `' + vitestCmd + '`');
  mdLines.push(`- Exit code: ${vitestExitCode}`);
  mdLines.push(`- Success: ${success}`);
  mdLines.push('');
  mdLines.push('## Vitest output (truncated)');
  mdLines.push('');
  mdLines.push('```');
  mdLines.push(vitestOutput || '(no output)');
  mdLines.push('```');

  fs.writeFileSync(mdReportPath, mdLines.join('\n'), 'utf8');

  console.log('Report saved to:', jsonReportPath);
  console.log('Markdown summary saved to:', mdReportPath);

  if (success) {
    console.log('\n✅ Admin E2E tests passed.');
    process.exit(0);
  } else {
    console.error('\n❌ Admin E2E tests failed. See report for details.');
    process.exit(vitestExitCode || 1);
  }
}

main().catch((err) => {
  console.error('Unexpected error running admin-e2e:', err);
  process.exit(2);
});
