const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const source = (relative) =>
  fs.readFileSync(path.join(root, relative), "utf8");

describe("V8 experience route ownership regression lock", () => {
  const publicIndex = source("public/index.html");
  const app = source("public/app.js");
  const admin = source("public/admin.js");
  const experiences = source("public/v8-experiences.js");
  const bootstrap = source("public/v8-route-bootstrap.js");
  const roleRuntime = fs.readFileSync(
    path.join(__dirname, "v8RoleRuntime.js"),
    "utf8"
  );

  test("initial path establishes one authoritative active experience", () => {
    expect(bootstrap).toContain(
      "window.__aspirenestActiveExperience = experience;"
    );
    expect(
      roleRuntime.indexOf(
        "runtime.__aspirenestActiveExperience = target;"
      )
    ).toBeLessThan(
      roleRuntime.indexOf('if (target === "admin")')
    );
  });

  test("Student data events cannot repaint Public, Mentor or Admin", () => {
    expect(app).toContain(
      "const isStudentExperienceActive = () => activeExperience() === 'student'"
    );
    expect(app).toContain(
      "if(isStudentExperienceActive()){renderNav();renderPage();"
    );
    expect(app).toContain(
      "if (!isStudentExperienceActive()) return;"
    );
  });

  test("Admin renderer owns chrome only while Admin is active", () => {
    expect(admin).toContain(
      "function isAdmin(){return activeExperience()==='admin'"
    );
    expect(admin).toContain(
      "window.__aspirenestActiveExperience='admin';"
    );
    expect(admin).toContain(
      "window.__aspirenestActiveExperience='student';"
    );
  });

  test("Public and Mentor renderer publishes route ownership", () => {
    expect(experiences).toContain(
      "function enterExperience(role){\n    window.__aspirenestActiveExperience=role;"
    );
    expect(experiences).toContain(
      "window.__aspirenestActiveExperience=parts[0];"
    );
    expect(experiences).toContain(
      "function triggerCoreRole(role){\n    window.__aspirenestActiveExperience=role;"
    );
  });

  test("public/index.html proves the active integrated root assets", () => {
    expect(publicIndex).toContain(
      '<script src="/app.js" defer></script>'
    );
    expect(publicIndex).toContain(
      '<script src="/admin.js" defer></script>'
    );
    expect(publicIndex).toContain(
      '<script src="/v8-experiences.js" defer></script>'
    );
    expect(publicIndex).toContain(
      '<link rel="stylesheet" href="/styles.css" />'
    );
  });

  test("standalone Learning Drive assets remain available without being overwritten", () => {
    expect(
      fs.existsSync(
        path.join(root, "public/learning-drive-v8/app.js")
      )
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(root, "public/learning-drive-v8/styles.css")
      )
    ).toBe(true);
  });

  test("greeting keeps title with first name instead of rendering Dr alone", () => {
    expect(app).toContain("function studentGreetingName()");
    expect(app).toContain(
      "heading(`Welcome back, ${escapeHtml(studentGreetingName())}`"
    );
  });
});
