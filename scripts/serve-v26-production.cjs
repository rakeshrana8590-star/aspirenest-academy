#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const buildRoot = path.join(repoRoot, 'build');
const buildScript = path.join(__dirname, 'build-v26-shell.cjs');
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4188);

const MIME = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function build() {
  const result = spawnSync(process.execPath, [buildScript], {
    cwd: repoRoot,
    env: process.env,
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`V26 production shell build failed with status ${result.status}`);
  }

  const required = [
    'index.html',
    'app.js',
    'styles.css',
    path.join('integration', 'aspirenest-production-provider.js'),
    path.join('integration', 'aspirenest-adapter.js'),
  ];

  for (const relative of required) {
    const candidate = path.join(buildRoot, relative);
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
      throw new Error(`Built runtime is missing required file: ${relative}`);
    }
  }
}

function resolveRequestPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl || '/', 'http://localhost').pathname);
  const relative = pathname.replace(/^\/+/, '');
  const candidate = path.resolve(buildRoot, relative || 'index.html');
  const rel = path.relative(buildRoot, candidate);

  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    return null;
  }

  return candidate;
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  response.statusCode = 200;
  response.setHeader('Content-Type', MIME[extension] || 'application/octet-stream');
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  fs.createReadStream(filePath).pipe(response);
}

try {
  build();
} catch (error) {
  fail(error && error.stack ? error.stack : String(error), 2);
}

const server = http.createServer((request, response) => {
  let candidate;
  try {
    candidate = resolveRequestPath(request.url);
  } catch {
    response.statusCode = 400;
    response.end('Bad request');
    return;
  }

  if (!candidate) {
    response.statusCode = 403;
    response.end('Forbidden');
    return;
  }

  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    sendFile(response, candidate);
    return;
  }

  // Hash-routed V26 uses index.html as the browser entry. Keep a safe
  // history-route fallback for copied/direct URLs as well.
  sendFile(response, path.join(buildRoot, 'index.html'));
});

server.on('error', (error) => fail(error && error.stack ? error.stack : String(error), 3));
server.listen(port, host, () => {
  console.log(`ASPIRENEST_V26_PRODUCTION_RUNTIME_READY=http://${host}:${port}`);
  console.log(`ASPIRENEST_V26_BUILD_ROOT=${buildRoot}`);
});
