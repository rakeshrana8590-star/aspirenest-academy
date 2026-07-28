import React from "react";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";

import V8LearningDriveRuntime from "./V8LearningDriveRuntime";

const cssResponse = ':root{--ink:#172033}html{height:100%}body{margin:0}.app-shell{display:grid}.brand{background:transparent}';
const scriptResponse = `(() => {
  const page = document.getElementById('pageContent');
  if (page) page.innerHTML = '<div class="v8-page-shell"><h1>Shadow Learning Drive</h1></div>';
  const app = document.getElementById('app');
  if (app) app.classList.add('v8-test-booted');
})();`;

describe("V8LearningDriveRuntime Shadow DOM mount", () => {
  let container;
  let root;
  let originalFetch;
  let originalAnimationFrame;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    originalFetch = global.fetch;
    originalAnimationFrame = global.requestAnimationFrame;
    global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
    global.fetch = jest.fn(async (url) => ({
      ok: true,
      status: 200,
      text: async () => String(url).endsWith(".css") ? cssResponse : scriptResponse,
    }));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    global.fetch = originalFetch;
    global.requestAnimationFrame = originalAnimationFrame;
    delete window.__aspirenestRuntimeContext;
    delete window.__aspirenestAllowedRoles;
    delete window.__aspirenestRole;
    delete window.__aspirenestExperienceRole;
  });

  test("boots inside Shadow DOM without leaking V8 selectors or script tags to the document", async () => {
    await act(async () => {
      root.render(<V8LearningDriveRuntime experience="public" />);
      await new Promise((resolve) => setTimeout(resolve, 30));
    });

    const host = container.querySelector(".aspirenestV8ShadowHost");
    expect(host).not.toBeNull();
    expect(host.shadowRoot).not.toBeNull();
    expect(host.shadowRoot.querySelector("#app")).not.toBeNull();
    expect(host.shadowRoot.querySelector("#pageContent h1")?.textContent).toBe("Shadow Learning Drive");
    expect(host.shadowRoot.querySelector('style[data-v8-shadow-style="foundation"]')).not.toBeNull();
    expect(host.shadowRoot.querySelectorAll("style[data-v8-shadow-style]").length).toBe(4);

    expect(document.querySelector("#pageContent")).toBeNull();
    expect(document.querySelector('script[data-aspirenest-v8-script]')).toBeNull();
    expect(document.querySelector('link[data-aspirenest-v8-style]')).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(6);
  });
});
