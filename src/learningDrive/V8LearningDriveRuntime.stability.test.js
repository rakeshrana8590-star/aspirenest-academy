import fs from "fs";
import path from "path";

const runtime = fs.readFileSync(path.join(__dirname, "V8LearningDriveRuntime.jsx"), "utf8");

describe("V8 Shadow runtime stability", () => {
  test("synchronizes only changed text and cannot recurse through innerHTML", () => {
    expect(runtime).toContain("if (node.textContent === next) return false");
    expect(runtime).toContain("node.textContent = next");
    expect(runtime).toContain("observer = new MutationObserver(synchronizeRuntimeChrome)");
    expect(runtime).not.toContain("quick.innerHTML");
  });

  test("cleans every scoped runtime listener and the Shadow DOM on unmount", () => {
    expect(runtime).toContain("environment?.cleanup()");
    expect(runtime).toContain('shadowRoot.removeEventListener("click", bridgeClick, true)');
    expect(runtime).toContain('shadowRoot.removeEventListener("keydown", bridgeKeydown, true)');
    expect(runtime).toContain("shadowRoot.replaceChildren()");
  });
});
