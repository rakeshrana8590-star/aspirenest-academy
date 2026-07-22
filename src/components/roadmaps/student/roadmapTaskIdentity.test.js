import {
  buildRoadmapTaskToggle,
  getCompletedTaskIdsForDay,
  getRoadmapTaskId,
} from "./roadmapStudentUtils";

test("uses the canonical taskId field", () => {
  expect(getRoadmapTaskId({ taskId: "task-1" })).toBe("task-1");
});

test("accepts the legacy id field used by seeded and older Roadmap tasks", () => {
  expect(getRoadmapTaskId({ id: "legacy-task" })).toBe("legacy-task");
});

test("prefers taskId when both task identity fields exist", () => {
  expect(
    getRoadmapTaskId({
      taskId: "canonical-task",
      id: "legacy-task",
    })
  ).toBe("canonical-task");
});

test("normalizes whitespace around task identity", () => {
  expect(getRoadmapTaskId({ id: "  task-2  " })).toBe("task-2");
});

test("adds a legacy-id task without writing undefined", () => {
  expect(
    buildRoadmapTaskToggle({
      completedTaskIds: [],
      task: { id: "task-p12-demo" },
    })
  ).toEqual({
    allowed: true,
    reason: "",
    taskId: "task-p12-demo",
    alreadyCompleted: false,
    nextCompletedTaskIds: ["task-p12-demo"],
  });
});

test("removes a completed canonical task on the next toggle", () => {
  expect(
    buildRoadmapTaskToggle({
      completedTaskIds: ["task-1"],
      task: { taskId: "task-1" },
    }).nextCompletedTaskIds
  ).toEqual([]);
});

test("fails closed when a task has no usable identity", () => {
  expect(
    buildRoadmapTaskToggle({
      completedTaskIds: ["existing-task"],
      task: { title: "Missing ID" },
    })
  ).toEqual({
    allowed: false,
    reason: "TASK_ID_MISSING",
    taskId: "",
    alreadyCompleted: false,
    nextCompletedTaskIds: ["existing-task"],
  });
});

test("filters blank legacy progress values before rendering or saving", () => {
  expect(
    getCompletedTaskIdsForDay({
      dayId: "day-1",
      progressItems: [
        {
          dayId: "day-1",
          completedTaskIds: [" task-1 ", "", null],
        },
      ],
    })
  ).toEqual(["task-1"]);
});
