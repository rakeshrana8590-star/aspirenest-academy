'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const EXPECTED_V26_SHA256 =
  'ee8ce82aea31f3e02a9c05d7afd9d28aa489e4dcff6a7c19674dcedf375044a4';

const PRODUCTION_PROVIDER_RELATIVE_PATH =
  'integration/aspirenest-production-provider.js';

const POST_V26_RUNTIME_OVERRIDE_RELATIVE_PATHS = Object.freeze([
  'manifest.webmanifest',
  'sw.js',
  'icons/aspirenest-a-192.png',
  'icons/aspirenest-a-512.png',
  'icons/aspirenest-a-maskable-512.png',
]);

const REQUIRED_ADAPTER_METHODS = [
  'getSession',
  'login',
  'logout',
  'authorize',
  'recordProgress',
  'recordAttempt',
  'recordStudyAction',
  'requestMentorHelp',
  'openCanonical',
];

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function readList(filePath) {
  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function normalizeRelative(value) {
  return value.split(path.sep).join('/').replace(/^\.?\//, '');
}

function listFiles(root) {
  const result = [];

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        result.push(normalizeRelative(path.relative(root, full)));
      }
    }
  }

  if (fs.existsSync(root)) {
    walk(root);
  }

  return result.sort();
}

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function copyFile(sourceRoot, outputRoot, relativePath) {
  const source = path.join(sourceRoot, relativePath);
  const destination = path.join(outputRoot, relativePath);

  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
    throw new Error(`Allowlisted source file is missing: ${relativePath}`);
  }

  ensureParent(destination);
  fs.copyFileSync(source, destination);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stdout = result.stdout || '';
    const stderr = result.stderr || '';
    throw new Error(
      `${command} failed with status ${result.status}\n${stdout}\n${stderr}`,
    );
  }

  return result;
}

function findV26Root(extractRoot) {
  const direct = path.join(extractRoot, 'AN_V26');
  if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) {
    return direct;
  }

  const candidates = fs
    .readdirSync(extractRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(extractRoot, entry.name))
    .filter((candidate) => path.basename(candidate) === 'AN_V26');

  if (candidates.length !== 1) {
    throw new Error('Unable to identify one AN_V26 root in the locked ZIP.');
  }

  return candidates[0];
}

function parseProductionMethodNames(templateText) {
  const marker =
    'window.__aspirenestExactResourceAdapter = Object.freeze({';
  const markerIndex = templateText.indexOf(marker);

  if (markerIndex < 0) {
    throw new Error('Production adapter template marker is missing.');
  }

  const lines = templateText.slice(markerIndex).split(/\r?\n/);
  const methodNames = [];
  let depth = 0;
  let started = false;

  for (const line of lines) {
    if (!started) {
      if (line.includes('Object.freeze({')) {
        started = true;
        depth += (line.match(/\{/g) || []).length;
        depth -= (line.match(/\}/g) || []).length;
      }
      continue;
    }

    if (depth === 1) {
      const match = line.match(
        /^\s{4}([A-Za-z_$][A-Za-z0-9_$]*)\s*:/,
      );
      if (match) {
        methodNames.push(match[1]);
      }
    }

    depth += (line.match(/\{/g) || []).length;
    depth -= (line.match(/\}/g) || []).length;

    if (depth <= 0) {
      break;
    }
  }

  const unique = [...new Set(methodNames)];

  if (methodNames.length !== 183 || unique.length !== 182) {
    throw new Error(
      `Unexpected production adapter surface: entries=${methodNames.length}, unique=${unique.length}`,
    );
  }

  return unique;
}

