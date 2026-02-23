#!/usr/bin/env node
/**
 * Audit Northflank configuration for modular-gunworks.
 * Requires: .env with NORTHFLANK_API_TOKEN
 * Run: node scripts/audit-northflank.js [--fix]
 *   --fix  Set PUBLIC_STORE_URL if missing (requires GET + POST runtime-environment)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const NF_TOKEN = process.env.NORTHFLANK_API_TOKEN;
if (!NF_TOKEN) {
  console.error('❌ Set NORTHFLANK_API_TOKEN in .env');
  process.exit(1);
}

const API = 'https://api.northflank.com/v1';

async function request(method, path, body) {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${NF_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(JSON.stringify(data, null, 2));
  }
  return data;
}

function ok(val, msg) {
  return val ? `✅ ${msg}` : `❌ ${msg}`;
}

function warn(val, msg) {
  return val ? `⚠️ ${msg} (consider updating)` : `   ${msg}`;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Northflank Configuration Audit – modular-gunworks');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let projectId, svcId, service;

  try {
    const projectsRes = await request('GET', '/projects');
    const projectsData = projectsRes?.data ?? projectsRes;
    const projects = projectsData?.projects ?? projectsData?.items ?? (Array.isArray(projectsData) ? projectsData : []);
    const list = Array.isArray(projects) ? projects : Object.values(projects);
    const proj = list.find((p) => (p.name || p.slug || '').toLowerCase().includes('modular'));
    projectId = proj?.id ?? proj?.slug ?? list[0]?.id ?? list[0]?.slug;
    if (!projectId) throw new Error('No projects found');
    console.log(ok(true, `Project: ${proj?.name ?? projectId}\n`));
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }

  try {
    const servicesRes = await request('GET', `/projects/${projectId}/services`);
    const servicesData = servicesRes?.data ?? servicesRes;
    const services = servicesData?.services ?? servicesData?.projects ?? servicesData?.items ?? (Array.isArray(servicesData) ? servicesData : []);
    const list = Array.isArray(services) ? services : Object.values(services);
    const svc = list.find((s) => (s.name || s.slug || '').toLowerCase().includes('modular-gunworks'));
    svcId = svc?.id ?? svc?.slug ?? list[0]?.id ?? list[0]?.slug;
    if (!svcId) throw new Error('Service modular-gunworks not found');
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }

  try {
    const svcRes = await request('GET', `/projects/${projectId}/services/${svcId}`);
    service = svcRes?.data ?? svcRes;
  } catch (e) {
    console.error('❌ Failed to get service:', e.message);
    process.exit(1);
  }

  // Runtime environment - fetched from separate endpoint (not included in GET service)
  let env = {};
  try {
    const envRes = await request('GET', `/projects/${projectId}/services/${svcId}/runtime-environment`);
    const envData = envRes?.data ?? envRes;
    env = envData?.runtimeEnvironment ?? envData ?? {};
  } catch {
    env = service?.runtimeEnvironment ?? service?.deployment?.runtimeEnvironment ?? service?.environment ?? {};
  }
  const envVars = typeof env === 'object' && env !== null && !Array.isArray(env) ? env : {};
  const envList = Array.isArray(env) ? env : Object.entries(envVars).map(([k, v]) => ({ key: k, value: v }));

  let guntabToken = false;
  let guntabEmail = false;
  let publicStoreUrl = null;
  let guntabListingBase = null;

  if (Array.isArray(envList)) {
    envList.forEach((e) => {
      const k = e?.key ?? e?.name;
      const v = e?.value ?? e?.val;
      if (k === 'GUNTAB_API_TOKEN') guntabToken = !!v;
      if (k === 'GUNTAB_SELLER_EMAIL') guntabEmail = !!v;
      if (k === 'PUBLIC_STORE_URL') publicStoreUrl = v;
      if (k === 'GUNTAB_LISTING_BASE') guntabListingBase = v;
    });
  } else {
    if (envVars.GUNTAB_API_TOKEN) guntabToken = true;
    if (envVars.GUNTAB_SELLER_EMAIL) guntabEmail = true;
    if (envVars.PUBLIC_STORE_URL) publicStoreUrl = envVars.PUBLIC_STORE_URL;
    if (envVars.GUNTAB_LISTING_BASE) guntabListingBase = envVars.GUNTAB_LISTING_BASE;
  }

  // Ports / public URL (Northflank dns can be "http--svc--xxx.code.run" – always use https://)
  const ports = service?.ports ?? service?.deployment?.ports ?? [];
  const publicPort = ports.find((p) => p.public === true);
  const dns = publicPort?.dns;
  const publicUrl = dns ? (dns.startsWith('https://') ? dns : `https://${dns}`) : null;

  // Status (API returns status.build.status, status.deployment.status)
  const statusObj = service?.status ?? {};
  const buildStatus = statusObj?.build?.status ?? service?.build?.status ?? 'unknown';
  const deployStatus = statusObj?.deployment?.status ?? service?.deployment?.status ?? 'unknown';

  console.log('SERVICE & DEPLOYMENT');
  console.log('───────────────────');
  console.log('  Build:         ', buildStatus);
  console.log('  Deployment:    ', deployStatus);
  console.log('  Public URL:    ', publicUrl || '(none)');
  console.log('');

  console.log('ENVIRONMENT VARIABLES (GunTab & store)');
  console.log('─────────────────────────────────────');
  console.log('  ', ok(guntabToken, `GUNTAB_API_TOKEN is set`));
  console.log('  ', ok(guntabEmail, `GUNTAB_SELLER_EMAIL is set`) || warn(true, 'GUNTAB_SELLER_EMAIL (optional, defaults to modulargunworks@gmail.com)'));
  console.log('  ', ok(publicStoreUrl === 'https://modulargunworks.com', `PUBLIC_STORE_URL = https://modulargunworks.com`));
  if (!publicStoreUrl || publicStoreUrl !== 'https://modulargunworks.com') {
    console.log('      Current:   ', publicStoreUrl || '(not set, defaults to modulargunworksllc.github.io)');
    console.log('      Action:    Add PUBLIC_STORE_URL=https://modulargunworks.com in Northflank → Config & Secrets');
  }
  // GUNTAB_LISTING_BASE: GunTab crawls listing URLs. If modulargunworks.com is static (GitHub Pages),
  // those URLs show "Loading..." – GunTab rejects. Use Northflank URL so product pages are server-rendered.
  const listingBaseOk = guntabListingBase && (guntabListingBase.startsWith('https://') || guntabListingBase.startsWith('http://'));
  console.log('  ', ok(listingBaseOk, `GUNTAB_LISTING_BASE = ${guntabListingBase || '(not set, uses PUBLIC_STORE_URL)'}`));
  if (!listingBaseOk && publicUrl) {
    console.log('      Fix:       Set GUNTAB_LISTING_BASE=' + publicUrl + ' so GunTab sees server-rendered product pages');
  }
  console.log('');

  console.log('RECOMMENDED ACTIONS');
  console.log('──────────────────');
  const actions = [];
  if (!guntabToken) actions.push('Add GUNTAB_API_TOKEN in Northflank → Config & Secrets');
  if (!publicStoreUrl || publicStoreUrl !== 'https://modulargunworks.com') {
    actions.push('Set PUBLIC_STORE_URL=https://modulargunworks.com in Northflank → Config & Secrets');
  }
  if (!listingBaseOk && publicUrl) {
    actions.push('Set GUNTAB_LISTING_BASE=' + publicUrl + ' (fixes GunTab "Url does not exist or requires login")');
  }
  if (!publicUrl) actions.push('Ensure service has a public HTTP port and is deployed');
  if (actions.length) {
    actions.forEach((a, i) => console.log(`  ${i + 1}. ${a}`));
    const doFix = process.argv.includes('--fix');
    let envNeedsUpdate = false;
    const newEnv = { ...envVars };
    if (doFix && (!publicStoreUrl || publicStoreUrl !== 'https://modulargunworks.com')) {
      newEnv.PUBLIC_STORE_URL = 'https://modulargunworks.com';
      envNeedsUpdate = true;
    }
    if (doFix && !listingBaseOk && publicUrl) {
      newEnv.GUNTAB_LISTING_BASE = publicUrl;
      envNeedsUpdate = true;
    }
    if (doFix && envNeedsUpdate) {
      console.log('\n🔧 Applying --fix: Updating runtime environment...');
      try {
        await request('POST', `/projects/${projectId}/services/${svcId}/runtime-environment`, {
          runtimeEnvironment: newEnv,
          runtimeFiles: {},
        });
        console.log('  ✅ Environment updated. Redeploy for changes to take effect.');
      } catch (e) {
        console.error('  ❌ Failed:', e.message);
      }
    }
  } else {
    console.log('  No changes needed; configuration looks correct.');
  }
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
