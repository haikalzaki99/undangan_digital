#!/usr/bin/env node

/**
 * Scaffold klien Jack Tech
 *
 * Daftarkan klien via API owner, lalu generate folder clients/{slug}/ berisi
 * index.html + dashboard.html dengan data-key & data-url sesuai klien.
 * Folder assets/images/ ikut disalin ke clients/{slug}/assets/images/ sehingga
 * setiap klien punya foto/gambar sendiri; musik & video tetap global.
 *
 * Usage:
 *   node tools/scaffold-klien.js "Nama Klien" <email> [password] [--env=local|prod]
 *
 *   --env=local  -> API http://localhost:8000/  , web http://localhost:8080/  (default)
 *   --env=prod   -> API https://undangan-api-six-ashen.vercel.app/ , web https://undangan-digital-delta-wine.vercel.app/
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CLIENTS_DIR = path.join(ROOT, 'clients');
const BACKEND_ENV = path.resolve(ROOT, '../undangan-api/.env');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36 Edg/120.0.0.0 scaffold-klien-jacktech';

const DATA_URL = {
    local: 'http://localhost:8000/',
    prod: 'https://undangan-api-six-ashen.vercel.app/',
};

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
const ENV = envArg ? envArg.split('=')[1] : 'local';
const [name, email, password = null] = args.filter((a) => !a.startsWith('--env='));

if (!name || !email) {
    console.error('Usage: node tools/scaffold-klien.js "Nama Klien" <email> [password] [--env=local|prod]');
    process.exit(1);
}

if (!DATA_URL[ENV]) {
    console.error(`--env tidak valid: "${ENV}". Pilih local atau prod.`);
    process.exit(1);
}

const log = (msg) => console.log(msg);

const readOwnerKey = () => {
    if (!fs.existsSync(BACKEND_ENV)) {
        log(`[ERROR] .env backend tidak ditemukan: ${BACKEND_ENV}`);
        process.exit(1);
    }

    const content = fs.readFileSync(BACKEND_ENV, 'utf8');
    const match = content.match(/^OWNER_KEY=(.+)$/m);

    if (!match || !match[1].trim()) {
        log('[ERROR] OWNER_KEY tidak ditemukan di .env backend.');
        process.exit(1);
    }

    return match[1].trim();
};

const slugify = (str) => String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const rewritePaths = (html, slug) => html
    .replaceAll('./assets/images/', `/clients/${slug}/assets/images/`)
    .replaceAll('./assets/music/', '/assets/music/')
    .replaceAll('./assets/video/', '/assets/video/')
    .replaceAll('./css/', '/css/')
    .replaceAll('./dist/', '/dist/');

const setDataKey = (html, key) => html.replace(/data-key="[^"]*"/, `data-key="${key}"`);

const setDataUrl = (html, url) => html.replace(/data-url="[^"]*"/, `data-url="${url}"`);

const registerClient = async (ownerKey) => {
    const body = { name, email };
    if (password) {
        body.password = password;
    }

    log(`[1/4] Mendaftarkan klien "${name}" (${email}) via API ${ENV} ...`);

    const res = await fetch(`${API_BASE[ENV]}api/owner/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-access-key': ownerKey,
            'User-Agent': USER_AGENT,
        },
        body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
        log(`[ERROR] Register gagal (${res.status}): ${JSON.stringify(json.error ?? json)}`);
        process.exit(1);
    }

    return json.data;
};

const scaffold = async () => {
    const ownerKey = readOwnerKey();
    const client = await registerClient(ownerKey);

    const slug = slugify(client.name);
    const dir = path.join(CLIENTS_DIR, slug);

    log(`[2/4] Membuat folder ${path.relative(ROOT, dir)} ...`);
    fs.mkdirSync(dir, { recursive: true });

    const imagesDir = path.join(dir, 'assets', 'images');
    fs.mkdirSync(imagesDir, { recursive: true });
    log('      Menyalin assets/images ke klien ...');
    fs.cpSync(path.join(ROOT, 'assets', 'images'), imagesDir, { recursive: true });

    const files = ['index.html', 'dashboard.html'];

    log('[3/4] Menyalin & mengonfigurasi halaman klien ...');
    for (const file of files) {
        const src = path.join(ROOT, file);
        const dst = path.join(dir, file);

        if (!fs.existsSync(src)) {
            log(`[WARN] ${file} tidak ditemukan, dilewati.`);
            continue;
        }

        let html = fs.readFileSync(src, 'utf8');
        html = rewritePaths(html, slug);
        html = setDataKey(html, client.access_key);
        html = setDataUrl(html, DATA_URL[ENV]);
        fs.writeFileSync(dst, html);
    }

    log('[4/4] Scaffold selesai.');
    log('');
    log('==========================================');
    log('        RINGKASAN KLIEN BARU');
    log('==========================================');
    log(`  ID          : ${client.id}`);
    log(`  Nama        : ${client.name}`);
    log(`  Email       : ${client.email}`);
    log(`  Password    : ${client.password}`);
    log(`  Access Key  : ${client.access_key}`);
    log(`  Slug        : ${slug}`);
    log('');
    log('  URL Tamu    : ' + `${WEB_BASE[ENV]}clients/${slug}/`);
    log('  URL Dashboard: ' + `${WEB_BASE[ENV]}clients/${slug}/dashboard.html`);
    log('==========================================');
};

scaffold().catch((err) => {
    console.error(err);
    process.exit(1);
});
