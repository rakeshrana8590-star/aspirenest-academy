import {
  httpsCallable,
} from "firebase/functions";
import {
  auth,
  functions,
} from "../firebase";
import {
  NOTES_ACTIONS,
} from "./notesActionPolicy";

export const NOTES_ASSET_RESOLVER_FUNCTION_NAME =
  "resolveNotesProtectedAsset";

const NOTES_ASSET_ACTIONS = new Set([
  NOTES_ACTIONS.OPEN,
  NOTES_ACTIONS.READ,
  NOTES_ACTIONS.DOWNLOAD,
]);

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeAction = (value = "") =>
  cleanString(value).toUpperCase();

const buildClientError = (
  code,
  message
) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const isApprovedAssetUrl = (
  value = ""
) => {
  const url = cleanString(value);

  if (!url) return false;

  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
};

export const buildNotesAssetResolverPayload = ({
  noteId = "",
  action = NOTES_ACTIONS.OPEN,
} = {}) =>
  Object.freeze({
    noteId: cleanString(noteId).slice(0, 200),
    action: normalizeAction(action),
  });

export const normalizeNotesAssetResolverResponse = ({
  response = null,
  request = null,
} = {}) => {
  const data = response?.data || response || {};
  const expectedNoteId = cleanString(
    request?.noteId
  );
  const expectedAction = normalizeAction(
    request?.action
  );
  const noteId = cleanString(data.noteId);
  const action = normalizeAction(data.action);
  const assetUrl = cleanString(
    data.assetUrl
  );
  const serverNowMs = Number(
    data.serverNowMs
  );
  const requestId = cleanString(
    data.requestId
  );

  if (
    data.authorized !== true ||
    cleanString(data.source) !==
      "server_authorized" ||
    !noteId ||
    noteId !== expectedNoteId ||
    !action ||
    action !== expectedAction ||
    !NOTES_ASSET_ACTIONS.has(action) ||
    !isApprovedAssetUrl(assetUrl) ||
    !Number.isFinite(serverNowMs) ||
    serverNowMs <= 0 ||
    !requestId
  ) {
    throw buildClientError(
      "notes/invalid-server-response",
      "Protected Notes authorization response is invalid."
    );
  }

  return Object.freeze({
    authorized: true,
    source: "server_authorized",
    noteId,
    action,
    assetUrl,
    accessScope: cleanString(
      data.accessScope
    ).toLowerCase(),
    serverNowMs,
    requestId,
  });
};

export const createFirebaseNotesAssetResolverCall = ({
  authInstance = auth,
  functionsInstance = functions,
  callableFactory = httpsCallable,
  functionName =
    NOTES_ASSET_RESOLVER_FUNCTION_NAME,
} = {}) => {
  let callable = null;

  return async (input = {}) => {
    const uid = cleanString(
      authInstance?.currentUser?.uid
    );

    if (!uid) {
      throw buildClientError(
        "auth/unauthenticated",
        "Verified login is required before opening protected Notes."
      );
    }

    const payload =
      buildNotesAssetResolverPayload(
        input
      );

    if (!payload.noteId) {
      throw buildClientError(
        "notes/invalid-note",
        "A valid Notes resource is required."
      );
    }

    if (
      !NOTES_ASSET_ACTIONS.has(
        payload.action
      )
    ) {
      throw buildClientError(
        "notes/invalid-action",
        "Unsupported Notes asset action."
      );
    }

    if (!callable) {
      callable = callableFactory(
        functionsInstance,
        functionName,
        { timeout: 15000 }
      );
    }

    const response = await callable(payload);

    return normalizeNotesAssetResolverResponse({
      response,
      request: payload,
    });
  };
};

export const requestNotesProtectedAsset =
  createFirebaseNotesAssetResolverCall();
