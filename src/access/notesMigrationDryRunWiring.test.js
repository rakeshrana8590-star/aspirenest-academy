import fs from "fs";
import path from "path";

describe(
  "Phase 8A-6 legacy Notes metadata migration dry-run wiring",
  () => {
    const root = path.resolve(__dirname, "../..");
    const scriptPath = path.join(
      root,
      "scripts/phase8a6NotesMetadataMigrationDryRun.cjs"
    );
    const scriptTestPath = path.join(
      root,
      "scripts/phase8a6NotesMetadataMigrationDryRun.test.cjs"
    );
    const publicMetadataPath = path.join(
      root,
      "src/access/notesPublicMetadata.js"
    );

    const script = fs.readFileSync(
      scriptPath,
      "utf8"
    );
    const scriptTests = fs.readFileSync(
      scriptTestPath,
      "utf8"
    );
    const publicMetadata = fs.readFileSync(
      publicMetadataPath,
      "utf8"
    );

    test(
      "dry-run script has no Firebase, Admin SDK, network, or production connector dependency",
      () => {
        for (const forbidden of [
          "firebase-admin",
          "firebase/app",
          "firebase/firestore",
          "https.request",
          "http.request",
          "fetch(",
          "axios",
        ]) {
          expect(script).not.toContain(forbidden);
        }
      }
    );

    test(
      "dry-run report explicitly proves zero production reads and writes",
      () => {
        expect(script).toContain("dryRun: true");
        expect(script).toContain(
          "productionReadsExecuted: 0"
        );
        expect(script).toContain(
          "productionWritesExecuted: 0"
        );
        expect(script).toContain(
          "sourceMutationExecuted: false"
        );
      }
    );

    test(
      "migration plan records URL field names without URL values",
      () => {
        expect(script).toContain(
          "rawAssetValuesIncluded: false"
        );
        expect(script).toContain(
          "urlValuesIncluded: false"
        );
        expect(script).toContain(
          "urlsIncludedInReport: false"
        );
      }
    );

    test(
      "migration plan uses canonical Notes ITEM scope metadata",
      () => {
        expect(script).toContain(
          'scopeType: "ITEM"'
        );
        expect(script).toContain(
          'module: "notes"'
        );
        expect(script).toContain(
          'itemType: "notesPdf"'
        );
        expect(script).toContain("itemId: noteId");
      }
    );

    test(
      "CLI accepts only a local export and optional local report path",
      () => {
        expect(script).toContain('"--input"');
        expect(script).toContain('"--output"');
        expect(script).toContain('"--pretty"');
        expect(script).toContain(
          '"--fail-on-blocked"'
        );
        expect(script).toContain(
          "fs.readFileSync(inputPath"
        );
        expect(script).toContain(
          "fs.writeFileSync("
        );
      }
    );

    test(
      "script classifies ready, sanitize, backfill, patch, blocked, and skipped Notes",
      () => {
        for (const classification of [
          "READY",
          "SANITIZE_PUBLIC_METADATA",
          "BACKFILL_THEN_SANITIZE",
          "PATCH_PUBLIC_METADATA",
          "BLOCKED_MISSING_PROTECTED_ASSET",
          "BLOCKED_NO_ASSET_SOURCE",
          "SKIP_UNPUBLISHED_NO_ASSET",
        ]) {
          expect(script).toContain(classification);
        }
      }
    );

    test(
      "Node contract contains exactly 24 deterministic migration tests",
      () => {
        const matches =
          scriptTests.match(/^test\(/gm) || [];

        expect(matches).toHaveLength(24);
        expect(scriptTests).toContain(
          "never includes raw URL values in the report"
        );
        expect(scriptTests).toContain(
          "does not mutate source data"
        );
        expect(scriptTests).toContain(
          "returns exact fixture summary counts"
        );
      }
    );

    test(
      "public Notes metadata sanitizer remains the runtime source of URL stripping",
      () => {
        expect(publicMetadata).toContain(
          "buildPublicNotesMetadata"
        );
        expect(publicMetadata).toContain(
          "stripNotesRawAssetFields"
        );
        expect(publicMetadata).toContain(
          "sanitizeContentItemsForClient"
        );
      }
    );
  }
);
