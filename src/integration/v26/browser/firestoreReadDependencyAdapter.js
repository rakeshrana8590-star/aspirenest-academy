(function exposeAspireNestV26FirestoreReadDependencyAdapter(
  root,
  factory,
) {
  'use strict';

  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (
    root
    && !root.AspireNestV26FirestoreReadDependencyAdapter
  ) {
    Object.defineProperty(
      root,
      'AspireNestV26FirestoreReadDependencyAdapter',
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
  function createAspireNestV26FirestoreReadDependencyAdapterModule() {
    'use strict';

    const PROFILE_COLLECTIONS = Object.freeze([
      'users',
      'students',
      'mentorProfiles',
    ]);
    const CANONICAL_COLLECTIONS = Object.freeze([
      'contentItems',
      'studyRoadmaps',
      'experienceEvents',
      'mentorLiveSessions',
    ]);
    const PROFILE_COLLECTION_SET = new Set(
      PROFILE_COLLECTIONS,
    );
    const CANONICAL_COLLECTION_SET = new Set(
      CANONICAL_COLLECTIONS,
    );
    const ENTITLEMENT_ROOT = 'studentEntitlements';
    const ENTITLEMENT_ITEMS = 'items';
    const MAX_ENTITLEMENT_ROWS = 512;
    const MAX_UID_LENGTH = 128;
    const MAX_RESOURCE_ID_LENGTH = 240;

    const CODES = Object.freeze({
      INVALID_REQUEST: 'FIRESTORE_READ_INVALID_REQUEST',
      COLLECTION_BLOCKED: 'FIRESTORE_READ_COLLECTION_BLOCKED',
      ABORTED: 'FIRESTORE_READ_ABORTED',
      FAILED: 'FIRESTORE_READ_FAILED',
      SNAPSHOT_INVALID: 'FIRESTORE_READ_SNAPSHOT_INVALID',
      ROW_LIMIT: 'FIRESTORE_READ_ROW_LIMIT',
    });

    function adapterError(code) {
      const error = new Error(code);
      error.name = (
        code === CODES.ABORTED
          ? 'AbortError'
          : 'AspireNestFirestoreReadError'
      );
      Object.defineProperty(error, 'code', {
        configurable: false,
        enumerable: true,
        writable: false,
        value: code,
      });
      return error;
    }

    function readOwnDataField(value, key) {
      if (
        !value
        || typeof value !== 'object'
        || Array.isArray(value)
      ) {
        return {
          ok: false,
          present: false,
          value: undefined,
        };
      }

      try {
        const descriptor = Object.getOwnPropertyDescriptor(
          value,
          key,
        );

        if (!descriptor) {
          return {
            ok: true,
            present: false,
            value: undefined,
          };
        }

        if (
          !Object.prototype.hasOwnProperty.call(
            descriptor,
            'value',
          )
        ) {
          return {
            ok: false,
            present: true,
            value: undefined,
          };
        }

        return {
          ok: true,
          present: true,
          value: descriptor.value,
        };
      } catch (_) {
        return {
          ok: false,
          present: false,
          value: undefined,
        };
      }
    }

    function strictString(value, maxLength) {
      if (typeof value !== 'string') {
        return '';
      }

      const cleaned = value.trim();

      if (
        !cleaned
        || cleaned.length > maxLength
        || /[\u0000-\u001f\u007f]/.test(cleaned)
      ) {
        return '';
      }

      return cleaned;
    }

    function decodeFully(value) {
      let decoded = value;

      for (let pass = 0; pass < 6; pass += 1) {
        let next;

        try {
          next = decodeURIComponent(decoded);
        } catch (_) {
          return '';
        }

        if (next === decoded) {
          return decoded;
        }

        decoded = next;
      }

      try {
        return decodeURIComponent(decoded) === decoded
          ? decoded
          : '';
      } catch (_) {
        return '';
      }
    }

    function validDocumentId(value, maxLength) {
      const id = strictString(value, maxLength);

      if (!id) {
        return '';
      }

      const decoded = decodeFully(id);

      if (
        !decoded
        || decoded.length > maxLength
        || /[\/\\\u0000-\u001f\u007f]/.test(id)
        || /[\/\\\u0000-\u001f\u007f]/.test(decoded)
        || decoded === '.'
        || decoded === '..'
      ) {
        return '';
      }

      return id;
    }

    function safePlainRecord(value) {
      if (
        !value
        || typeof value !== 'object'
        || Array.isArray(value)
      ) {
        throw adapterError(CODES.SNAPSHOT_INVALID);
      }

      let descriptors;

      try {
        descriptors = Object.getOwnPropertyDescriptors(value);
      } catch (_) {
        throw adapterError(CODES.SNAPSHOT_INVALID);
      }

      const record = {};

      for (const [key, descriptor] of Object.entries(
        descriptors,
      )) {
        if (
          key === '__proto__'
          || key === 'prototype'
          || key === 'constructor'
        ) {
          continue;
        }

        if (
          descriptor.enumerable !== true
          || !Object.prototype.hasOwnProperty.call(
            descriptor,
            'value',
          )
        ) {
          continue;
        }

        record[key] = descriptor.value;
      }

      return Object.freeze(record);
    }

    function readAbortState(signal) {
      if (signal == null) {
        return false;
      }

      if (
        typeof signal !== 'object'
        && typeof signal !== 'function'
      ) {
        throw adapterError(CODES.INVALID_REQUEST);
      }

      try {
        return signal.aborted === true;
      } catch (_) {
        throw adapterError(CODES.ABORTED);
      }
    }

    function assertNotAborted(signal) {
      if (readAbortState(signal)) {
        throw adapterError(CODES.ABORTED);
      }
    }

    function validateDependencies(dependencies) {
      const requiredFunctions = [
        'doc',
        'collection',
        'getDoc',
        'getDocs',
      ];

      if (
        !dependencies
        || typeof dependencies !== 'object'
        || !dependencies.db
        || typeof dependencies.db !== 'object'
      ) {
        throw new TypeError(
          'Firestore read adapter requires a db dependency.',
        );
      }

      for (const name of requiredFunctions) {
        if (typeof dependencies[name] !== 'function') {
          throw new TypeError(
            `Firestore read dependency missing: ${name}`,
          );
        }
      }
    }

    function snapshotExists(snapshot) {
      if (
        !snapshot
        || typeof snapshot !== 'object'
        || typeof snapshot.exists !== 'function'
      ) {
        throw adapterError(CODES.SNAPSHOT_INVALID);
      }

      try {
        return snapshot.exists() === true;
      } catch (_) {
        throw adapterError(CODES.SNAPSHOT_INVALID);
      }
    }

    function snapshotId(snapshot, maxLength) {
      let raw;

      try {
        raw = snapshot.id;
      } catch (_) {
        throw adapterError(CODES.SNAPSHOT_INVALID);
      }

      const id = validDocumentId(raw, maxLength);

      if (!id) {
        throw adapterError(CODES.SNAPSHOT_INVALID);
      }

      return id;
    }

    function snapshotData(snapshot) {
      if (
        !snapshot
        || typeof snapshot !== 'object'
        || typeof snapshot.data !== 'function'
      ) {
        throw adapterError(CODES.SNAPSHOT_INVALID);
      }

      let value;

      try {
        value = snapshot.data();
      } catch (_) {
        throw adapterError(CODES.SNAPSHOT_INVALID);
      }

      return safePlainRecord(value);
    }

    function queryDocuments(snapshot) {
      if (!snapshot || typeof snapshot !== 'object') {
        throw adapterError(CODES.SNAPSHOT_INVALID);
      }

      let docs;

      try {
        docs = snapshot.docs;
      } catch (_) {
        throw adapterError(CODES.SNAPSHOT_INVALID);
      }

      if (Array.isArray(docs)) {
        return [...docs];
      }

      if (typeof snapshot.forEach === 'function') {
        const rows = [];

        try {
          snapshot.forEach((item) => {
            rows.push(item);
          });
        } catch (_) {
          throw adapterError(CODES.SNAPSHOT_INVALID);
        }

        return rows;
      }

      throw adapterError(CODES.SNAPSHOT_INVALID);
    }

    function normalizeRequest(
      request,
      collectionSet,
      idField,
      idLimit,
    ) {
      if (
        !request
        || typeof request !== 'object'
        || Array.isArray(request)
      ) {
        throw adapterError(CODES.INVALID_REQUEST);
      }

      const collectionField = readOwnDataField(
        request,
        'collection',
      );
      const identifierField = readOwnDataField(
        request,
        idField,
      );
      const signalField = readOwnDataField(
        request,
        'signal',
      );

      if (
        !collectionField.ok
        || !identifierField.ok
        || !signalField.ok
        || !collectionField.present
        || !identifierField.present
      ) {
        throw adapterError(CODES.INVALID_REQUEST);
      }

      const collectionName = strictString(
        collectionField.value,
        64,
      );
      const identifier = validDocumentId(
        identifierField.value,
        idLimit,
      );

      if (!collectionSet.has(collectionName)) {
        throw adapterError(CODES.COLLECTION_BLOCKED);
      }

      if (!identifier) {
        throw adapterError(CODES.INVALID_REQUEST);
      }

      return Object.freeze({
        collection: collectionName,
        identifier,
        signal: signalField.present
          ? signalField.value
          : undefined,
      });
    }

    function createFirestoreReadDependencyAdapter(
      dependencies,
    ) {
      validateDependencies(dependencies);

      const {
        db,
        doc,
        collection,
        getDoc,
        getDocs,
      } = dependencies;

      async function readProfileByCollection(request) {
        const normalized = normalizeRequest(
          request,
          PROFILE_COLLECTION_SET,
          'uid',
          MAX_UID_LENGTH,
        );

        assertNotAborted(normalized.signal);

        let reference;
        let snapshot;

        try {
          reference = doc(
            db,
            normalized.collection,
            normalized.identifier,
          );
          snapshot = await getDoc(reference);
        } catch (_) {
          throw adapterError(CODES.FAILED);
        }

        assertNotAborted(normalized.signal);

        if (!snapshotExists(snapshot)) {
          return null;
        }

        return snapshotData(snapshot);
      }

      async function readResourceById(request) {
        const normalized = normalizeRequest(
          request,
          CANONICAL_COLLECTION_SET,
          'resourceId',
          MAX_RESOURCE_ID_LENGTH,
        );

        assertNotAborted(normalized.signal);

        let reference;
        let snapshot;

        try {
          reference = doc(
            db,
            normalized.collection,
            normalized.identifier,
          );
          snapshot = await getDoc(reference);
        } catch (_) {
          throw adapterError(CODES.FAILED);
        }

        assertNotAborted(normalized.signal);

        if (!snapshotExists(snapshot)) {
          return Object.freeze({
            exists: false,
          });
        }

        return Object.freeze({
          exists: true,
          id: snapshotId(
            snapshot,
            MAX_RESOURCE_ID_LENGTH,
          ),
          record: snapshotData(snapshot),
        });
      }

      async function listEntitlementEvidence(request) {
        if (
          !request
          || typeof request !== 'object'
          || Array.isArray(request)
        ) {
          throw adapterError(CODES.INVALID_REQUEST);
        }

        const principalField = readOwnDataField(
          request,
          'principalUid',
        );
        const signalField = readOwnDataField(
          request,
          'signal',
        );

        if (
          !principalField.ok
          || !signalField.ok
          || !principalField.present
        ) {
          throw adapterError(CODES.INVALID_REQUEST);
        }

        const principalUid = validDocumentId(
          principalField.value,
          MAX_UID_LENGTH,
        );

        if (!principalUid) {
          throw adapterError(CODES.INVALID_REQUEST);
        }

        const signal = signalField.present
          ? signalField.value
          : undefined;

        assertNotAborted(signal);

        let reference;
        let snapshot;

        try {
          reference = collection(
            db,
            ENTITLEMENT_ROOT,
            principalUid,
            ENTITLEMENT_ITEMS,
          );
          snapshot = await getDocs(reference);
        } catch (_) {
          throw adapterError(CODES.FAILED);
        }

        assertNotAborted(signal);

        const documents = queryDocuments(snapshot);

        if (documents.length > MAX_ENTITLEMENT_ROWS) {
          throw adapterError(CODES.ROW_LIMIT);
        }

        const ids = new Set();
        const records = [];

        for (const document of documents) {
          const id = snapshotId(
            document,
            MAX_RESOURCE_ID_LENGTH,
          );

          if (ids.has(id)) {
            throw adapterError(CODES.SNAPSHOT_INVALID);
          }

          ids.add(id);

          const data = snapshotData(document);

          records.push(
            Object.freeze({
              ...data,
              id,
            }),
          );
        }

        records.sort((first, second) =>
          first.id.localeCompare(second.id)
        );

        return Object.freeze(records);
      }

      return Object.freeze({
        readProfileByCollection,
        readResourceById,
        listEntitlementEvidence,
      });
    }

    return Object.freeze({
      CODES,
      PROFILE_COLLECTIONS,
      CANONICAL_COLLECTIONS,
      ENTITLEMENT_ROOT,
      ENTITLEMENT_ITEMS,
      MAX_ENTITLEMENT_ROWS,
      createFirestoreReadDependencyAdapter,
    });
  },
);
