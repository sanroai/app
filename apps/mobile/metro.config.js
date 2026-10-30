const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.server.unstable_serverRoot = workspaceRoot;

// pnpm writes and deletes transient task-run state under node_modules while it
// runs (`start.lock`, `*.jsonl`, `latest.json`). Metro crawls the whole
// workspace, so a file that disappears mid-walk crashes the watcher with
// `ENOENT ... watch '...pnpm-task-run-state-v1\start.lock'` and takes the dev
// server down. Nothing in there is ever imported by the app.
config.resolver.blockList = [
  ...[].concat(config.resolver.blockList ?? []),
  /[\\/]node_modules[\\/]\.pnpm-task-run-state-v1[\\/].*/,
];

module.exports = config;
