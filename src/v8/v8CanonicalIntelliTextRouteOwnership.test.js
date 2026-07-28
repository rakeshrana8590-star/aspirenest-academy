import fs from "fs";
import path from "path";

import {
  activateV8Experience,
  preserveV8StudentReaderRoute,
} from "./v8RoleRuntime";

const NOTE_ID = "KdOrZcjhf7wo85O5N4sn";
const NOTE_PATH = `/ctet-tet/notes/read/${NOTE_ID}`;

const makeRuntime = ({
  pathname = NOTE_PATH,
  hash = "#home/overview",
} = {}) => {
  const location = {
    pathname,
    search: "",
    hash,
  };
  const history = {
    state: null,
    replaceState: jest.fn((state, _title, target) => {
      history.state = state;
      const hashIndex = target.indexOf("#");
      location.pathname =
        hashIndex >= 0 ? target.slice(0, hashIndex) : target;
      location.hash =
        hashIndex >= 0 ? target.slice(hashIndex) : "";
    }),
  };

  return {
    location,
    history,
    __aspirenestRequestedPath: NOTE_PATH,
    __aspirenestStudentAPI: {
      navigate: jest.fn(),
      routeFromHash: jest.fn(),
    },
    __aspirenestAdminAPI: {
      enterAdmin: jest.fn(),
      exitAdmin: jest.fn(),
    },
    __aspirenestExperienceAPI: {
      enterExperience: jest.fn(),
      cleanupExperience: jest.fn(),
    },
    dispatchEvent: jest.fn(),
  };
};

describe("canonical IntelliText route ownership", () => {
  test("repairs the exact observed #home/overview takeover", () => {
    const runtime = makeRuntime();

    const result = preserveV8StudentReaderRoute(runtime);

    expect(result).toEqual(
      expect.objectContaining({
        textbookId: NOTE_ID,
        mode: "side",
        hash: `#learning/reader/${NOTE_ID}/side`,
      })
    );
    expect(runtime.history.replaceState).toHaveBeenCalledWith(
      expect.objectContaining({
        aspirenestReader: true,
        resourceId: NOTE_ID,
        readerMode: "side",
      }),
      "",
      `${NOTE_PATH}#learning/reader/${NOTE_ID}/side`
    );
    expect(runtime.location.hash).toBe(
      `#learning/reader/${NOTE_ID}/side`
    );
  });

  test("student activation routes the canonical Note and never navigates Home", async () => {
    const runtime = makeRuntime();

    await activateV8Experience("student", runtime);

    expect(
      runtime.__aspirenestStudentAPI.routeFromHash
    ).toHaveBeenCalledTimes(1);
    expect(
      runtime.__aspirenestStudentAPI.navigate
    ).not.toHaveBeenCalled();
    expect(runtime.location.hash).toBe(
      `#learning/reader/${NOTE_ID}/side`
    );
  });

  test("the active Student app blocks late Home takeover on canonical Note paths", () => {
    const app = fs.readFileSync(
      path.join(process.cwd(), "public/app.js"),
      "utf8"
    );

    expect(app).toContain(
      "function ensureCanonicalIntelliTextReaderHash()"
    );
    expect(app).toContain(
      "const canonicalReader = ensureCanonicalIntelliTextReaderHash();"
    );
    expect(app).toContain(
      "parent === 'home'"
    );
    expect(app).toContain(
      "routeFromHash();"
    );
    expect(app).toContain(
      "ensureCanonicalIntelliTextReaderHash};"
    );
  });
});
