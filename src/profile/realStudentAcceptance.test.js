import {
  buildRealStudentAcceptanceReport,
  mergeRealStudentAcceptanceRecords,
} from "./realStudentAcceptance";

describe("real student read acceptance", () => {
  test("excludes fixed staff identities and preserves all other accounts as students", () => {
    const report = buildRealStudentAcceptanceReport({
      directory: [
        { uid: "admin-1", email: "aspirenestplatform@gmail.com" },
        { uid: "mentor-1", email: "dr.varshamaru@gmail.com" },
        { uid: "student-1", email: "one@example.com", name: "One" },
        { uid: "student-2", email: "two@example.com", name: "Two" },
      ],
      profiles: [
        { uid: "student-1", email: "one@example.com", planType: "PREMIUM" },
      ],
    });

    expect(report.uniqueStudents).toBe(2);
    expect(report.staffRecordsExcluded).toBe(2);
    expect(report.withUid).toBe(2);
    expect(report.status).toBe("green");
    expect(report.students.map((item) => item.email)).toEqual([
      "one@example.com",
      "two@example.com",
    ]);
  });

  test("merges current directory and learner profile records without recreating accounts", () => {
    const rows = mergeRealStudentAcceptanceRecords({
      directory: [
        { uid: "uid-1", email: "learner@example.com", name: "Learner" },
      ],
      profiles: [
        { uid: "uid-1", email: "learner@example.com", planType: "BASIC" },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].uid).toBe("uid-1");
    expect(rows[0].planType).toBe("BASIC");
    expect(rows[0].role).toBe("student");
  });

  test("fails closed when the same email maps to different UIDs", () => {
    const report = buildRealStudentAcceptanceReport({
      directory: [
        { uid: "uid-1", email: "learner@example.com" },
        { uid: "uid-2", email: "learner@example.com" },
      ],
    });

    expect(report.emailConflicts).toBe(1);
    expect(report.status).toBe("red");
  });
});
