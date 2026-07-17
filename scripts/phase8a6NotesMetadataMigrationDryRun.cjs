#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const RAW_NOTES_ASSET_FIELDS = Object.freeze([
  "pdf",
  "pdfUrl",
  "fileUrl",
  "sourceUrl",
  "downloadUrl",
  "assetUrl",
  "videoUrl",
  "liveUrl",
  "joinUrl",
  "replayUrl",
]);

const NOTES_MIGRATION_CLASSIFICATIONS = Object.freeze({
  READY: "READY",
  SANITIZE_PUBLIC_METADATA: "SANITIZE_PUBLIC_METADATA",
  BACKFILL_THEN_SANITIZE: "BACKFILL_THEN_SANITIZE",
  PATCH_PUBLIC_METADATA: "PATCH_PUBLIC_METADATA",
  BLOCKED_MISSING_PROTECTED_ASSET: "BLOCKED_MISSING_PROTECTED_ASSET",
  BLOCKED_NO_ASSET_SOURCE: "BLOCKED_NO_ASSET_SOURCE",
  SKIP_UNPUBLISHED_NO_ASSET: "SKIP_UNPUBLISHED_NO_ASSET",
});

const NOTES_PUBLIC_SCOPE_PATCH = Object.freeze({
  scopeType: "ITEM",
  module: "notes",
  itemType: "notesPdf",
});

function cleanString(value) {
  return String(value ?? "").trim();
}

