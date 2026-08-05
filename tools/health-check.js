#!/usr/bin/env node

/**
 * Health check Jack Tech
 *
 * Cek status produksi secara read-only: API + koneksi database, validitas
 * owner key, web utama, dan semua halaman klien. Tidak mengubah apa pun.
 *
 * Usage:
 *   node tools/health-check.js [--env=prod|local]
 *
 *   --env=prod   -> API https://undangan-api-six-ashen.vercel.app/ , web https://undangan-digital-delta-wine.vercel.app/ (default)
 *   --env=local  -> API http://localhost:8000/ , web http://localhost:8080/
 *
 * Exit code: 0 = semua PASS, 1 = ada yang gagal.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const BACKEND_ENV = path.resolve(ROOT, '../undangan-api/.env');
const CLIENTS_DIR = path.join(ROOT, 'clients');

const API_BASE = {
    local: 'http://localhost:8000/',
    prod: 'https://undangan-api-six-ashen.vercel.app/',
};

const WEB_BASE = {
    local: 'http://localhost:8080/',
    prod: 'https://undangan-digital-delta-wine.vercel.app/',
};

const args = process.argv.slice(2);
const envArg = args.find((a) => a.startsWith('--env='));
const ENV = envArg ? envArg.split('=')[1] : 'prod';

if (!API_BASE[ENV]) {
    console.error(`--env tidak valid: "${ENV}". Pilih local atau prod.`);
    process.exit(1);
}

const log = (msg) => console.log(msg);

const readEnv = () => {
    if (!fs.existsSync(BACKEND_ENV)) {
        log(`[ERROR] .env backend tidak ditemukan: ${BACKEND_ENV}`);
        process.exit(1);
    }

    const content = fs.readFileSync(BACKEND_ENV, 'utf8');
    const get = (key) => content.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim() ?? '';

    const appKey = get('APP_KEY');
    const ownerKey = get('OWNER_KEY');

    if (!appKey) {
        log('[ERROR] APP_KEY tidak ditemukan di .env backend.');
        process.exit(1);
    }

    if (!ownerKey) {
        log('[ERROR] OWNER_KEY tidak ditemukan di .env backend.');
        process.exit(1);
    }

    return { appKey, ownerKey };
};

const fetchWithTimeout = (url, options = {}, timeout = 20000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timer));
};

const results = [];

const check = async (name, fn) => {
    try {
        const detail = await fn();
        log(`  [PASS] ${name}${detail ? ` — ${detail}` : ''}`);
        results.push(true);
    } catch (e) {
        log(`  [FAIL] ${name} — ${e.message}`);
        results.push(false);
    }
};

const main = async () => {
    const { appKey, ownerKey } = readEnv();
    const hash = crypto.createHash('sha3-512').update(appKey).digest('hex');

    log(`Health check ${ENV}`);
    log(`  API  : ${API_BASE[ENV]}`);
    log(`  Web  : ${WEB_BASE[ENV]}`);
    log('');

    await check('API + database (health)', async () => {
        const res = await fetchWithTimeout(`${API_BASE[ENV]}api/health?hash=${hash}`);
        const json = await res.json();
        const db = json.database ?? {};

        if (!res.ok || json.status !== true || !db.connection_status) {
            throw new Error(`HTTP ${res.status}, status=${json.status}, db=${db.connection_status ?? 'N/A'}${db.error ? ` — ${db.error}` : ''}`);
        }

        return `MySQL ${db.server_version} (${db.connection_status})`;
    });

    await check('Owner key (owner/clients)', async () => {
        const res = await fetchWithTimeout(`${API_BASE[ENV]}api/owner/clients`, {
            headers: { 'x-access-key': ownerKey },
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        const count = Array.isArray(json.data) ? json.data.length : '?';
        return `${count} klien terdaftar`;
    });

    await check('Web utama', async () => {
        const res = await fetchWithTimeout(`${WEB_BASE[ENV]}`);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        return `HTTP ${res.status}`;
    });

    const slugs = fs.existsSync(CLIENTS_DIR)
        ? fs.readdirSync(CLIENTS_DIR, { withFileTypes: true })
            .filter((d) => d.isDirectory() && fs.existsSync(path.join(CLIENTS_DIR, d.name, 'index.html')))
            .map((d) => d.name)
        : [];

    if (slugs.length === 0) {
        log('  [SKIP] Tidak ada folder klien (clients/) untuk dicek.');
    }

    for (const slug of slugs) {
        await check(`Halaman klien /clients/${slug}/`, async () => {
            const res = await fetchWithTimeout(`${WEB_BASE[ENV]}clients/${slug}/`);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            return `HTTP ${res.status}`;
        });
    }

    const failed = results.filter((v) => !v).length;
    const passed = results.length - failed;

    log('');
    log(`Ringkasan: ${passed} PASS, ${failed} FAIL dari ${results.length} cek.`);

    if (failed > 0) {
        log('');
        log('Ada yang gagal. Periksa: Aiven service menyala? Deploy Vercel sukses? .env backend sesuai?');
        process.exit(1);
    }

    log('');
    log('Semua OK.');
    process.exit(0);
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
