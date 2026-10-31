// Generic stdio MCP probe: initialize -> tools/list against any local MCP command.
// Usage: node scripts/qa/mcp-stdio-probe.mjs "<name>" <cmd> [args...]
import { spawn } from 'node:child_process';

const [name, ...cmd] = process.argv.slice(2);
if (!name || cmd.length === 0) {
  console.error('usage: node mcp-stdio-probe.mjs <name> <cmd> [args...]');
  process.exit(2);
}

const child = spawn(cmd[0], cmd.slice(1), { stdio: ['pipe', 'pipe', 'pipe'], shell: process.platform === 'win32' });
let buf = '';
let err = '';
const pending = new Map();

child.stdout.on('data', (c) => {
  buf += c.toString();
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
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
child.stderr.on('data', (c) => (err += c.toString()));

let id = 1;
const request = (method, params) =>
  new Promise((resolve, reject) => {
    const myId = id++;
    const timer = setTimeout(() => reject(new Error(`timeout: ${method}`)), 120000);
    pending.set(myId, (m) => {
      clearTimeout(timer);
      resolve(m);
    });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: myId, method, params }) + '\n');
  });

const out = { server: name, command: cmd.join(' ') };
try {
  const init = await request('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'mcp-stdio-probe', version: '1.0' },
  });
  out.serverInfo = init.result?.serverInfo ?? init.error ?? 'no result';
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) + '\n');
  const tools = await request('tools/list', {});
  const list = tools.result?.tools ?? [];
  out.toolCount = list.length;
  out.tools = list.map((t) => t.name);
} catch (e) {
  out.error = String(e.message || e);
  if (err) out.stderrTail = err.split('\n').slice(-4).join(' | ').slice(0, 240);
} finally {
  child.kill();
}
console.log(JSON.stringify(out, null, 2));
process.exit(out.toolCount > 0 ? 0 : 1);
