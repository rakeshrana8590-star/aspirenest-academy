"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const migration = require(
  "./phase8a6NotesMetadataMigrationDryRun.cjs"
);

const {
  RAW_NOTES_ASSET_FIELDS,
  NOTES_MIGRATION_CLASSIFICATIONS,
  NOTES_PUBLIC_SCOPE_PATCH,
  normalizeDataset,
  isNotesItem,
  isPublishedItem,
  getPresentRawAssetFields,
  isApprovedHttpsUrl,
  buildProtectedAssetIndex,
  analyzeLegacyNotesMigration,
  parseCliArguments,
} = migration;

function buildDataset() {
  return {
    contentItems: [
      {
        id: "note-ready",
        module: "notes",
        status: "published",
        hasProtectedAsset: true,
      },
      {
        id: "note-sanitize",
        module: "notes",
        status: "published",
        hasProtectedAsset: true,
        pdfUrl: "https://legacy.example/sanitize.pdf",
      },
      {
        id: "note-backfill",
        itemType: "notesPdf",
        status: "published",
        fileUrl: "https://legacy.example/backfill.pdf",
      },
      {
        id: "note-patch",
        category: "notes",
        status: "published",
        hasProtectedAsset: false,
      },
      {
        id: "note-missing",
        type: "note",
        status: "published",
        hasProtectedAsset: true,
      },
      {
        id: "note-draft",
        moduleKey: "notes",
        status: "draft",
      },
      {
        id: "video-ignored",
        module: "videos",
        status: "published",
        videoUrl: "https://example.com/video",
      },
    ],
    protectedContentAssets: [
      {
        id: "note-ready",
        itemId: "note-ready",
        pdfUrl: "https://secure.example/ready.pdf",
      },
      {
        id: "note-sanitize",
        itemId: "note-sanitize",
        pdfUrl: "https://secure.example/sanitize.pdf",
      },
      {
        id: "note-patch",
        itemId: "note-patch",
        fileUrl: "https://secure.example/patch.pdf",
      },
    ],
  };
}

test("raw Notes URL fields are explicit and stable", () => {
  assert.equal(
    RAW_NOTES_ASSET_FIELDS.includes("pdfUrl"),
    true
  );
  assert.equal(
    RAW_NOTES_ASSET_FIELDS.includes("fileUrl"),
    true
  );
  assert.equal(
    RAW_NOTES_ASSET_FIELDS.includes("downloadUrl"),
    true
  );
});

test("normalizes an array as contentItems only", () => {
  assert.deepEqual(normalizeDataset([{ id: "a" }]), {
    contentItems: [{ id: "a" }],
    protectedContentAssets: [],
  });
});

test("normalizes object datasets and defaults missing arrays", () => {
  assert.deepEqual(normalizeDataset({}), {
    contentItems: [],
    protectedContentAssets: [],
  });
});

test("rejects unsupported dataset shapes", () => {
  assert.throws(
    () => normalizeDataset("invalid"),
    /array or an object/
  );
});

test("detects Notes records across supported metadata fields", () => {
  assert.equal(isNotesItem({ module: "NOTES" }), true);
  assert.equal(
    isNotesItem({ itemType: "notesPdf" }),
    true
  );
  assert.equal(
    isNotesItem({ category: "notes-pdf" }),
    true
  );
  assert.equal(isNotesItem({ module: "videos" }), false);
});

test("normalizes published status and boolean flags", () => {
  assert.equal(
    isPublishedItem({ status: "Published" }),
    true
  );
  assert.equal(
    isPublishedItem({ published: true }),
    true
  );
  assert.equal(
    isPublishedItem({ status: "draft" }),
    false
  );
});

test("detects raw asset field names without exposing values", () => {
  const fields = getPresentRawAssetFields({
    pdfUrl: "https://legacy.example/a.pdf",
    fileUrl: " ",
    downloadUrl: "https://legacy.example/b.pdf",
  });

  assert.deepEqual(fields, [
    "pdfUrl",
    "downloadUrl",
  ]);
});

