#!/usr/bin/env node
/**
 * Fetch the public URL for the modular-gunworks Northflank service.
 * Requires: .env with NORTHFLANK_API_TOKEN
 * Run: node scripts/get-northflank-url.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const NF_TOKEN = process.env.NORTHFLANK_API_TOKEN;
if (!NF_TOKEN) {
  console.error('❌ Set NORTHFLANK_API_TOKEN in .env');
  process.exit(1);
}

const API = 'https://api.northflank.com/v1';

async function request(method, path) {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${NF_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
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

async function main() {
  console.log('🔍 Finding project and service...');
  const projectsRes = await request('GET', '/projects');
  const projects = projectsRes?.data ?? projectsRes?.projects ?? projectsRes?.items ?? [];
  const proj = Array.isArray(projects) ? projects.find((p) => (p.name || p.slug || '').toLowerCase().includes('modular')) : null;
  const projectId = proj?.id ?? proj?.slug ?? projects[0]?.id ?? projects[0]?.slug;
  if (!projectId) {
    throw new Error('No projects found. Create "modular-gunworks" in Northflank first.');
  }

  const servicesRes = await request('GET', `/projects/${projectId}/services`);
  const services = servicesRes?.data ?? servicesRes?.services ?? servicesRes?.items ?? [];
  const list = Array.isArray(services) ? services : Object.values(services);
  const svc = list.find((s) => (s.name || s.slug || '').toLowerCase().includes('modular-gunworks'));
  const svcId = svc?.id ?? svc?.slug;
  if (!svcId) {
    throw new Error('Service "modular-gunworks" not found. Run: node scripts/deploy-northflank.js');
  }

  const svcRes = await request('GET', `/projects/${projectId}/services/${svcId}`);
  const service = svcRes?.data ?? svcRes;
  const ports = service?.ports ?? service?.deployment?.ports ?? [];
  const publicPort = ports.find((p) => p.public === true);
  const dns = publicPort?.dns;
  if (!dns) {
    console.log('Service found but no public URL yet. Ports:', JSON.stringify(ports, null, 2));
    console.log('\nEnsure the service is deployed and has a public HTTP port. Start a build in Northflank if needed.');
    process.exit(1);
  }

  const base = dns.startsWith('http') ? dns : `https://${dns}`;
  console.log('\n✅ Northflank public URL:', base);
  console.log('\nUpdate scripts/api-config.js with:');
  console.log(`  window.API_BASE = '${base}';`);
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
