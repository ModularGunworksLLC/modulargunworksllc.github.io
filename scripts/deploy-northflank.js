#!/usr/bin/env node
/**
 * Deploy to Northflank via API (bypasses branch picker bug).
 * Requires: .env with NORTHFLANK_API_TOKEN and GUNTAB_API_TOKEN
 * Run: node scripts/deploy-northflank.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const NF_TOKEN = process.env.NORTHFLANK_API_TOKEN;
const GUNTAB_TOKEN = process.env.GUNTAB_API_TOKEN;

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

async function getProjectId() {
  const res = await request('GET', '/projects');
  const data = res?.data ?? res;
  const list = Array.isArray(data) ? data : (data?.projects ?? data?.items ?? []);
  const proj = list.find((p) => (p.name || p.slug || '').toLowerCase().includes('modular'));
  if (proj) return proj.id || proj.slug;
  if (list.length) return list[0].id || list[0].slug;
  throw new Error('No projects found. Create "modular-gunworks" in Northflank first.');
}

async function main() {
  // Fetch available plans - use build type if exists, else smallest deployment plan
  let buildPlan = 'nf-compute-20';
  try {
    const plansRes = await request('GET', '/plans');
    const plans = plansRes?.data?.plans ?? plansRes?.plans ?? [];
    const buildType = plans.find((p) => Array.isArray(p.type) && p.type.includes('build'));
    const deploymentType = plans.find((p) => Array.isArray(p.type) && p.type.includes('deployment'));
    if (buildType) {
      buildPlan = buildType.id || buildType.name;
    } else if (deploymentType) {
      buildPlan = deploymentType.id || deploymentType.name;  // fallback: use deployment plan
    }
    console.log('   Build plan:', buildPlan);
  } catch {
    console.log('   Build plan (default):', buildPlan);
  }

  console.log('🔍 Finding project...');
  const projectId = await getProjectId();
  console.log(`   Project: ${projectId}`);

  const runtimeEnv = {
    NODE_ENV: 'production',
    GUNTAB_API_TOKEN: GUNTAB_TOKEN || '',
    GUNTAB_SELLER_EMAIL: 'modulargunworks@gmail.com',
  };
  if (!GUNTAB_TOKEN) {
    console.warn('⚠️  GUNTAB_API_TOKEN not in .env – add it in Northflank UI after create');
  }

  const payload = {
    name: 'modular-gunworks',
    billing: {
      deploymentPlan: 'nf-compute-10',
      buildPlan,
    },
    buildSource: 'git',
    vcsData: {
      projectUrl: 'https://github.com/ModularGunworksLLC/modulargunworksllc.github.io',
      projectType: 'github',
      accountLogin: 'ModularGunworksLLC',
      projectBranch: 'main',
    },
    buildSettings: {
      storage: { ephemeralStorage: { storageSize: 16384 } },
      dockerfile: {
        dockerFilePath: '/Dockerfile',
        dockerWorkDir: '/',
      },
    },
    deployment: {
      instances: 1,
      docker: { configType: 'default' },
      storage: { ephemeralStorage: { storageSize: 1024 } },
    },
    ports: [
      { name: 'http', internalPort: 3000, public: true, protocol: 'HTTP' },
    ],
    runtimeEnvironment: runtimeEnv,
  };

  console.log('📤 Creating combined service...');
  const created = await request('POST', `/projects/${projectId}/services/combined`, payload);
  const svcId = created?.data?.id || created?.id;
  console.log('✅ Service created:', svcId || created);

  console.log('\n📋 Next steps:');
  console.log('1. In Northflank: add GUNTAB_API_TOKEN in Service → Config & Secrets if not set');
  console.log('2. Start a build: Service → Builds → Start build');
  console.log('3. Once deployed, note the URL (e.g. https://xxx.code.run)');
  console.log('4. Point modulargunworks.com to that URL, or update frontend fetch to use it');
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