test("accepts HTTPS and rejects insecure or malformed URLs", () => {
  assert.equal(
    isApprovedHttpsUrl("https://secure.example/a.pdf"),
    true
  );
  assert.equal(
    isApprovedHttpsUrl("http://insecure.example/a.pdf"),
    false
  );
  assert.equal(isApprovedHttpsUrl("not-a-url"), false);
});

test("indexes protected assets by document, item, and content ids", () => {
  const asset = {
    id: "asset-id",
    itemId: "note-id",
    contentId: "content-id",
  };
  const index = buildProtectedAssetIndex([asset]);

  assert.equal(index.get("asset-id"), asset);
  assert.equal(index.get("note-id"), asset);
  assert.equal(index.get("content-id"), asset);
});

test("classifies a complete protected note as READY", () => {
  const report = analyzeLegacyNotesMigration(
    buildDataset(),
    { generatedAt: "2026-07-17T00:00:00.000Z" }
  );
  const item = report.items.find(
    (entry) => entry.noteId === "note-ready"
  );

  assert.equal(
    item.classification,
    NOTES_MIGRATION_CLASSIFICATIONS.READY
  );
});

test("classifies public raw URLs with a protected asset for sanitization", () => {
  const report = analyzeLegacyNotesMigration(
    buildDataset()
  );
  const item = report.items.find(
    (entry) => entry.noteId === "note-sanitize"
  );

  assert.equal(
    item.classification,
    NOTES_MIGRATION_CLASSIFICATIONS
      .SANITIZE_PUBLIC_METADATA
  );
  assert.deepEqual(
    item.publicMetadataPlan.removeFields,
    ["pdfUrl"]
  );
});

test("classifies raw URLs without a protected asset for backfill", () => {
  const report = analyzeLegacyNotesMigration(
    buildDataset()
  );
  const item = report.items.find(
    (entry) => entry.noteId === "note-backfill"
  );

  assert.equal(
    item.classification,
    NOTES_MIGRATION_CLASSIFICATIONS
      .BACKFILL_THEN_SANITIZE
  );
  assert.equal(
    item.protectedAssetPlan.action,
    "UPSERT_REQUIRED"
  );
});

test("classifies missing public protected-asset flags for patching", () => {
  const report = analyzeLegacyNotesMigration(
    buildDataset()
  );
  const item = report.items.find(
    (entry) => entry.noteId === "note-patch"
  );

  assert.equal(
    item.classification,
    NOTES_MIGRATION_CLASSIFICATIONS
      .PATCH_PUBLIC_METADATA
  );
  assert.equal(
    item.publicMetadataPlan.set.hasProtectedAsset,
    true
  );
});

test("blocks a declared protected asset that does not exist", () => {
  const report = analyzeLegacyNotesMigration(
    buildDataset()
  );
  const item = report.items.find(
    (entry) => entry.noteId === "note-missing"
  );

  assert.equal(
    item.classification,
    NOTES_MIGRATION_CLASSIFICATIONS
      .BLOCKED_MISSING_PROTECTED_ASSET
  );
});

test("skips an unpublished note without an asset source", () => {
  const report = analyzeLegacyNotesMigration(
    buildDataset()
  );
  const item = report.items.find(
    (entry) => entry.noteId === "note-draft"
  );

  assert.equal(
    item.classification,
    NOTES_MIGRATION_CLASSIFICATIONS
      .SKIP_UNPUBLISHED_NO_ASSET
  );
});

test("blocks a published note without any asset source", () => {
  const dataset = {
    contentItems: [
      {
        id: "note-empty",
        module: "notes",
        status: "published",
      },
    ],
  };
  const report = analyzeLegacyNotesMigration(dataset);

  assert.equal(
    report.items[0].classification,
    NOTES_MIGRATION_CLASSIFICATIONS
      .BLOCKED_NO_ASSET_SOURCE
  );
});

test("plans canonical ITEM scope metadata", () => {
  const report = analyzeLegacyNotesMigration(
    buildDataset()
  );
  const item = report.items.find(
    (entry) => entry.noteId === "note-sanitize"
  );

  assert.deepEqual(
    {
      scopeType:
        item.publicMetadataPlan.set.scopeType,
      module: item.publicMetadataPlan.set.module,
      itemType:
        item.publicMetadataPlan.set.itemType,
    },
    NOTES_PUBLIC_SCOPE_PATCH
  );
  assert.equal(
    item.publicMetadataPlan.set.itemId,
    "note-sanitize"
  );
});