function generateProductionOnlyAdapter(methodNames) {
  const methodsJson = JSON.stringify(methodNames, null, 2);
  const requiredJson = JSON.stringify(REQUIRED_ADAPTER_METHODS, null, 2);

  return `(() => {
  'use strict';

  /**
   * Production-only AspireNest adapter selector.
   *
   * - Never loads or references the deterministic demo adapter.
   * - Uses window.__aspirenestExactResourceAdapter when a real bridge exists.
   * - Fails closed for every unavailable operation.
   * - Keeps openCanonical as a local route-only action.
   */
  const external =
    window.__aspirenestExactResourceAdapter &&
    typeof window.__aspirenestExactResourceAdapter === 'object'
      ? window.__aspirenestExactResourceAdapter
      : Object.create(null);

  const required = ${requiredJson};
  const methodNames = ${methodsJson};
  const missing = required.filter(
    (name) => typeof external[name] !== 'function'
  );

  const unavailable = (name) => {
    if (name === 'getSession') {
      return Promise.resolve({
        authenticated: false,
        user: null,
        roles: [],
        activeRole: null,
        code: 'PRODUCTION_ADAPTER_UNAVAILABLE'
      });
    }

    if (name === 'authorize') {
      return Promise.resolve({
        allowed: false,
        code: 'PRODUCTION_ADAPTER_UNAVAILABLE'
      });
    }

    return Promise.resolve({
      ok: false,
      code: 'PRODUCTION_ADAPTER_UNAVAILABLE',
      method: name
    });
  };

  const adapter = {
    mode: missing.length ? 'production-unavailable' : 'production',
    missingProductionMethods: missing
  };

  for (const name of methodNames) {
    adapter[name] = (...args) => {
      const handler = external[name];

      if (typeof handler === 'function') {
        try {
          return Promise.resolve(handler.apply(external, args));
        } catch (error) {
          return Promise.reject(error);
        }
      }

      if (name === 'openCanonical') {
        const request = args[0] || {};
        const route = typeof request.route === 'string' ? request.route : '';

        if (!route) {
          return unavailable(name);
        }

        window.location.hash = route.startsWith('#') ? route : '#' + route;

        return Promise.resolve({
          ok: true,
          route,
          mode: 'route-only'
        });
      }

      return unavailable(name);
    };
  }

  window.AspireNestExactAdapter = Object.freeze(adapter);

  window.dispatchEvent(
    new CustomEvent('aspirenest:exact-adapter-ready', {
      detail: {
        mode: window.AspireNestExactAdapter.mode,
        missing
      }
    })
  );
})();
`;
}

function sanitizeIndex(sourceText) {
  const demoPattern =
    /^\s*<script\s+src=["']integration\/demo-adapter\.js["']><\/script>\s*$/gm;
  const sanitized = sourceText.replace(demoPattern, '');

  if (sanitized === sourceText) {
    throw new Error('Expected demo-adapter script reference was not found.');
  }

  if (/demo-adapter\.js|session\.html/.test(sanitized)) {
    throw new Error('Local/demo reference remains in sanitized index.html.');
  }

  return sanitized.replace(/\n{3,}/g, '\n\n');
}

function sanitizeServiceWorker(sourceText) {
  const replacement = `const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'integration/aspirenest-adapter.js',
  'vendor/jszip.min.js',
  'assets/templates/AspireNest_Mock_Test_Two_Sheet_Import_Template.xlsx'
];`;

  const sanitized = sourceText.replace(
    /const ASSETS = \[[\s\S]*?\];/,
    replacement,
  );

  if (sanitized === sourceText) {
    throw new Error('Service-worker ASSETS block was not replaced.');
  }

  if (
    /demo-adapter\.js|production-adapter-template\.js|session\.html/.test(
      sanitized,
    )
  ) {
    throw new Error('Forbidden source/demo reference remains in sw.js.');
  }

  return sanitized;
}

function globToRegExp(pattern) {
  let result = '^';

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];

    if (character === '*') {
      if (pattern[index + 1] === '*') {
        result += '.*';
        index += 1;
      } else {
        result += '[^/]*';
      }
      continue;
    }

    if ('\\.^$+?()[]{}|'.includes(character)) {
      result += `\\${character}`;
    } else {
      result += character;
    }
  }

  result += '$';
  return new RegExp(result, 'i');
}

function matchesAnyPattern(relativePath, patterns) {
  return patterns.some((pattern) => globToRegExp(pattern).test(relativePath));
}

