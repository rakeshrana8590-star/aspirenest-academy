'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const foundation = require('./productionBridgeFoundation.js');
const methodRegistry = require('./productionBridgeMethodRegistry.json');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const runtimeAdapterPath = path.join(
  repoRoot,
  'runtime',
  'v26-shell',
  'integration',
  'aspirenest-adapter.js',
);

function loadRuntimeMethodNames() {
  const source = fs.readFileSync(runtimeAdapterPath, 'utf8');

  class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  }

  const window = {
    location: { hash: '' },
    dispatchEvent() {},
  };

  vm.runInNewContext(source, {
    window,
    CustomEvent,
    Promise,
    Object,
    Error,
    console,
  }, {
    filename: runtimeAdapterPath,
  });

  return Object.keys(window.AspireNestExactAdapter)
    .filter(
      (name) =>
        typeof window.AspireNestExactAdapter[name] === 'function',
    )
    .sort();
}

async function main() {
  const methodNames = loadRuntimeMethodNames();

  assert.strictEqual(methodNames.length, 182);
  assert.strictEqual(methodRegistry.adapterMethodCount, 182);
  assert.strictEqual(methodRegistry.coreRequiredMethodCount, 9);
  assert.deepStrictEqual(
    methodRegistry.methods.map((item) => item.name).sort(),
    methodNames,
  );
  const lp3AssignedRegistryMethods = methodRegistry.methods.filter(
    (item) => item.owner !== null && item.owner !== "",
  );
  const lp3SafeDisabledRegistryMethods = methodRegistry.methods.filter(
    (item) =>
      (item.owner === null || item.owner === "") &&
      item.ownerState === "SAFE_DISABLED_PENDING_OWNER" &&
      item.runtimeActivation !== true,
  );
  assert.strictEqual(lp3AssignedRegistryMethods.length, 33);
  assert.strictEqual(lp3SafeDisabledRegistryMethods.length, 149);
  assert.strictEqual(
    lp3AssignedRegistryMethods.length +
      lp3SafeDisabledRegistryMethods.length,
    methodRegistry.methods.length,
  );

  const expectedDeferredMethods = Object.freeze({
    recordAttempt: Object.freeze({
      deferredOwnerPhases: Object.freeze(['4.2', '6.1']),
      deferReason:
        'MOCK_SERVER_AUTHORITY_AND_IDEMPOTENCY_NOT_OWNED_BY_LP1',
    }),
    recordProgress: Object.freeze({
      deferredOwnerPhases: Object.freeze(['4.7']),
      deferReason:
        'CANONICAL_CROSS_MODULE_PROGRESS_PERSISTENCE_NOT_OWNED_BY_LP1',
    }),
    recordStudyAction: Object.freeze({
      deferredOwnerPhases: Object.freeze(['4.1', '4.4']),
      deferReason:
        'PRIVATE_NOTE_VIDEO_STUDY_ACTION_PERSISTENCE_NOT_OWNED_BY_LP1',
    }),
    requestMentorHelp: Object.freeze({
      deferredOwnerPhases: Object.freeze(['5.2']),
      deferReason:
        'ASSIGNED_LEARNER_MENTOR_QUESTION_AUTHORITY_NOT_OWNED_BY_LP1',
    }),
  });

  const explicitlyDeferredMethods =
    methodRegistry.methods.filter(
      (item) =>
        item.auditClassification ===
        'INTENTIONALLY_SAFE_DISABLED_DEFERRED_TO_OWNER_PHASE',
    );

  assert.strictEqual(explicitlyDeferredMethods.length, 4);

  for (const item of explicitlyDeferredMethods) {
    const expected = expectedDeferredMethods[item.name];

    assert(expected);
    assert.deepStrictEqual(
      item.deferredOwnerPhases,
      expected.deferredOwnerPhases,
    );
    assert.strictEqual(
      item.deferReason,
      expected.deferReason,
    );
    assert.strictEqual(
      item.ownerState,
      'SAFE_DISABLED_PENDING_OWNER',
    );
    assert.strictEqual(item.owner, null);
  }

  assert(
    methodRegistry.methods
      .filter(
        (item) =>
          !Object.prototype.hasOwnProperty.call(
            expectedDeferredMethods,
            item.name,
          ),
      )
      .every(
        (item) =>
          !Object.prototype.hasOwnProperty.call(
            item,
            'deferredOwnerPhases',
          ) &&
          !Object.prototype.hasOwnProperty.call(
            item,
            'deferReason',
          ),
      ),
  );

  const foundationSource = fs.readFileSync(
    path.join(__dirname, 'productionBridgeFoundation.js'),
    'utf8',
  );

  assert(
    !foundationSource.includes(
      '__aspirenestExactResourceAdapter',
    ),
  );

  let idCounter = 0;
  const logs = [];
  const registry = foundation.createHandlerRegistry({
    defaultTimeoutMs: 30,
    idFactory: () => `id-${++idCounter}`,
    now: () => 1700000000000,
    logSink: (event) => logs.push(event),
  });

  const adapter = foundation.createAdapterSurface(
    methodNames,
    registry,
  );

  assert(Object.isFrozen(adapter));
  assert.strictEqual(
    Object.keys(adapter).length,
    182,
  );

  const disabledResults = await Promise.all(
    methodNames.map((name) =>
      adapter[name]({
        password: 'must-not-log',
        token: 'must-not-log',
        email: 'must-not-log@example.invalid',
      }),
    ),
  );

  assert.strictEqual(disabledResults.length, 182);
  assert(
    disabledResults.every(
      (result) =>
        result.ok === false &&
        result.code ===
          foundation.CODES.HANDLER_DISABLED &&
        result.details.ownerState ===
          'SAFE_DISABLED_PENDING_OWNER',
    ),
  );

  assert(
    logs.every((event) => {
      const text = JSON.stringify(event);
      return (
        !text.includes('must-not-log') &&
        !text.includes('must-not-log@example.invalid')
      );
    }),
  );

  registry.register(
    'getSession',
    async () => ({
      authenticated: true,
      user: {
        uid: 'student-1',
      },
    }),
    {
      owner: 'test.session.owner',
    },
  );

  const session = await adapter.getSession(
    {},
    {
      requestId: 'req-fixed',
      correlationId: 'corr-fixed',
    },
  );

  assert.strictEqual(session.ok, true);
  assert.strictEqual(session.code, foundation.CODES.OK);
  assert.strictEqual(session.requestId, 'req-fixed');
  assert.strictEqual(session.correlationId, 'corr-fixed');
  assert.strictEqual(session.method, 'getSession');
  assert.strictEqual(session.data.authenticated, true);

  assert.throws(
    () =>
      registry.register(
        'getSession',
        async () => ({}),
        {
          owner: 'conflicting.owner',
        },
      ),
    (error) =>
      error &&
      error.code === foundation.CODES.OWNER_COLLISION,
  );

  registry.register(
    'login',
    async () =>
      new Promise(() => {}),
    {
      owner: 'test.timeout.owner',
    },
  );

  const timeout = await adapter.login(
    {},
    {
      timeoutMs: 5,
    },
  );

  assert.strictEqual(timeout.ok, false);
  assert.strictEqual(
    timeout.code,
    foundation.CODES.TIMEOUT,
  );
  assert.strictEqual(timeout.retryable, true);

  registry.register(
    'logout',
    async () => ({
      ok: false,
      code: 'AUTH_SIGN_OUT_DENIED',
      message: 'Denied safely.',
      retryable: false,
    }),
    {
      owner: 'test.failure.owner',
    },
  );

  const explicitFailure = await adapter.logout({});
  assert.strictEqual(explicitFailure.ok, false);
  assert.strictEqual(
    explicitFailure.code,
    'AUTH_SIGN_OUT_DENIED',
  );
  assert(explicitFailure.requestId);
  assert(explicitFailure.correlationId);

  registry.register(
    'authorize',
    async () => {
      throw new Error(
        'secret internal stack and credential data',
      );
    },
    {
      owner: 'test.error.owner',
    },
  );

  const handlerError = await adapter.authorize({});
  assert.strictEqual(handlerError.ok, false);
  assert.strictEqual(
    handlerError.code,
    foundation.CODES.HANDLER_ERROR,
  );
  assert(
    !JSON.stringify(handlerError).includes(
      'secret internal stack',
    ),
  );

  registry.register(
    'recordProgress',
    async () => ({
      recorded: true,
    }),
    {
      owner: 'test.abort.owner',
    },
  );

  const controller = new AbortController();
  controller.abort();

  const aborted = await adapter.recordProgress(
    {},
    {
      signal: controller.signal,
    },
  );

  assert.strictEqual(aborted.ok, false);
  assert.strictEqual(
    aborted.code,
    foundation.CODES.ABORTED,
  );

  const redacted = foundation.sanitizeForLog({
    password: 'password-value',
    nested: {
      token: 'token-value',
      safe: 'visible',
    },
  });

  assert.strictEqual(redacted.password, '[REDACTED]');
  assert.strictEqual(redacted.nested.token, '[REDACTED]');
  assert.strictEqual(redacted.nested.safe, 'visible');

  const core = methodRegistry.methods.filter(
    (item) => item.launchCore,
  );

  assert.strictEqual(core.length, 9);
  const lp3RuntimeOwnedCoreMethods = core.filter(
    (item) =>
      item.owner !== null &&
      item.owner !== "" &&
      item.runtimeActivation === true &&
      item.ownerState !== "SAFE_DISABLED_PENDING_OWNER",
  );
  const lp3SafeDisabledCoreMethods = core.filter(
    (item) =>
      (item.owner === null || item.owner === "") &&
      item.ownerState === "SAFE_DISABLED_PENDING_OWNER" &&
      item.runtimeActivation !== true,
  );
  assert.strictEqual(
    lp3RuntimeOwnedCoreMethods.length +
      lp3SafeDisabledCoreMethods.length,
    core.length,
  );

  console.log('ADAPTER_METHODS_TOTAL=182');
  console.log('METHOD_REGISTRY_ROWS=182');
  console.log('CORE_REQUIRED_METHODS=9');
  console.log('EXPLICIT_SAFE_DISABLED_METADATA_ROWS=4');
  console.log('EXPLICIT_SAFE_DISABLED_METADATA_CLOSURE=4/4_PASS');
  console.log('PERSISTENT_RUNTIME_OWNER_ASSIGNMENT_CHANGE=NO');
  console.log('METHOD_LEVEL_OWNER_STATE_CLOSURE=182/182_PASS');
  console.log('STANDARD_SUCCESS_ENVELOPE=PASS');
  console.log('STANDARD_FAILURE_ENVELOPE=PASS');
  console.log('REQUEST_ID=PASS');
  console.log('CORRELATION_ID=PASS');
  console.log('TIMEOUT=PASS');
  console.log('ABORT_SIGNAL=PASS');
  console.log('SAFE_LOG_REDACTION=PASS');
  console.log('HANDLER_ERROR_SANITIZATION=PASS');
  console.log('OWNER_COLLISION_REJECTION=PASS');
  console.log('PROVIDER_ACTIVATION=NO');
  console.log('RUNTIME_LOAD=NO');
  console.log('FOUNDATION_TEST_STATUS=GREEN');
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
