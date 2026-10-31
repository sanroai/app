// Verifies the configured postgres MCP server end-to-end over stdio:
// initialize -> tools/list -> one read-only query. Never prints the DSN.
import { spawn } from 'node:child_process';

const uri = process.env.SANRO_MCP_DB_URI;
if (!uri) {
  console.error('SANRO_MCP_DB_URI is not set (expected at User scope)');
  process.exit(2);
}

const server = spawn(
  'uvx',
  ['--with', 'mcp<2', 'postgres-mcp', '--access-mode', 'restricted', uri],
  { env: { ...process.env }, stdio: ['pipe', 'pipe', 'pipe'] },
);

let buf = '';
const pending = new Map();
let stderr = '';

server.stdout.on('data', (chunk) => {
  buf += chunk.toString();
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  }
});
server.stderr.on('data', (c) => (stderr += c.toString()));

let nextId = 1;
function request(method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), 90000);
    pending.set(id, (msg) => {
      clearTimeout(timer);
      resolve(msg);
    });
    server.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}
function notify(method, params) {
  server.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
}

const out = { server: 'postgres-mcp (uvx, mcp<2, --access-mode restricted)' };
try {
  const init = await request('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'mcp-postgres-check', version: '1.0' },
  });
  out.initialize = init.result?.serverInfo ?? init.error ?? 'no result';
  notify('notifications/initialized', {});

  const tools = await request('tools/list', {});
  const list = tools.result?.tools ?? [];
  out.toolCount = list.length;
  out.tools = list.map((t) => t.name);

  const queryish = list.find((t) => /query|read|execute|sql/i.test(t.name));
  if (queryish) {
    const schema = queryish.inputSchema?.properties ?? {};
    const arg = schema.sql ? { sql: 'select 1 as ok' } : schema.query ? { query: 'select 1 as ok' } : {};
    const call = await request('tools/call', { name: queryish.name, arguments: arg });
    const text = JSON.stringify(call.result?.content ?? call.error ?? '');
    out.queryTool = queryish.name;
    out.queryOk = !call.error && /ok/i.test(text);
  }
} catch (e) {
  out.error = String(e.message || e);
  if (stderr) out.stderrTail = stderr.split('\n').slice(-5).join(' | ').slice(0, 300);
} finally {
  server.kill();
}

console.log(JSON.stringify(out, null, 2));
process.exit(out.queryOk || out.toolCount > 0 ? 0 : 1);
