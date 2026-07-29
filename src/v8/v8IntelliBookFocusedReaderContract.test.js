import fs from "fs";
import path from "path";

const reader = fs.readFileSync(path.join(process.cwd(), "public/intellibook.js"), "utf8");
const styles = fs.readFileSync(path.join(process.cwd(), "public/intellibook.css"), "utf8");

describe("AspireNest worldwide focused reader acceptance contract", () => {
  test("document-first layout removes the oversized Book View hero and preserves the full reading viewport", () => {
    expect(styles).toContain('.detail-drawer[data-intellibook-active="true"] .drawer-hero');
    expect(styles).toContain("display: none !important");
    expect(styles).toContain("grid-template-rows: auto minmax(0, 1fr)");
    expect(styles).toContain("overflow: hidden");
  });

  test("uses adaptive left pages and right study panes without deleting study actions", () => {
    expect(reader).toContain("toggle-pages");
    expect(reader).toContain("toggle-study");
    expect(reader).toContain("intelliBookStudyPanel");
    expect(reader).toContain("intelliBookStudyToolbar");
    expect(styles).toContain('[data-intellibook-pages-open="true"]');
    expect(styles).toContain('[data-intellibook-study-open="true"]');
    expect(styles).toContain('grid-template-columns: 246px minmax(0, 1fr) 322px');
  });

  test("provides lazy page thumbnails, active-page sync and bookmark state", () => {
    expect(reader).toContain("renderPdfThumbnail");
    expect(reader).toContain("setupThumbnailObservers");
    expect(reader).toContain("data-intellibook-thumbnail");
    expect(reader).toContain("data-intellibook-bookmark-star");
    expect(reader).toContain("scrollIntoView?.({ block: 'center'");
  });

  test("supports compact mobile controls without squeezing the desktop toolbar", () => {
    expect(reader).toContain("responsiveSize");
    expect(reader).toContain("compact");
    expect(reader).toContain("medium");
    expect(reader).toContain("wide");
    expect(styles).toContain('[data-intellibook-size="compact"]');
    expect(styles).toContain("env(safe-area-inset-bottom)");
    expect(styles).toContain(".intelliBookMobileNav");
  });

  test("exposes a deterministic runtime diagnostics contract", () => {
    expect(reader).toContain("__ASPIRENEST_INTELLIBOOK_DIAGNOSTICS__");
    expect(reader).toContain("fitPage: true");
    expect(reader).toContain("edgeNavigation: true");
    expect(reader).toContain("directStudyActions: Array.from(STUDY_ACTIONS)");
    expect(reader).toContain("keyboardNavigation: true");
    expect(reader).toContain("touchNavigation: true");
  });
});
