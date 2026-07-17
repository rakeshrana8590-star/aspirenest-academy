import {
  stripNotesRawAssetFields,
} from "./notesActionPolicy";

export const NOTES_PUBLIC_RAW_ASSET_FIELDS =
  Object.freeze([
    "pdf",
    "pdfUrl",
    "fileUrl",
    "videoUrl",
    "liveUrl",
    "joinUrl",
    "replayUrl",
    "sourceUrl",
    "downloadUrl",
    "assetUrl",
    "url",
    "urls",
    "asset",
    "protectedAsset",
  ]);

const cleanString = (value = "") =>
  String(value ?? "").trim();

const normalizeText = (value = "") =>
  cleanString(value).toLowerCase();

export const isNotesPublicCatalogItem = (
  item = {}
) => {
  const fingerprint = [
    item.section,
    item.contentSection,
    item.itemType,
    item.contentType,
    item.type,
    item.category,
    item.module,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");

  return fingerprint.includes("note");
};

export const hasNotesRawAssetReference = (
  item = {}
) =>
  NOTES_PUBLIC_RAW_ASSET_FIELDS.some(
    (fieldName) => {
      const value = item?.[fieldName];

      if (
        fieldName === "urls" &&
        value &&
        typeof value === "object"
      ) {
        return Object.values(value).some(
          (url) => Boolean(cleanString(url))
        );
      }

      if (
        value &&
        typeof value === "object"
      ) {
        return Object.keys(value).length > 0;
      }

      return Boolean(cleanString(value));
    }
  );

export const buildPublicNotesMetadata = (
  note = {},
  options = {}
) => {
  const hasProtectedAsset =
    options.hasProtectedAsset === true ||
    note.hasProtectedAsset === true ||
    hasNotesRawAssetReference(note);

  return stripNotesRawAssetFields({
    ...note,
    hasProtectedAsset,
  });
};

export const sanitizeContentItemForClient = (
  item = {}
) =>
  isNotesPublicCatalogItem(item)
    ? buildPublicNotesMetadata(item)
    : Object.freeze({ ...item });

export const sanitizeContentItemsForClient = (
  items = []
) =>
  Object.freeze(
    (
      Array.isArray(items)
        ? items
        : []
    ).map(sanitizeContentItemForClient)
  );