function normalizeLower(value) {
  return cleanString(value).toLowerCase();
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function normalizeDataset(input) {
  if (Array.isArray(input)) {
    return {
      contentItems: input,
      protectedContentAssets: [],
    };
  }

  if (!isPlainObject(input)) {
    throw new TypeError(
      "Migration input must be an array or an object."
    );
  }

  const contentItems = Array.isArray(input.contentItems)
    ? input.contentItems
    : [];

  const protectedContentAssets = Array.isArray(
    input.protectedContentAssets
  )
    ? input.protectedContentAssets
    : [];

  return {
    contentItems,
    protectedContentAssets,
  };
}

function isNotesItem(item) {
  if (!isPlainObject(item)) {
    return false;
  }

  const candidates = [
    item.module,
    item.moduleKey,
    item.category,
    item.contentType,
    item.type,
    item.itemType,
  ]
    .map(normalizeLower)
    .filter(Boolean);

  return candidates.some((candidate) => {
    return (
      candidate === "notes" ||
      candidate === "note" ||
      candidate === "notespdf" ||
      candidate === "notes_pdf" ||
      candidate === "notes-pdf"
    );
  });
}

function isPublishedItem(item) {
  return (
    item?.published === true ||
    normalizeLower(item?.status) === "published"
  );
}

function getDocumentId(value, fallbackPrefix, index) {
  const id = cleanString(
    value?.id ||
      value?.docId ||
      value?.documentId ||
      value?.itemId
  );

  return id || `${fallbackPrefix}-${index + 1}`;
}

function getPresentRawAssetFields(item) {
  return RAW_NOTES_ASSET_FIELDS.filter((field) => {
    return cleanString(item?.[field]).length > 0;
  });
}

function isApprovedHttpsUrl(value) {
  const url = cleanString(value);

  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getProtectedAssetUrlFields(asset) {
  return RAW_NOTES_ASSET_FIELDS.filter((field) => {
    return isApprovedHttpsUrl(asset?.[field]);
  });
}

function buildProtectedAssetIndex(assets) {
  const index = new Map();

  assets.forEach((asset, assetIndex) => {
    if (!isPlainObject(asset)) {
      return;
    }

    const assetId = getDocumentId(
      asset,
      "protected-asset",
      assetIndex
    );

    const itemId = cleanString(asset.itemId);
    const contentId = cleanString(asset.contentId);

    for (const key of [assetId, itemId, contentId]) {
      if (key && !index.has(key)) {
        index.set(key, asset);
      }
    }
  });

  return index;
}

function buildPublicMetadataPatch(noteId, rawFields, hasAsset) {
  return {
    action: "PATCH",
    removeFields: [...rawFields].sort(),
    set: {
      ...NOTES_PUBLIC_SCOPE_PATCH,
      itemId: noteId,
      hasProtectedAsset: hasAsset,
    },
  };
}

function buildProtectedAssetPlan({
  classification,
  rawFields,
  protectedAsset,
}) {
  if (
    classification ===
    NOTES_MIGRATION_CLASSIFICATIONS.BACKFILL_THEN_SANITIZE
  ) {
    return {
      action: "UPSERT_REQUIRED",
      sourceFields: [...rawFields].sort(),
      urlValuesIncluded: false,
    };
  }

  if (
    classification ===
      NOTES_MIGRATION_CLASSIFICATIONS.BLOCKED_MISSING_PROTECTED_ASSET ||
    classification ===
      NOTES_MIGRATION_CLASSIFICATIONS.BLOCKED_NO_ASSET_SOURCE
  ) {
    return {
      action: "MANUAL_REVIEW_REQUIRED",
      sourceFields: [...rawFields].sort(),
      urlValuesIncluded: false,
    };
  }

  if (protectedAsset) {
    return {
      action: "NO_CHANGE",
      sourceFields: [],
      urlValuesIncluded: false,
    };
  }

  return {
    action: "NONE",
    sourceFields: [],
    urlValuesIncluded: false,
  };
}

function classifyNotesItem({
  note,
  rawFields,
  protectedAsset,
  protectedAssetUrlFields,
}) {
  const published = isPublishedItem(note);
  const hasRawAsset = rawFields.length > 0;
  const hasValidProtectedAsset =
    Boolean(protectedAsset) &&
    protectedAssetUrlFields.length > 0;
  const declaresProtectedAsset =
    note.hasProtectedAsset === true;

  if (hasValidProtectedAsset && hasRawAsset) {
    return NOTES_MIGRATION_CLASSIFICATIONS
      .SANITIZE_PUBLIC_METADATA;
  }

  if (hasRawAsset && !hasValidProtectedAsset) {
    return NOTES_MIGRATION_CLASSIFICATIONS
      .BACKFILL_THEN_SANITIZE;
  }

  if (hasValidProtectedAsset && !declaresProtectedAsset) {
    return NOTES_MIGRATION_CLASSIFICATIONS
      .PATCH_PUBLIC_METADATA;
  }

  if (hasValidProtectedAsset && declaresProtectedAsset) {
    return NOTES_MIGRATION_CLASSIFICATIONS.READY;
  }

  if (declaresProtectedAsset && !hasValidProtectedAsset) {
    return NOTES_MIGRATION_CLASSIFICATIONS
      .BLOCKED_MISSING_PROTECTED_ASSET;
  }

  if (!published) {
    return NOTES_MIGRATION_CLASSIFICATIONS
      .SKIP_UNPUBLISHED_NO_ASSET;
  }

  return NOTES_MIGRATION_CLASSIFICATIONS
    .BLOCKED_NO_ASSET_SOURCE;
}

function buildNotesMigrationItem({
  note,
  noteId,
  protectedAsset,
}) {
  const rawFields = getPresentRawAssetFields(note);
  const protectedAssetUrlFields =
    getProtectedAssetUrlFields(protectedAsset);

  const classification = classifyNotesItem({
    note,
    rawFields,
    protectedAsset,
    protectedAssetUrlFields,
  });

  const hasValidProtectedAsset =
    Boolean(protectedAsset) &&
    protectedAssetUrlFields.length > 0;

  const shouldPatchPublicMetadata = [
    NOTES_MIGRATION_CLASSIFICATIONS
      .SANITIZE_PUBLIC_METADATA,
    NOTES_MIGRATION_CLASSIFICATIONS
      .BACKFILL_THEN_SANITIZE,
    NOTES_MIGRATION_CLASSIFICATIONS
      .PATCH_PUBLIC_METADATA,
  ].includes(classification);

  return {
    noteId,
    classification,
    published: isPublishedItem(note),
    rawAssetFields: [...rawFields].sort(),
    rawAssetValuesIncluded: false,
    protectedAssetFound: Boolean(protectedAsset),
    protectedAssetHasApprovedHttpsUrl:
      hasValidProtectedAsset,
    protectedAssetUrlFields:
      [...protectedAssetUrlFields].sort(),
    publicMetadataPlan: shouldPatchPublicMetadata
      ? buildPublicMetadataPatch(
          noteId,
          rawFields,
          hasValidProtectedAsset ||
            rawFields.length > 0
        )
      : {
          action: "NONE",
          removeFields: [],
          set: {},
        },
    protectedAssetPlan: buildProtectedAssetPlan({
      classification,
      rawFields,
      protectedAsset,
    }),
  };
}

function buildSummary(items, ignoredContentItems) {
  const byClassification = {};

  for (const classification of Object.values(
    NOTES_MIGRATION_CLASSIFICATIONS
  )) {
    byClassification[classification] = 0;
  }

  for (const item of items) {
    byClassification[item.classification] += 1;
  }

  const blocked =
    byClassification[
      NOTES_MIGRATION_CLASSIFICATIONS
        .BLOCKED_MISSING_PROTECTED_ASSET
    ] +
    byClassification[
      NOTES_MIGRATION_CLASSIFICATIONS
        .BLOCKED_NO_ASSET_SOURCE
    ];

  const plannedPublicPatches = items.filter(
    (item) => item.publicMetadataPlan.action === "PATCH"
  ).length;

  const plannedProtectedAssetUpserts = items.filter(
    (item) =>
      item.protectedAssetPlan.action ===
      "UPSERT_REQUIRED"
  ).length;

  return {
    notesItems: items.length,
    ignoredContentItems,
    ready:
      byClassification[
        NOTES_MIGRATION_CLASSIFICATIONS.READY
      ],
    sanitizePublicMetadata:
      byClassification[
        NOTES_MIGRATION_CLASSIFICATIONS
          .SANITIZE_PUBLIC_METADATA
      ],
    backfillThenSanitize:
      byClassification[
        NOTES_MIGRATION_CLASSIFICATIONS
          .BACKFILL_THEN_SANITIZE
      ],
    patchPublicMetadata:
      byClassification[
        NOTES_MIGRATION_CLASSIFICATIONS
          .PATCH_PUBLIC_METADATA
      ],
    blocked,
    skippedUnpublished:
      byClassification[
        NOTES_MIGRATION_CLASSIFICATIONS
          .SKIP_UNPUBLISHED_NO_ASSET
      ],
    plannedPublicPatches,
    plannedProtectedAssetUpserts,
    byClassification,
  };
}

function analyzeLegacyNotesMigration(input, options = {}) {
  const dataset = normalizeDataset(input);
  const protectedAssetIndex = buildProtectedAssetIndex(
    dataset.protectedContentAssets
  );

  const notesItems = [];
  let ignoredContentItems = 0;

  dataset.contentItems.forEach((item, itemIndex) => {
    if (!isNotesItem(item)) {
      ignoredContentItems += 1;
      return;
    }

    const noteId = getDocumentId(
      item,
      "legacy-note",
      itemIndex
    );

    const protectedAsset =
      protectedAssetIndex.get(noteId) || null;

    notesItems.push(
      buildNotesMigrationItem({
        note: item,
        noteId,
        protectedAsset,
      })
    );
  });

  notesItems.sort((left, right) => {
    return left.noteId.localeCompare(right.noteId);
  });

  const report = {
    schemaVersion: 1,
    reportType:
      "ASPirenest_PHASE8A6_NOTES_METADATA_MIGRATION_DRY_RUN",
    dryRun: true,
    generatedAt:
      options.generatedAt ||
      "1970-01-01T00:00:00.000Z",
    productionReadsExecuted: 0,
    productionWritesExecuted: 0,
    sourceMutationExecuted: false,
    urlsIncludedInReport: false,
    summary: buildSummary(
      notesItems,
      ignoredContentItems
    ),
    items: notesItems,
  };

  return report;
}

function parseCliArguments(argv) {
  const args = {
    input: "",
    output: "",
    pretty: false,
    failOnBlocked: false,
    generatedAt: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--input") {
      args.input = cleanString(argv[index + 1]);
      index += 1;
      continue;
    }

    if (token === "--output") {
      args.output = cleanString(argv[index + 1]);
      index += 1;
      continue;
    }

    if (token === "--generated-at") {
      args.generatedAt = cleanString(argv[index + 1]);
      index += 1;
      continue;
    }

    if (token === "--pretty") {
      args.pretty = true;
      continue;
    }

    if (token === "--fail-on-blocked") {
      args.failOnBlocked = true;
      continue;
    }

    throw new Error(`Unsupported argument: ${token}`);
  }

  return args;
}

function runCli(argv = process.argv.slice(2)) {
  const args = parseCliArguments(argv);

  if (!args.input) {
    process.stderr.write(
      "Usage: node phase8a6NotesMetadataMigrationDryRun.cjs " +
        "--input <export.json> [--output <report.json>] " +
        "[--pretty] [--fail-on-blocked]\n"
    );
    return 2;
  }

  const inputPath = path.resolve(args.input);
  const payload = JSON.parse(
    fs.readFileSync(inputPath, "utf8")
  );

  const report = analyzeLegacyNotesMigration(
    payload,
    {
      generatedAt:
        args.generatedAt ||
        new Date().toISOString(),
    }
  );

  const serialized = JSON.stringify(
    report,
    null,
    args.pretty ? 2 : 0
  );

  if (args.output) {
    const outputPath = path.resolve(args.output);
    fs.mkdirSync(path.dirname(outputPath), {
      recursive: true,
    });
    fs.writeFileSync(
      outputPath,
      `${serialized}\n`,
      "utf8"
    );
  } else {
    process.stdout.write(`${serialized}\n`);
  }

  if (
    args.failOnBlocked &&
    report.summary.blocked > 0
  ) {
    return 3;
  }

  return 0;
}

module.exports = {
  RAW_NOTES_ASSET_FIELDS,
  NOTES_MIGRATION_CLASSIFICATIONS,
  NOTES_PUBLIC_SCOPE_PATCH,
  cleanString,
  normalizeDataset,
  isNotesItem,
  isPublishedItem,
  getPresentRawAssetFields,
  isApprovedHttpsUrl,
  getProtectedAssetUrlFields,
  buildProtectedAssetIndex,
  classifyNotesItem,
  buildNotesMigrationItem,
  buildSummary,
  analyzeLegacyNotesMigration,
  parseCliArguments,
  runCli,
};

if (require.main === module) {
  process.exitCode = runCli();
}
