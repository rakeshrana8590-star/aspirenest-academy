(function exposeAspireNestV26BridgeFoundation(root, factory) {
  'use strict';

  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root && !root.AspireNestV26ProductionBridgeFoundation) {
    Object.defineProperty(
      root,
      'AspireNestV26ProductionBridgeFoundation',
      {
        configurable: false,
        enumerable: false,
        writable: false,
        value: api,
      },
    );
  }
})(
  typeof globalThis !== 'undefined' ? globalThis : this,
  function createAspireNestV26BridgeFoundation() {
    'use strict';

    const CODES = Object.freeze({
      OK: 'OK',
      HANDLER_DISABLED: 'PRODUCTION_HANDLER_DISABLED',
      HANDLER_ERROR: 'PRODUCTION_HANDLER_ERROR',
      OWNER_COLLISION: 'PRODUCTION_HANDLER_OWNER_COLLISION',
      TIMEOUT: 'PRODUCTION_REQUEST_TIMEOUT',
      ABORTED: 'PRODUCTION_REQUEST_ABORTED',
      INVALID_REQUEST: 'PRODUCTION_INVALID_REQUEST',
    });

    const SENSITIVE_KEY_PATTERN =
      /password|passcode|token|secret|authorization|cookie|credential|email|phone|uid|userId/i;

    function createError(code, message) {
      const error = new Error(message);
      error.code = code;
      return error;
    }

    function defaultIdFactory() {
      if (
        typeof crypto !== 'undefined' &&
        crypto &&
        typeof crypto.randomUUID === 'function'
      ) {
        return crypto.randomUUID();
      }

      const random = Math.random().toString(36).slice(2);
      return `v26-${Date.now().toString(36)}-${random}`;
    }

    function sanitizeForLog(value, seen) {
      if (value === null || value === undefined) {
        return value;
      }

      if (typeof value !== 'object') {
        return value;
      }

      const visited = seen || new WeakSet();

      if (visited.has(value)) {
        return '[Circular]';
      }

      visited.add(value);

      if (Array.isArray(value)) {
        return value.map((item) => sanitizeForLog(item, visited));
      }

      const output = {};

      for (const [key, item] of Object.entries(value)) {
        output[key] = SENSITIVE_KEY_PATTERN.test(key)
          ? '[REDACTED]'
          : sanitizeForLog(item, visited);
      }

      return output;
    }

    function createSafeLogger(sink) {
      const target =
        typeof sink === 'function'
          ? sink
          : function noOpLogSink() {};

      return function safeLog(level, event, context) {
        target(Object.freeze({
          level: String(level || 'info'),
          event: String(event || 'bridge.event'),
          context: sanitizeForLog(context || {}),
        }));
      };
    }

    function createContext(method, options, dependencies) {
      const settings = options || {};
      const idFactory = dependencies.idFactory;
      const now = dependencies.now;

      return Object.freeze({
        requestId:
          typeof settings.requestId === 'string' && settings.requestId
            ? settings.requestId
            : idFactory(),
        correlationId:
          typeof settings.correlationId === 'string' &&
          settings.correlationId
            ? settings.correlationId
            : idFactory(),
        method,
        startedAt: now(),
      });
    }

    function successEnvelope(context, data) {
      return Object.freeze({
        ok: true,
        code: CODES.OK,
        requestId: context.requestId,
        correlationId: context.correlationId,
        method: context.method,
        retryable: false,
        data: data === undefined ? null : data,
      });
    }

    function failureEnvelope(
      context,
      code,
      message,
      retryable,
      details,
    ) {
      return Object.freeze({
        ok: false,
        code,
        requestId: context.requestId,
        correlationId: context.correlationId,
        method: context.method,
        retryable: Boolean(retryable),
        message: String(message || code),
        details: details || null,
      });
    }

    function normalizeHandlerEnvelope(context, result) {
      if (
        result &&
        typeof result === 'object' &&
        typeof result.ok === 'boolean' &&
        typeof result.code === 'string'
      ) {
        return Object.freeze({
          ...result,
          requestId: result.requestId || context.requestId,
          correlationId:
            result.correlationId || context.correlationId,
          method: result.method || context.method,
          retryable: Boolean(result.retryable),
        });
      }

      return successEnvelope(context, result);
    }

    function createHandlerRegistry(options) {
      const settings = options || {};
      const handlers = new Map();
      const defaultTimeoutMs =
        Number.isFinite(settings.defaultTimeoutMs) &&
        settings.defaultTimeoutMs > 0
          ? settings.defaultTimeoutMs
          : 10000;
      const dependencies = {
        idFactory:
          typeof settings.idFactory === 'function'
            ? settings.idFactory
            : defaultIdFactory,
        now:
          typeof settings.now === 'function'
            ? settings.now
            : Date.now,
      };
      const log = createSafeLogger(settings.logSink);

      function register(method, handler, metadata) {
        const name = String(method || '').trim();
        const owner = String(
          metadata && metadata.owner
            ? metadata.owner
            : '',
        ).trim();

        if (!name || typeof handler !== 'function' || !owner) {
          throw createError(
            CODES.INVALID_REQUEST,
            'Method, handler and owner are required.',
          );
        }

        if (handlers.has(name)) {
          const existing = handlers.get(name);

          throw createError(
            CODES.OWNER_COLLISION,
            `Handler owner collision for ${name}: ` +
              `${existing.owner} vs ${owner}`,
          );
        }

        handlers.set(name, Object.freeze({
          handler,
          owner,
        }));

        return Object.freeze({
          ok: true,
          method: name,
          owner,
        });
      }

      function unregister(method, owner) {
        const name = String(method || '').trim();
        const existing = handlers.get(name);

        if (!existing) {
          return false;
        }

        if (owner && existing.owner !== owner) {
          return false;
        }

        return handlers.delete(name);
      }

      function has(method) {
        return handlers.has(String(method || '').trim());
      }

      function list() {
        return Object.freeze(
          [...handlers.entries()]
            .map(([method, value]) => Object.freeze({
              method,
              owner: value.owner,
            }))
            .sort((a, b) => a.method.localeCompare(b.method)),
        );
      }

      async function invoke(method, payload, options) {
        const name = String(method || '').trim();
        const settingsForRequest = options || {};
        const context = createContext(
          name,
          settingsForRequest,
          dependencies,
        );
        const entry = handlers.get(name);

        if (!name) {
          return failureEnvelope(
            context,
            CODES.INVALID_REQUEST,
            'Bridge method is required.',
            false,
          );
        }

        if (!entry) {
          log('warn', 'bridge.handler.disabled', {
            method: name,
            requestId: context.requestId,
            correlationId: context.correlationId,
            payload,
          });

          return failureEnvelope(
            context,
            CODES.HANDLER_DISABLED,
            `No production owner is registered for ${name}.`,
            false,
            {
              ownerState: 'SAFE_DISABLED_PENDING_OWNER',
            },
          );
        }

        const externalSignal = settingsForRequest.signal;
        const timeoutMs =
          Number.isFinite(settingsForRequest.timeoutMs) &&
          settingsForRequest.timeoutMs > 0
            ? settingsForRequest.timeoutMs
            : defaultTimeoutMs;

        if (externalSignal && externalSignal.aborted) {
          return failureEnvelope(
            context,
            CODES.ABORTED,
            `Request aborted before ${name} started.`,
            false,
          );
        }

        let timer = null;
        let removeAbortListener = function noOpRemove() {};

        const timeoutPromise = new Promise((resolve, reject) => {
          timer = setTimeout(() => {
            reject(createError(
              CODES.TIMEOUT,
              `Production handler timed out: ${name}`,
            ));
          }, timeoutMs);
        });

        const abortPromise = new Promise((resolve, reject) => {
          if (
            !externalSignal ||
            typeof externalSignal.addEventListener !== 'function'
          ) {
            return;
          }

          const onAbort = () => {
            reject(createError(
              CODES.ABORTED,
              `Production handler aborted: ${name}`,
            ));
          };

          externalSignal.addEventListener('abort', onAbort, {
            once: true,
          });

          removeAbortListener = () => {
            externalSignal.removeEventListener(
              'abort',
              onAbort,
            );
          };
        });

        try {
          const handlerPromise = Promise.resolve().then(() =>
            entry.handler(payload, Object.freeze({
              ...context,
              owner: entry.owner,
              signal: externalSignal || null,
            })),
          );

          const result = await Promise.race([
            handlerPromise,
            timeoutPromise,
            abortPromise,
          ]);

          const envelope = normalizeHandlerEnvelope(
            context,
            result,
          );

          log(
            envelope.ok ? 'info' : 'warn',
            envelope.ok
              ? 'bridge.handler.success'
              : 'bridge.handler.failure',
            {
              method: name,
              owner: entry.owner,
              requestId: envelope.requestId,
              correlationId: envelope.correlationId,
              code: envelope.code,
            },
          );

          return envelope;
        } catch (error) {
          const code =
            error && error.code === CODES.TIMEOUT
              ? CODES.TIMEOUT
              : error && error.code === CODES.ABORTED
                ? CODES.ABORTED
                : CODES.HANDLER_ERROR;

          log('error', 'bridge.handler.error', {
            method: name,
            owner: entry.owner,
            requestId: context.requestId,
            correlationId: context.correlationId,
            code,
          });

          return failureEnvelope(
            context,
            code,
            code === CODES.HANDLER_ERROR
              ? `Production handler failed: ${name}`
              : error.message,
            code === CODES.TIMEOUT,
          );
        } finally {
          if (timer !== null) {
            clearTimeout(timer);
          }

          removeAbortListener();
        }
      }

      return Object.freeze({
        register,
        unregister,
        has,
        list,
        invoke,
      });
    }

    function createAdapterSurface(methodNames, registry) {
      if (
        !Array.isArray(methodNames) ||
        !registry ||
        typeof registry.invoke !== 'function'
      ) {
        throw createError(
          CODES.INVALID_REQUEST,
          'Method names and a handler registry are required.',
        );
      }

      const adapter = {};

      for (const rawName of methodNames) {
        const name = String(rawName || '').trim();

        if (!name || adapter[name]) {
          throw createError(
            CODES.INVALID_REQUEST,
            `Invalid or duplicate adapter method: ${name}`,
          );
        }

        adapter[name] = (payload, options) =>
          registry.invoke(name, payload, options);
      }

      return Object.freeze(adapter);
    }

    return Object.freeze({
      CODES,
      createAdapterSurface,
      createHandlerRegistry,
      createSafeLogger,
      failureEnvelope,
      sanitizeForLog,
      successEnvelope,
    });
  },
);
