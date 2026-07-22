import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/components/ctet/CtetPremiumHeader.jsx"
  ),
  "utf8"
);

test("global header resolves the active mentor persona", () => {
  expect(source).toContain(
    'import useMentorSession from "../../mentor/useMentorSession"'
  );
  expect(source).toMatch(
    /useMentorSession\(\{[\s\S]*user,[\s\S]*isAdminUser/
  );
});

test("mentor presentation is passed to the adaptive shell model", () => {
  expect(source).toContain("isMentorUser");
  expect(source).toMatch(
    /buildAdaptiveShellHeaderModel\(\{[\s\S]*isMentorUser/
  );
});

test("mentor state is fail-closed while role verification is loading or unavailable", () => {
  expect(source).toMatch(
    /!mentorSession\.loading[\s\S]*!mentorSession\.error[\s\S]*mentorSession\.isMentor/
  );
});
