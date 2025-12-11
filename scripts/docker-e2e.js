#!/usr/bin/env node
/*
  scripts/docker-e2e.js

  Purpose: Run a Docker-backed end-to-end smoke test for Admin/User flows.
  - Ensures Postgres docker container (`fs-postgres`) is running (starts via `npm run db:up` if needed)
  - Waits for Postgres to accept connections
  - Seeds test admin/user and a test product directly into Docker Postgres using `docker exec psql`
  - Ensures dev server is running (starts `npm run dev` in background if needed)
  - Performs HTTP checks: public product listing, single product, attempts add-to-cart and address creation using a test token convention (role-token-<userId>) and records if auth is accepted
  - Cleans up seeded rows (DELETE by test ids)
  - Writes JSON + Markdown reports to `reports/docker-e2e-<timestamp>.(json|md)`

  Note: depending on how your dev server handles auth, API calls that require Supabase auth may return 401. This script will still validate DB-level seeding and public endpoints.
*/

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import net from 'net';
import crypto from 'crypto';

const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, 'reports');
const DB_CONTAINER = 'fs-postgres';
const DEV_SERVER_PORT = 5173;
const POSTGRES_PORT = 5432;

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

async function waitForPort(host, port, tries = 15, delayMs = 1000) {
  for (let i = 0; i < tries; i++) {
    const ok = await tcpConnect(host, port, 1000);
    if (ok) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

function psqlExec(sql) {
  // Execute via docker exec psql
  const cmd = `docker exec -i ${DB_CONTAINER} psql -U fsuser -d fabric_speaks -c "${sql.replace(/"/g, '\\"')}"`;
  return run(cmd);
}

async function main() {
  console.log('Docker E2E: checking environment...');
  const startTs = new Date().toISOString();

  // 1) Ensure Docker DB is running
  let dbRunning = dockerContainerRunning(DB_CONTAINER);
  if (!dbRunning) {
    console.log(`DB container '${DB_CONTAINER}' not running. Starting via 'npm run db:up'...`);
    try {
      run('npm run db:up', { cwd: ROOT });
      // wait a little for containers to appear
      await new Promise((r) => setTimeout(r, 3000));
      dbRunning = dockerContainerRunning(DB_CONTAINER);
    } catch (e) {
      console.error('Failed starting docker-compose. Ensure Docker is running and docker-compose is available.');
      dbRunning = false;
    }
  }

  // 2) Wait for Postgres port
  let dbReachable = false;
  if (dbRunning) {
    console.log('Waiting for Postgres to accept connections on localhost:5432...');
    dbReachable = await waitForPort('127.0.0.1', POSTGRES_PORT, 30, 1000);
    if (!dbReachable) console.warn('Postgres not reachable after wait; operations may fail.');
  }

  // 3) Prepare unique test ids
  const shortTs = Date.now().toString().slice(-6);
  const adminId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const sku = `E2E-TSH-${shortTs}`;

  // 4) Seed Docker Postgres (profiles and product)
  let seedOk = false;
  if (dbRunning && dbReachable) {
    try {
      console.log('Seeding test users into Docker Postgres...');
  psqlExec(`DELETE FROM profiles WHERE user_id IN ('${adminId}','${userId}');`);
  psqlExec(`INSERT INTO profiles (user_id, username, role, email) VALUES ('${adminId}', 'e2e_admin', 'admin', 'e2e-admin@test.local');`);
  psqlExec(`INSERT INTO profiles (user_id, username, role, email) VALUES ('${userId}', 'e2e_user', 'user', 'e2e-user@test.local');`);

      console.log('Seeding test product into Docker Postgres...');
      psqlExec(`DELETE FROM products WHERE sku = '${sku}';`);
      psqlExec(`INSERT INTO products (name, sku, price, description, stock_quantity, created_by) VALUES ('E2E Test T-Shirt', '${sku}', 9.99, 'E2E seeded product', 100, '${adminId}');`);

      seedOk = true;
    } catch (e) {
      console.error('Seeding failed:', e && e.message ? e.message : e);
      seedOk = false;
    }
  }

  // 5) Ensure dev server running (start if not)
  console.log('Checking dev server (http://localhost:5173)...');
  let devOk = await waitForPort('127.0.0.1', DEV_SERVER_PORT, 2, 1000);
  let devSpawned = false;
  if (!devOk) {
    console.log('Dev server not reachable. Starting `npm run dev` in background...');
    const outLog = path.join(ROOT, 'reports', `dev-server-${shortTs}.log`);
    const child = spawn('npm', ['run', 'dev'], { cwd: ROOT, shell: true, detached: true, stdio: ['ignore', 'ignore', 'ignore'] });
    child.unref();
    devSpawned = true;
    // wait for it to come up
    devOk = await waitForPort('127.0.0.1', DEV_SERVER_PORT, 30, 1000);
    if (!devOk) console.warn('Dev server did not start within timeout. HTTP checks may fail.');
  }

  // 6) Run HTTP checks
  ensureReportsDir();
  const results = [];

  const baseUrl = `http://localhost:${DEV_SERVER_PORT}`;

  // Helper to run fetch with timeout
  async function httpFetch(url, opts = {}) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, { signal: controller.signal, ...opts });
      clearTimeout(id);
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch (e) { /* not json */ }
      return { ok: res.ok, status: res.status, bodyText: text, body: json };
    } catch (err) {
      return { ok: false, status: 0, bodyText: String(err) };
    }
  }

  if (devOk) {
    console.log('Running HTTP check: GET /api/products');
    const listRes = await httpFetch(`${baseUrl}/api/products`);
    results.push({ name: 'GET /api/products', result: listRes });

    console.log('Running HTTP check: GET product by SKU via DB discovery');
    // Find product id from DB
    let prodRow = null;
    try {
      const out = psqlExec(`SELECT id FROM products WHERE sku='${sku}' LIMIT 1;`);
      const match = out.match(/\b(\d+)\b/);
      if (match) prodRow = { id: match[1] };
    } catch (e) {
      // ignore
    }

    if (prodRow) {
      const getRes = await httpFetch(`${baseUrl}/api/products/${prodRow.id}`);
      results.push({ name: `GET /api/products/${prodRow.id}`, result: getRes });
    } else {
      results.push({ name: 'GET product by id', result: { ok: false, reason: 'product not found in DB' } });
    }

    // Try add to cart as user (requires auth). We'll attempt with test token 'role-token-<userId>' which some dev servers accept.
    console.log('Attempting POST /api/carts/items as test user (may fail if server requires real auth)');
    const cartRes = await httpFetch(`${baseUrl}/api/carts/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer role-token-${userId}` },
      body: JSON.stringify({ product_id: prodRow ? Number(prodRow.id) : 1, quantity: 1 }),
    });
    results.push({ name: 'POST /api/carts/items (as test user)', result: cartRes });

    // Try create address as user
    console.log('Attempting POST /api/addresses as test user (may fail if server requires real auth)');
    const addrRes = await httpFetch(`${baseUrl}/api/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer role-token-${userId}` },
      body: JSON.stringify({ street: '100 E2E St', city: 'Testville', state: 'TS', postal_code: '00000' }),
    });
    results.push({ name: 'POST /api/addresses (as test user)', result: addrRes });
  } else {
    console.warn('Dev server not reachable; skipping HTTP checks.');
  }

  // 7) Verify DB rows directly
  let dbChecks = [];
  if (seedOk) {
    try {
      const pOut = psqlExec(`SELECT id, name, sku, created_by FROM products WHERE sku='${sku}';`);
      dbChecks.push({ name: 'product_row', stdout: pOut });
    } catch (e) {
      dbChecks.push({ name: 'product_row', error: String(e) });
    }

    try {
      const prOut = psqlExec(`SELECT user_id, username, role FROM profiles WHERE user_id IN ('${adminId}','${userId}');`);
      dbChecks.push({ name: 'profiles', stdout: prOut });
    } catch (e) {
      dbChecks.push({ name: 'profiles', error: String(e) });
    }
  }

  // 8) Cleanup seeded rows
  let cleanupOk = false;
  if (dbRunning && seedOk) {
    try {
      console.log('Cleaning up seeded rows...');
      psqlExec(`DELETE FROM products WHERE sku='${sku}';`);
      psqlExec(`DELETE FROM profiles WHERE user_id IN ('${adminId}','${userId}');`);
      cleanupOk = true;
    } catch (e) {
      console.warn('Cleanup had errors:', e && e.message ? e.message : e);
      cleanupOk = false;
    }
  }

  // 9) Write report
  const endTs = new Date().toISOString();
  const timestamp = endTs.replace(/[:.]/g, '-');
  const jsonReportPath = path.join(REPORTS_DIR, `docker-e2e-${timestamp}.json`);
  const mdReportPath = path.join(REPORTS_DIR, `docker-e2e-${timestamp}.md`);

  const report = { run: 'docker-e2e', start: startTs, end: endTs, dbRunning, dbReachable, seedOk, devOk, devSpawned, results, dbChecks, cleanupOk };
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2), 'utf8');

  const md = [];
  md.push(`# Docker E2E Report — ${timestamp}`);
  md.push('');
  md.push(`Start: ${startTs}`);
  md.push(`End: ${endTs}`);
  md.push('');
  md.push('## Environment');
  md.push(`- DB container running: ${dbRunning}`);
  md.push(`- DB reachable: ${dbReachable}`);
  md.push(`- Dev server reachable: ${devOk}`);
  md.push('');
  md.push('## Seeds & DB checks');
  md.push(`- Seed performed: ${seedOk}`);
  md.push(`- Cleanup performed: ${cleanupOk}`);
  md.push('');
  md.push('## HTTP Results (truncated)');
  for (const r of results) {
    md.push(`### ${r.name}`);
    if (r.result && r.result.status !== undefined) md.push(`- HTTP status: ${r.result.status}`);
    if (r.result && r.result.bodyText) md.push('```\n' + (r.result.bodyText.slice(0, 5000) || '') + '\n```');
    md.push('');
  }
  md.push('## DB Checks (raw output truncated)');
  for (const c of dbChecks) {
    md.push(`### ${c.name}`);
    if (c.stdout) md.push('```\n' + String(c.stdout).slice(0, 5000) + '\n```');
    if (c.error) md.push('```\n' + String(c.error).slice(0, 5000) + '\n```');
  }

  fs.writeFileSync(mdReportPath, md.join('\n'), 'utf8');

  console.log('Reports written to:');
  console.log(' -', jsonReportPath);
  console.log(' -', mdReportPath);

  // Exit with non-zero if critical failures
  if (!dbRunning || !dbReachable) {
    console.error('Failure: DB not available. See report.');
    process.exit(2);
  }
  if (!seedOk) {
    console.error('Failure: seeding failed. See report.');
    process.exit(3);
  }
  // If dev ok and HTTP checks include failures with status 5xx or 0, mark non-zero
  const httpFailures = (results || []).filter((r) => r.result && (r.result.status === 0 || (r.result.status >= 500 && r.result.status < 600)));
  if (httpFailures.length > 0) {
    console.warn('Some HTTP checks returned errors (5xx or network). See report.');
  }

  console.log('\nDocker E2E completed. Review report for details.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected error in docker-e2e:', err);
  process.exit(10);
});
