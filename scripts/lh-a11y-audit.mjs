/**
 * Authenticated Lighthouse a11y audit runner.
 *
 * Launches Chrome headless, injects localStorage auth token via CDP (native
 * WebSocket — Node 22+), then runs Lighthouse with disableStorageReset:true
 * so the route guard sees the token and doesn't redirect to /login.
 *
 * Usage:
 *   node scripts/lh-a11y-audit.mjs <jwt-token>
 */

import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const BASE_URL = 'http://localhost:4200';
const API_URL  = 'http://localhost:3000';
const TOKEN = process.argv[2];

if (!TOKEN) {
  console.error('Usage: node scripts/lh-a11y-audit.mjs <jwt-token>');
  process.exit(1);
}

const OUT_DIR = resolve(ROOT, 'docs', 'screenshots', 'bolt-3');
mkdirSync(OUT_DIR, { recursive: true });

/** Send a single CDP command via native WebSocket and wait for the response. */
function cdpEval(wsUrl, expression) {
  return new Promise((ok, fail) => {
    const ws = new WebSocket(wsUrl);
    const id = 1;
    ws.onopen = () => ws.send(JSON.stringify({
      id,
      method: 'Runtime.evaluate',
      params: { expression, returnByValue: true },
    }));
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === id) { ws.close(); ok(msg.result); }
    };
    ws.onerror = (e) => fail(e);
    setTimeout(() => { ws.close(); fail(new Error('CDP timeout')); }, 10_000);
  });
}

async function injectAuth(port, token) {
  // Get debugger URL for the first open tab
  const targets = await fetch(`http://localhost:${port}/json`).then(r => r.json());
  const wsUrl = targets[0]?.webSocketDebuggerUrl;
  if (!wsUrl) throw new Error('No CDP target found');
  await cdpEval(wsUrl, `
    localStorage.setItem('token', ${JSON.stringify(token)});
  `);
}

async function auditPage(url, theme, slug) {
  const profileDir = resolve(tmpdir(), `lh-profile-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(profileDir, { recursive: true });
  const chrome = await launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
    userDataDir: profileDir,
  });

  try {
    // Navigate to app to establish an origin, then inject token
    const targets0 = await fetch(`http://localhost:${chrome.port}/json`).then(r => r.json());
    const wsUrl = targets0[0]?.webSocketDebuggerUrl;

    // Navigate to the origin so localStorage.setItem has the right origin
    await new Promise((ok, fail) => {
      const ws = new WebSocket(wsUrl);
      let step = 0;
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
      };
      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === 1 && step === 0) {
          step = 1;
          ws.send(JSON.stringify({ id: 2, method: 'Page.navigate', params: { url: BASE_URL } }));
        } else if (msg.method === 'Page.loadEventFired' && step === 1) {
          step = 2;
          // Set dark/light theme
          const themeExpr = theme === 'dark'
            ? `localStorage.setItem('osms.theme','dark'); document.documentElement.classList.add('dark');`
            : `localStorage.setItem('osms.theme','light'); document.documentElement.classList.remove('dark');`;
          ws.send(JSON.stringify({
            id: 3,
            method: 'Runtime.evaluate',
            params: { expression: `localStorage.setItem('token',${JSON.stringify(TOKEN)}); localStorage.setItem('user',${JSON.stringify(JSON.stringify({ id: '8a892340-f291-44e6-a15e-caea41a4552d', name: 'Shop Owner', role: 'OWNER', username: 'owner' }))}); ${themeExpr}` },
          }));
        } else if (msg.id === 3) {
          ws.close(); ok();
        }
      };
      ws.onerror = fail;
      setTimeout(() => { ws.close(); fail(new Error('setup timeout')); }, 15_000);
    });

    const flags = {
      port: chrome.port,
      onlyCategories: ['accessibility'],
      disableStorageReset: true,
      logLevel: 'silent',
    };

    // For dark mode, emulate prefers-color-scheme via Lighthouse config
    const config = theme === 'dark'
      ? {
          extends: 'lighthouse:default',
          settings: {
            emulatedUserAgent: false,
            screenEmulation: { disabled: true },
          },
        }
      : undefined;

    const result = await lighthouse(url, flags, config);

    if (!result || !result.lhr) throw new Error('No LHR returned');

    const finalUrl = result.lhr.finalDisplayedUrl ?? result.lhr.finalUrl ?? 'unknown';
    if (finalUrl.includes('/login')) {
      throw new Error(`Auth failed — redirected to /login (finalUrl: ${finalUrl})`);
    }

    const score = Math.round(result.lhr.categories.accessibility.score * 100);
    const failedAudits = Object.values(result.lhr.audits)
      .filter(a => a.score !== null && a.score < 1
               && a.scoreDisplayMode !== 'informative'
               && a.scoreDisplayMode !== 'notApplicable'
               && a.scoreDisplayMode !== 'manual')
      .map(a => `    [${a.id}] ${a.title}`);

    const jsonPath = resolve(OUT_DIR, `lh-${slug}.json`);
    writeFileSync(jsonPath, JSON.stringify(result.lhr, null, 2));

    return { slug, score, failedAudits, finalUrl, ok: true };
  } finally {
    await chrome.kill();
    try { rmSync(profileDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

async function fetchFirstOrderId() {
  try {
    const res = await fetch(`${API_URL}/orders?limit=1`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const data = await res.json();
    return data?.items?.[0]?.id ?? null;
  } catch { return null; }
}

async function run() {
  const orderId = await fetchFirstOrderId();

  const PAGES = [
    { name: 'customers',    path: '/customers' },
    { name: 'orders',       path: '/orders' },
    { name: 'order-new',    path: '/orders/new' },
    ...(orderId ? [{ name: 'order-detail', path: `/orders/${orderId}` }] : []),
  ];

  const results = [];

  for (const page of PAGES) {
    for (const theme of ['light', 'dark']) {
      const url  = `${BASE_URL}${page.path}`;
      const slug = `${page.name}-${theme}`;
      process.stdout.write(`  ${slug.padEnd(26)} `);
      try {
        const r = await auditPage(url, theme, slug);
        const icon = r.score >= 95 ? '✓' : '✗';
        console.log(`${icon} ${r.score}`);
        if (r.failedAudits.length) r.failedAudits.forEach(f => console.log(f));
        results.push({ ...r, page: page.name, theme });
      } catch (err) {
        console.log(`✗ ERROR — ${err.message}`);
        results.push({ slug, page: page.name, theme, score: -1, failedAudits: [], ok: false, error: err.message });
      }
    }
  }

  console.log('\n── Summary ─────────────────────────────────────────');
  let allPass = true;
  for (const r of results) {
    const pass = r.score >= 95;
    if (!pass) allPass = false;
    const mark = pass ? '✓' : '✗';
    console.log(`  ${mark} ${r.slug.padEnd(26)} ${r.score >= 0 ? r.score : 'ERR'}`);
  }
  console.log('────────────────────────────────────────────────────');
  console.log(allPass
    ? '✓ All audits ≥95 — GATE PASSED'
    : '✗ One or more audits below 95 — GATE FAILED');

  process.exit(allPass ? 0 : 1);
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
