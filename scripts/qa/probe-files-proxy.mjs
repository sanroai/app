// Edge-case probe for the web-origin file proxy (apps/web/next.config.mjs rewrite
// /api/v1/files/:path* -> API origin). Verifies the proxy is a faithful pass-through
// and does not widen access beyond what the API itself exposes.
const WEB = 'http://localhost:3000';
const API = 'http://localhost:4000/api/v1';

const results = [];
function check(id, ok, detail) {
  results.push({ id, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id.padEnd(34)} ${detail}`);
}

async function head(url, method = 'GET', headers = {}) {
  const r = await fetch(url, { method, headers, redirect: 'manual' });
  const body = method === 'GET' || method === 'HEAD' ? await r.text().catch(() => '') : '';
  return { status: r.status, type: r.headers.get('content-type') ?? '', len: r.headers.get('content-length') ?? '', body, headers: r.headers };
}

async function main() {
  // 1. a real model file is served through the proxy
  const model = await head(`${WEB}/api/v1/files/ar/models/sphere.glb`);
  check('FP-01 model via proxy', model.status === 200 && model.len !== '0',
    `status=${model.status} type=${model.type} len=${model.len}`);

  // 2. the API serves the same bytes (proxy is a faithful pass-through)
  const direct = await head(`${API}/files/ar/models/sphere.glb`);
  check('FP-02 matches API origin', model.status === direct.status && model.len === direct.len,
    `proxy=${model.status}/${model.len} api=${direct.status}/${direct.len}`);

  // 3. unknown file -> 404, not a 200 with an HTML page
  const missing = await head(`${WEB}/api/v1/files/ar/models/does-not-exist.glb`);
  check('FP-03 missing file -> 404', missing.status === 404, `status=${missing.status}`);

  // 4. path traversal is not served
  const traversal = await head(`${WEB}/api/v1/files/..%2f..%2f..%2f..%2fapps%2fapi%2f.env`);
  const leaked = /DATABASE_URL|AUTH_SECRET|password/i.test(traversal.body ?? '');
  check('FP-04 traversal not served', traversal.status >= 400 && !leaked,
    `status=${traversal.status} leaked=${leaked}`);

  // 5. non-GET verbs are not proxied as a success
  const post = await head(`${WEB}/api/v1/files/ar/models/sphere.glb`, 'POST');
  check('FP-05 POST not proxied', post.status >= 400, `status=${post.status}`);

  // 6. query strings survive the rewrite
  const withQuery = await head(`${WEB}/api/v1/files/ar/models/sphere.glb?v=1&cache=0`);
  check('FP-06 query string kept', withQuery.status === 200, `status=${withQuery.status}`);

  // 7. range request (model-viewer uses partial loads)
  const ranged = await fetch(`${WEB}/api/v1/files/ar/models/sphere.glb`, { headers: { Range: 'bytes=0-99' } });
  const rangeLen = (await ranged.arrayBuffer()).byteLength;
  check('FP-07 range request works', ranged.status === 200 || ranged.status === 206,
    `status=${ranged.status} bytes=${rangeLen}`);

  // 8. HEAD is supported
  const headOnly = await head(`${WEB}/api/v1/files/ar/models/sphere.glb`, 'HEAD');
  check('FP-08 HEAD supported', headOnly.status === 200, `status=${headOnly.status}`);

  // 9. the proxy must not expose non-file API routes
  const leak = await head(`${WEB}/api/v1/auth/account-state`);
  check('FP-09 only files proxied', leak.status >= 400, `status=${leak.status}`);

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n=== SUMMARY: ${passed}/${results.length} PASS ===`);
  if (passed !== results.length) process.exit(1);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