function parseQuotedLocalReferences(text) {
  const references = new Set();
  const expression = /['"`]([^'"`\s<>]+)['"`]/g;
  let match;

  while ((match = expression.exec(text))) {
    const value = match[1];

    if (
      value.startsWith('http:') ||
      value.startsWith('https:') ||
      value.startsWith('data:') ||
      value.startsWith('#')
    ) {
      continue;
    }

    const clean = value
      .split('?')[0]
      .replace(/^\.?\//, '')
      .replace(/^\//, '');

    if (
      clean &&
      (
        clean.includes('/') ||
        /\.[A-Za-z0-9]{1,8}$/.test(clean)
      )
    ) {
      references.add(clean);
    }
  }

  return [...references].sort();
}

function composeProductionProvider({
  bundleRoot,
  providerFile,
}) {
  if (
    !providerFile
    || !fs.existsSync(providerFile)
    || !fs.statSync(providerFile).isFile()
  ) {
    throw new Error(
      'Production provider artifact is required for bundle composition.',
    );
  }

  const providerPath = path.join(
    bundleRoot,
    PRODUCTION_PROVIDER_RELATIVE_PATH,
  );
  const indexPath = path.join(bundleRoot, 'index.html');
  const swPath = path.join(bundleRoot, 'sw.js');

  for (const requiredPath of [indexPath, swPath]) {
    if (!fs.existsSync(requiredPath)) {
      throw new Error(
        `Required bundle composition file is missing: ${requiredPath}`,
      );
    }
  }

  const providerTag =
    '  <script src="integration/aspirenest-production-provider.js"></script>';
  const adapterTag =
    '  <script src="integration/aspirenest-adapter.js"></script>';

  let indexText = fs.readFileSync(indexPath, 'utf8');

  if (indexText.includes(providerTag)) {
    throw new Error(
      'Production provider script is already present before composition.',
    );
  }

  if (indexText.split(adapterTag).length !== 2) {
    throw new Error(
      'Production adapter script anchor must appear exactly once.',
    );
  }

  indexText = indexText.replace(
    adapterTag,
    `${providerTag}\n${adapterTag}`,
  );

  const providerAsset =
    "  'integration/aspirenest-production-provider.js',";
  const adapterAsset =
    "  'integration/aspirenest-adapter.js',";

  let swText = fs.readFileSync(swPath, 'utf8');

  if (swText.includes(providerAsset)) {
    throw new Error(
      'Production provider service-worker asset is already present.',
    );
  }

  if (swText.split(adapterAsset).length !== 2) {
    throw new Error(
      'Production adapter service-worker anchor must appear exactly once.',
    );
  }

  swText = swText.replace(
    adapterAsset,
    `${providerAsset}\n${adapterAsset}`,
  );

  ensureParent(providerPath);
  fs.copyFileSync(providerFile, providerPath);
  fs.writeFileSync(indexPath, indexText, 'utf8');
  fs.writeFileSync(swPath, swText, 'utf8');

  return Object.freeze({
    providerRelativePath:
      PRODUCTION_PROVIDER_RELATIVE_PATH,
    providerSha256: sha256File(providerPath),
    providerBytes: fs.statSync(providerPath).size,
    providerBeforeAdapter: true,
    serviceWorkerReferenceAdded: true,
  });
}

function assertProductionBundle({
  bundleRoot,
  allowlistPath,
  denylistPath,
}) {
  const allowlist = readList(allowlistPath).sort();
  const denylist = readList(denylistPath);
  const actualFiles = listFiles(bundleRoot);

  const missing = allowlist.filter((item) => !actualFiles.includes(item));
  const unexpected = actualFiles.filter((item) => !allowlist.includes(item));
  const forbidden = actualFiles.filter((item) =>
    matchesAnyPattern(item, denylist),
  );

  const indexPath = path.join(bundleRoot, 'index.html');
  const swPath = path.join(bundleRoot, 'sw.js');
  const adapterPath = path.join(
    bundleRoot,
    'integration',
    'aspirenest-adapter.js',
  );
  const providerPath = path.join(
    bundleRoot,
    'integration',
    'aspirenest-production-provider.js',
  );

  for (const filePath of [
    indexPath,
    swPath,
    adapterPath,
    providerPath,
  ]) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required bundle file is missing: ${filePath}`);
    }
  }

  const indexText = fs.readFileSync(indexPath, 'utf8');
  const swText = fs.readFileSync(swPath, 'utf8');
  const adapterText = fs.readFileSync(adapterPath, 'utf8');
  const providerText = fs.readFileSync(providerPath, 'utf8');

  const contentViolations = [];

  if (
    !providerText.includes(
      '__aspirenestExactResourceAdapter',
    )
  ) {
    contentViolations.push(
      'integration/aspirenest-production-provider.js:missing-provider-global',
    );
  }

  if (
    !providerText.includes(
      'PRODUCTION_HANDLER_DISABLED',
    )
  ) {
    contentViolations.push(
      'integration/aspirenest-production-provider.js:missing-fail-closed-code',
    );
  }

  if (
    /^[ \t]*\/\/[#@][ \t]*sourceMappingURL=/m.test(
      providerText,
    )
    || /\/\*[#@][ \t]*sourceMappingURL=[\s\S]*?\*\//.test(
      providerText,
    )
  ) {
    contentViolations.push(
      'integration/aspirenest-production-provider.js:source-map-directive',
    );
  }

  const forbiddenContent = [
    ['demo-adapter.js', /demo-adapter\.js/],
    ['AspireNestDemoAdapter', /AspireNestDemoAdapter/],
    ['session.html', /session\.html/],
    ['NOT_WIRED', /\bNOT_WIRED\b/],
    ['ui-local', /\bui-local\b/],
    ['ui-draft', /\bui-draft\b/],
    ['local-active', /\blocal-active\b/],
    ['dormant-config', /\bdormant-config\b/],
    ['PROVIDER_DISABLED', /\bPROVIDER_DISABLED\b/],
  ];

  for (const [label, pattern] of forbiddenContent) {
    for (const [name, text] of [
      ['index.html', indexText],
      ['sw.js', swText],
      ['integration/aspirenest-adapter.js', adapterText],
    ]) {
      if (pattern.test(text)) {
        contentViolations.push(`${name}:${label}`);
      }
    }
  }

  if (!/PRODUCTION_ADAPTER_UNAVAILABLE/.test(adapterText)) {
    contentViolations.push(
      'integration/aspirenest-adapter.js:missing-fail-closed-code',
    );
  }

  if (
    !/mode:\s*missing\.length\s*\?\s*'production-unavailable'\s*:\s*'production'/.test(
      adapterText,
    )
  ) {
    contentViolations.push(
      'integration/aspirenest-adapter.js:missing-production-mode-selection',
    );
  }

  const scriptReferences = [
    ...indexText.matchAll(
      /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi,
    ),
  ].map((match) => match[1].replace(/^\.?\//, ''));

  const expectedScripts = [
    'vendor/jszip.min.js',
    'integration/aspirenest-production-provider.js',
    'integration/aspirenest-adapter.js',
    'app.js',
  ];

  if (JSON.stringify(scriptReferences) !== JSON.stringify(expectedScripts)) {
    contentViolations.push(
      `index.html:unexpected-script-order=${scriptReferences.join(',')}`,
    );
  }

  const swReferences = parseQuotedLocalReferences(swText)
    .filter((item) => item !== '/')
    .filter((item) => item !== './');

  const missingSwReferences = swReferences.filter(
    (item) => !actualFiles.includes(item),
  );

  if (
    !swReferences.includes(
      'integration/aspirenest-production-provider.js',
    )
  ) {
    contentViolations.push(
      'sw.js:missing-production-provider-reference',
    );
  }

  const result = {
    ok:
      missing.length === 0 &&
      unexpected.length === 0 &&
      forbidden.length === 0 &&
      contentViolations.length === 0 &&
      missingSwReferences.length === 0,
    allowlistCount: allowlist.length,
    actualFileCount: actualFiles.length,
    missing,
    unexpected,
    forbidden,
    contentViolations,
    serviceWorkerReferences: swReferences,
    missingServiceWorkerReferences: missingSwReferences,
  };

  if (!result.ok) {
    const error = new Error(
      `Production bundle assertion failed:\n${JSON.stringify(result, null, 2)}`,
    );
    error.result = result;
    throw error;
  }

  return result;
}

function prepareProductionBundle({
  zipPath,
  outputRoot,
  allowlistPath,
  denylistPath,
  providerFile,
  supplementalSourceRoot,
}) {
  const actualSha = sha256File(zipPath);

  if (actualSha !== EXPECTED_V26_SHA256) {
    throw new Error(
      `Locked V26 checksum mismatch: expected ${EXPECTED_V26_SHA256}, found ${actualSha}`,
    );
  }

  const resolvedSupplementalSourceRoot =
    supplementalSourceRoot
      ? path.resolve(supplementalSourceRoot)
      : path.join(
          path.dirname(path.dirname(allowlistPath)),
          'runtime',
          'v26-shell',
        );

  if (
    !fs.existsSync(resolvedSupplementalSourceRoot)
    || !fs.statSync(resolvedSupplementalSourceRoot).isDirectory()
  ) {
    throw new Error(
      `Post-V26 runtime override source is missing: ${resolvedSupplementalSourceRoot}`,
    );
  }

  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'aspirenest-v26-bundle-'),
  );

  try {
    run('unzip', ['-q', zipPath, '-d', tempRoot]);
    const sourceRoot = findV26Root(tempRoot);
    const allowlist = readList(allowlistPath);

    fs.rmSync(outputRoot, { recursive: true, force: true });
    fs.mkdirSync(outputRoot, { recursive: true });

    for (const relativePath of allowlist) {
      if (
        relativePath === 'integration/aspirenest-adapter.js'
        || relativePath === PRODUCTION_PROVIDER_RELATIVE_PATH
      ) {
        continue;
      }

      if (
        POST_V26_RUNTIME_OVERRIDE_RELATIVE_PATHS.includes(
          relativePath,
        )
      ) {
        copyFile(
          resolvedSupplementalSourceRoot,
          outputRoot,
          relativePath,
        );
        continue;
      }

      copyFile(sourceRoot, outputRoot, relativePath);
    }

    const indexSource = fs.readFileSync(
      path.join(sourceRoot, 'index.html'),
      'utf8',
    );
    fs.writeFileSync(
      path.join(outputRoot, 'index.html'),
      sanitizeIndex(indexSource),
      'utf8',
    );

    const swSource = fs.readFileSync(
      path.join(resolvedSupplementalSourceRoot, 'sw.js'),
      'utf8',
    );
    fs.writeFileSync(
      path.join(outputRoot, 'sw.js'),
      swSource,
      'utf8',
    );

    const templateText = fs.readFileSync(
      path.join(
        sourceRoot,
        'integration',
        'production-adapter-template.js',
      ),
      'utf8',
    );
    const methodNames = parseProductionMethodNames(templateText);
    const adapterPath = path.join(
      outputRoot,
      'integration',
      'aspirenest-adapter.js',
    );
    ensureParent(adapterPath);
    fs.writeFileSync(
      adapterPath,
      generateProductionOnlyAdapter(methodNames),
      'utf8',
    );

    const composition = composeProductionProvider({
      bundleRoot: outputRoot,
      providerFile,
    });

    const assertion = assertProductionBundle({
      bundleRoot: outputRoot,
      allowlistPath,
      denylistPath,
    });

    return {
      zipSha256: actualSha,
      sourceRoot,
      outputRoot,
      supplementalSourceRoot: resolvedSupplementalSourceRoot,
      postV26RuntimeOverrideCount:
        POST_V26_RUNTIME_OVERRIDE_RELATIVE_PATHS.length,
      productionAdapterMethodCount: methodNames.length,
      composition,
      assertion,
    };
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

module.exports = {
  EXPECTED_V26_SHA256,
  PRODUCTION_PROVIDER_RELATIVE_PATH,
  assertProductionBundle,
  composeProductionProvider,
  listFiles,
  prepareProductionBundle,
  readList,
  sha256File,
};
