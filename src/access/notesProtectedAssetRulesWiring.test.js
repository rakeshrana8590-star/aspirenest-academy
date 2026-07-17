const fs = require("node:fs");
const path = require("node:path");

const readSource = (relativePath) =>
  fs.readFileSync(
    path.join(process.cwd(), relativePath),
    "utf8"
  );

const extractBlock = (
  source,
  startMarker,
  endMarker
) => {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  if (start < 0 || end <= start) {
    throw new Error(
      `Unable to extract block: ${startMarker}`
    );
  }

  return source.slice(start, end);
};

describe(
  "Phase 8A-5 protected Notes asset rules hardening",
  () => {
    const rules = readSource("firestore.rules");
    const rulesTests = readSource(
      "tests/firestore/accessRules.test.cjs"
    );
    const appSource = readSource("src/App.js");
    const serviceSource = readSource(
      "src/protectedContentAssetsService.js"
    );
    const functionsSource = readSource(
      "functions/index.js"
    );

    test(
      "protectedContentAssets browser access is admin-only",
      () => {
        const block = extractBlock(
          rules,
          "match /protectedContentAssets/{assetId}",
          "match /contentItems/{docId}"
        );

        expect(block).toContain(
          "allow read: if isAdmin();"
        );
        expect(block).toContain(
          "allow create, update, delete: if isAdmin();"
        );
        expect(block).not.toContain(
          "canReadProtectedContentAsset"
        );
      }
    );

    test(
      "legacy entitlement-based browser read helpers are removed",
      () => {
        expect(rules).not.toContain(
          "function hasProtectedStudentEntitlement"
        );
        expect(rules).not.toContain(
          "function hasProtectedPlanEntitlement"
        );
        expect(rules).not.toContain(
          "function canReadProtectedContentAsset"
        );
      }
    );

    test(
      "public-safe contentItems metadata remains publicly readable",
      () => {
        const block = extractBlock(
          rules,
          "match /contentItems/{docId}",
          "match /universalContent/{docId}"
        );

        expect(block).toContain(
          "allow read: if true;"
        );
        expect(block).toContain(
          "allow create, update, delete: if isAdmin();"
        );
      }
    );

    test(
      "rules runtime covers plan and ITEM entitlement bypass denial",
      () => {
        expect(rulesTests).toContain(
          "even with active plan access"
        );
        expect(rulesTests).toContain(
          "even with an exact ITEM entitlement"
        );
        expect(rulesTests).toContain(
          'collection(studentDb(), "protectedContentAssets")'
        );
      }
    );

    test(
      "rules runtime preserves admin protected-asset management",
      () => {
        expect(rulesTests).toContain(
          "admin browser can read and list protected assets"
        );
        expect(rulesTests).toContain(
          "protected asset browser writes are admin-only"
        );
        expect(rulesTests).toContain(
          "await assertSucceeds(deleteDoc(adminRef))"
        );
      }
    );

    test(
      "student Notes handler never reads protected assets directly",
      () => {
        const handler = extractBlock(
          appSource,
          "const handleNoteAccess = async",
          "const handlePremiumSectionAccess"
        );

        expect(handler).toContain(
          "resolveStudentNotesProtectedAsset"
        );
        expect(handler).toContain(
          "runtimeResult.asset.assetUrl"
        );
        expect(handler).not.toContain(
          "readProtectedContentAsset"
        );
        expect(handler).not.toContain(
          "getProtectedContentUrl"
        );
      }
    );

    test(
      "admin Notes edit path retains protected asset read support",
      () => {
        expect(appSource).toContain(
          "await readProtectedContentAsset(item.id)"
        );
        expect(appSource).toContain(
          "Admin Notes protected asset could not be loaded:"
        );
        expect(serviceSource).toContain(
          "export const readProtectedContentAsset"
        );
      }
    );

    test(
      "server callable resolves protected assets through Admin SDK",
      () => {
        expect(functionsSource).toContain(
          'exports.resolveNotesProtectedAsset = onCall('
        );
        expect(functionsSource).toContain(
          'NOTES_ASSET_COLLECTION ='
        );
        expect(functionsSource).toContain(
          '"protectedContentAssets"'
        );
        expect(functionsSource).toContain(
          "getFirestore()"
        );
      }
    );
  }
);