test("never includes raw URL values in the report", () => {
  const report = analyzeLegacyNotesMigration(
    buildDataset()
  );
  const serialized = JSON.stringify(report);

  assert.equal(
    serialized.includes("legacy.example"),
    false
  );
  assert.equal(
    serialized.includes("secure.example"),
    false
  );
  assert.equal(report.urlsIncludedInReport, false);
});

test("is deterministic when input order changes", () => {
  const first = buildDataset();
  const second = buildDataset();
  second.contentItems.reverse();
  second.protectedContentAssets.reverse();

  const firstReport = analyzeLegacyNotesMigration(
    first,
    { generatedAt: "fixed" }
  );
  const secondReport = analyzeLegacyNotesMigration(
    second,
    { generatedAt: "fixed" }
  );

  assert.deepEqual(firstReport, secondReport);
});

test("does not mutate source data", () => {
  const dataset = buildDataset();
  const before = JSON.stringify(dataset);

  analyzeLegacyNotesMigration(dataset);

  assert.equal(JSON.stringify(dataset), before);
});

test("returns exact fixture summary counts", () => {
  const report = analyzeLegacyNotesMigration(
    buildDataset()
  );

  assert.deepEqual(
    {
      notesItems: report.summary.notesItems,
      ignoredContentItems:
        report.summary.ignoredContentItems,
      ready: report.summary.ready,
      sanitize:
        report.summary.sanitizePublicMetadata,
      backfill:
        report.summary.backfillThenSanitize,
      patch:
        report.summary.patchPublicMetadata,
      blocked: report.summary.blocked,
      skipped:
        report.summary.skippedUnpublished,
    },
    {
      notesItems: 6,
      ignoredContentItems: 1,
      ready: 1,
      sanitize: 1,
      backfill: 1,
      patch: 1,
      blocked: 1,
      skipped: 1,
    }
  );
});

test("marks the report as a zero-write local dry run", () => {
  const report = analyzeLegacyNotesMigration(
    buildDataset()
  );

  assert.equal(report.dryRun, true);
  assert.equal(report.productionReadsExecuted, 0);
  assert.equal(report.productionWritesExecuted, 0);
  assert.equal(report.sourceMutationExecuted, false);
});

test("parses the supported CLI contract", () => {
  assert.deepEqual(
    parseCliArguments([
      "--input",
      "input.json",
      "--output",
      "report.json",
      "--pretty",
      "--fail-on-blocked",
      "--generated-at",
      "fixed",
    ]),
    {
      input: "input.json",
      output: "report.json",
      pretty: true,
      failOnBlocked: true,
      generatedAt: "fixed",
    }
  );
});

test("CLI writes a deterministic report and fail-on-blocked returns 3", () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "phase8a6-test-")
  );
  const inputPath = path.join(
    temporaryDirectory,
    "input.json"
  );
  const outputPath = path.join(
    temporaryDirectory,
    "report.json"
  );
  const scriptPath = path.resolve(
    __dirname,
    "phase8a6NotesMetadataMigrationDryRun.cjs"
  );

  fs.writeFileSync(
    inputPath,
    JSON.stringify(buildDataset()),
    "utf8"
  );

  const result = spawnSync(
    process.execPath,
    [
      scriptPath,
      "--input",
      inputPath,
      "--output",
      outputPath,
      "--pretty",
      "--generated-at",
      "fixed",
      "--fail-on-blocked",
    ],
    {
      encoding: "utf8",
    }
  );

  assert.equal(result.status, 3);

  const report = JSON.parse(
    fs.readFileSync(outputPath, "utf8")
  );

  assert.equal(report.generatedAt, "fixed");
  assert.equal(report.summary.notesItems, 6);
  assert.equal(report.productionWritesExecuted, 0);

  fs.rmSync(temporaryDirectory, {
    recursive: true,
    force: true,
  });
});
