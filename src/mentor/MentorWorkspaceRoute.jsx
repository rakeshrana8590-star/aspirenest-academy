import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  buildMentorResourceCatalog,
  buildStudentEquivalentPreview,
  resolveMentorResourceAccessState,
} from "./mentorAccessModel";
import {
  MENTOR_RESOURCE_ACCESS_STATES,
  MENTOR_RESOURCE_TYPES,
} from "./mentorConstants";
import {
  createMentorAccessRequest,
  createMentorAssignment,
  createMentorFeedback,
  loadAssignmentFeedback,
  loadMentorStudentWorkspace,
  loadMentorStudents,
} from "./mentorService";
import useMentorSession from "./useMentorSession";

const ACCESS_LABELS = Object.freeze({
  [MENTOR_RESOURCE_ACCESS_STATES.HAS_ACCESS]: "Has access",
  [MENTOR_RESOURCE_ACCESS_STATES.ACCESS_EXPIRES_SOON]: "Access expires soon",
  [MENTOR_RESOURCE_ACCESS_STATES.GRANT_REQUIRED]: "Grant required",
  [MENTOR_RESOURCE_ACCESS_STATES.NOT_ASSIGNABLE]: "Not assignable",
  [MENTOR_RESOURCE_ACCESS_STATES.ACCESS_UNAVAILABLE]: "Access unavailable",
});

const formatDate = (value) => {
  if (!value) return "—";
  const raw = typeof value?.toDate === "function" ? value.toDate() : value;
  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getProgressSummary = (items = []) => {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return { days: 0, percent: 0, lastRoadmapId: "" };
  const percent = Math.round(
    list.reduce((sum, item) => sum + Number(item.progressPercent || 0), 0) /
      list.length
  );
  return {
    days: list.length,
    percent: Math.min(100, Math.max(0, percent)),
    lastRoadmapId: list[0]?.roadmapId || "",
  };
};

function SecureState({ title, text }) {
  return (
    <section className="mentorWorkspacePage">
      <div className="mentorSecureState" role="status">
        <span>Mentor Workspace</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  );
}

export default function MentorWorkspaceRoute({
  user = null,
  isAdminUser = false,
  contentItems = [],
  roadmaps = [],
} = {}) {
  const navigate = useNavigate();
  const { studentId = "" } = useParams();
  const mentorSession = useMentorSession({ user, isAdminUser });
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState(null);
  const [queryText, setQueryText] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [objective, setObjective] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [activeFeedback, setActiveFeedback] = useState([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const mentorUid = mentorSession.profile?.mentorUid || user?.uid || "";

  useEffect(() => {
    if (!mentorSession.isMentor || !mentorUid) return;
    let active = true;
    setStudentsLoading(true);
    setStudentsError(null);

    loadMentorStudents(mentorUid)
      .then((items) => {
        if (active) setStudents(items);
      })
      .catch((error) => {
        if (active) setStudentsError(error);
      })
      .finally(() => {
        if (active) setStudentsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [mentorSession.isMentor, mentorUid]);

  const refreshWorkspace = useCallback(async () => {
    if (!mentorUid || !studentId) {
      setWorkspace(null);
      setWorkspaceLoading(false);
      setWorkspaceError(null);
      return;
    }
    setWorkspaceLoading(true);
    setWorkspaceError(null);

    try {
      const nextWorkspace = await loadMentorStudentWorkspace({
        mentorUid,
        studentUid: studentId,
      });
      setWorkspace(nextWorkspace);
    } catch (error) {
      setWorkspace(null);
      setWorkspaceError(error);
    } finally {
      setWorkspaceLoading(false);
    }
  }, [mentorUid, studentId]);

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  const catalog = useMemo(
    () => buildMentorResourceCatalog({ contentItems, roadmaps }),
    [contentItems, roadmaps]
  );

  const catalogWithAccess = useMemo(
    () =>
      catalog.map((resource) => ({
        resource,
        access: resolveMentorResourceAccessState({
          resource,
          accessRecords: workspace?.accessRecords || [],
          loading: workspaceLoading,
          error: workspaceError,
        }),
      })),
    [catalog, workspace?.accessRecords, workspaceLoading, workspaceError]
  );

  const filteredCatalog = useMemo(() => {
    const query = String(queryText || "").trim().toLowerCase();
    return catalogWithAccess.filter(({ resource }) => {
      const matchesType =
        typeFilter === "ALL" || resource.resourceType === typeFilter;
      const matchesQuery =
        !query ||
        [resource.title, resource.subtitle, resource.subject, resource.chapter]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return matchesType && matchesQuery;
    });
  }, [catalogWithAccess, queryText, typeFilter]);

  const selectedEntry =
    catalogWithAccess.find(
      ({ resource }) => resource.resourceId === selectedResourceId
    ) || null;
  const preview = selectedEntry
    ? buildStudentEquivalentPreview({
        resource: selectedEntry.resource,
        accessDecision: selectedEntry.access,
      })
    : null;
  const selectedStudentLink = students.find(
    (student) => student.studentUid === studentId
  );
  const progressSummary = getProgressSummary(workspace?.roadmapProgress || []);

  const handleAssign = async () => {
    if (!selectedEntry || !studentId) return;
    setSaving(true);
    setMessage("");

    try {
      await createMentorAssignment({
        mentorUid,
        studentUid: studentId,
        studentName:
          workspace?.profile?.name ||
          workspace?.profile?.fullName ||
          selectedStudentLink?.studentName ||
          "Student",
        resource: selectedEntry.resource,
        accessState: selectedEntry.access.state,
        matchedGrantId: selectedEntry.access.matchedAccess?.id || "",
        dueAt: dueAt || null,
        objective,
      });
      setMessage("Assignment published without changing the student's access.");
      setObjective("");
      setDueAt("");
      await refreshWorkspace();
    } catch (error) {
      setMessage(error?.message || "Assignment could not be created.");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!selectedEntry || !studentId) return;
    setSaving(true);
    setMessage("");

    try {
      await createMentorAccessRequest({
        mentorUid,
        studentUid: studentId,
        resource: selectedEntry.resource,
        reason: objective || "Required for the selected learning objective.",
      });
      setMessage(
        "Exact access request created. No plan, module, bundle or item was unlocked."
      );
    } catch (error) {
      setMessage(error?.message || "Access request could not be created.");
    } finally {
      setSaving(false);
    }
  };

  const handleLoadFeedback = async (assignmentId) => {
    try {
      setActiveFeedback(await loadAssignmentFeedback({ assignmentId, mentorUid }));
    } catch (error) {
      setMessage(error?.message || "Feedback could not be loaded.");
    }
  };

  const handleFeedback = async (assignment) => {
    if (!feedbackText.trim()) return;
    setSaving(true);
    setMessage("");

    try {
      await createMentorFeedback({
        assignmentId: assignment.id,
        mentorUid,
        studentUid: studentId,
        message: feedbackText,
      });
      setFeedbackText("");
      setMessage("Feedback published for the selected assignment.");
      await refreshWorkspace();
      await handleLoadFeedback(assignment.id);
    } catch (error) {
      setMessage(error?.message || "Feedback could not be published.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <Navigate to="/login?returnTo=%2Fmentor" replace />;
  }

  if (mentorSession.loading) {
    return (
      <SecureState
        title="Verifying mentor role"
        text="The workspace stays closed until the mentor role is verified."
      />
    );
  }

  if (mentorSession.error || !mentorSession.isMentor) {
    return (
      <SecureState
        title="Mentor access unavailable"
        text="This account does not have an active mentor role. Mentor-Guided plan access does not create mentor permissions."
      />
    );
  }

  if (!studentId) {
    return (
      <section className="mentorWorkspacePage">
        <header className="mentorWorkspaceHero">
          <div>
            <span>Mentor Workspace</span>
            <h1>Assigned learners</h1>
            <p>
              Open one assigned learner to review verified access, Roadmap
              progress, assignments and feedback.
            </p>
          </div>
          <div className="mentorWorkspaceMetric">
            <strong>{students.length}</strong>
            <span>active learners</span>
          </div>
        </header>

        {studentsLoading ? (
          <div className="mentorSecureState">Loading assigned learners…</div>
        ) : studentsError ? (
          <div className="mentorSecureState">Assigned learners are unavailable.</div>
        ) : students.length === 0 ? (
          <div className="mentorSecureState">
            No active learner link is assigned to this mentor.
          </div>
        ) : (
          <div className="mentorStudentGrid">
            {students.map((student) => (
              <button
                type="button"
                className="mentorStudentCard"
                key={student.id}
                onClick={() => navigate(`/mentor/students/${student.studentUid}`)}
              >
                <span>Assigned learner</span>
                <h2>{student.studentName || "Student"}</h2>
                <p>{student.studentEmail || student.studentUid}</p>
                <strong>Open workspace →</strong>
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  if (workspaceLoading) {
    return (
      <SecureState
        title="Verifying learner workspace"
        text="Profile, entitlement and Roadmap progress reads are checked against the assigned-student relationship."
      />
    );
  }

  if (workspaceError || !workspace) {
    return (
      <SecureState
        title="Learner workspace unavailable"
        text="The assigned-student relationship or required records could not be verified."
      />
    );
  }

  return (
    <section className="mentorWorkspacePage">
      <header className="mentorWorkspaceHero">
        <div>
          <button type="button" className="mentorBackButton" onClick={() => navigate("/mentor")}>
            ← Assigned learners
          </button>
          <span>Student detail workspace</span>
          <h1>
            {workspace.profile?.name ||
              workspace.profile?.fullName ||
              selectedStudentLink?.studentName ||
              "Assigned learner"}
          </h1>
          <p>
            Assignment, access and commercial plan remain separate. Every
            resource below uses the learner's current entitlement projection.
          </p>
        </div>
        <div className="mentorMetricGrid">
          <div><strong>{workspace.accessRecords.length}</strong><span>access records</span></div>
          <div><strong>{progressSummary.percent}%</strong><span>Roadmap progress</span></div>
          <div><strong>{workspace.assignments.length}</strong><span>assignments</span></div>
        </div>
      </header>

      <div className="mentorWorkspaceColumns">
        <div className="mentorWorkspaceMain">
          <section className="mentorPanel">
            <div className="mentorPanelHeader">
              <div>
                <span>Access-aware content picker</span>
                <h2>Choose an exact resource</h2>
              </div>
              <strong>{filteredCatalog.length} resources</strong>
            </div>

            <div className="mentorPickerFilters">
              <input
                value={queryText}
                onChange={(event) => setQueryText(event.target.value)}
                placeholder="Search title, subject or chapter"
                aria-label="Search mentor content picker"
              />
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                aria-label="Filter mentor resources by type"
              >
                <option value="ALL">All content</option>
                {Object.values(MENTOR_RESOURCE_TYPES).map((type) => (
                  <option value={type} key={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="mentorResourceList">
              {filteredCatalog.map(({ resource, access }) => (
                <button
                  type="button"
                  key={`${resource.resourceType}:${resource.resourceId}`}
                  className={`mentorResourceCard ${selectedResourceId === resource.resourceId ? "isSelected" : ""}`}
                  onClick={() => setSelectedResourceId(resource.resourceId)}
                >
                  <div>
                    <span>{resource.resourceType} • {resource.requiredPlan}</span>
                    <h3>{resource.title}</h3>
                    <p>{resource.subtitle || resource.subject || "Exact learning resource"}</p>
                  </div>
                  <strong data-access-state={access.state}>
                    {ACCESS_LABELS[access.state] || access.state}
                  </strong>
                </button>
              ))}
            </div>
          </section>

          <section className="mentorPanel">
            <div className="mentorPanelHeader">
              <div>
                <span>Assignments and feedback</span>
                <h2>Learning work queue</h2>
              </div>
            </div>

            {workspace.assignments.length === 0 ? (
              <p className="mentorEmptyText">No assignments have been published for this learner.</p>
            ) : (
              <div className="mentorAssignmentList">
                {workspace.assignments.map((assignment) => (
                  <article className="mentorAssignmentCard" key={assignment.id}>
                    <div>
                      <span>{assignment.status} • Due {formatDate(assignment.dueAt)}</span>
                      <h3>{assignment.title}</h3>
                      <p>{assignment.objective || "No additional objective."}</p>
                    </div>
                    <div className="mentorAssignmentActions">
                      <button type="button" onClick={() => handleLoadFeedback(assignment.id)}>
                        View feedback
                      </button>
                      <button type="button" onClick={() => handleFeedback(assignment)} disabled={saving || !feedbackText.trim()}>
                        Publish feedback
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <textarea
              value={feedbackText}
              onChange={(event) => setFeedbackText(event.target.value)}
              placeholder="Write feedback for the assignment selected above"
              maxLength={4000}
            />
            {activeFeedback.length > 0 ? (
              <div className="mentorFeedbackList">
                {activeFeedback.map((feedback) => (
                  <p key={feedback.id}>{feedback.message}</p>
                ))}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="mentorWorkspaceAside">
          <section className="mentorPanel mentorStickyPanel">
            <span>Student-equivalent preview</span>
            <h2>{preview?.title || "Select a resource"}</h2>
            <p>{preview?.message || "Choose a resource to verify the learner's exact access state."}</p>

            {selectedEntry ? (
              <>
                <label>
                  Due date
                  <input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
                </label>
                <label>
                  Learning objective
                  <textarea
                    value={objective}
                    onChange={(event) => setObjective(event.target.value)}
                    maxLength={1000}
                    placeholder="Why should the learner complete this resource?"
                  />
                </label>

                {selectedEntry.access.assignable ? (
                  <button type="button" className="mentorPrimaryButton" onClick={handleAssign} disabled={saving}>
                    Assign exact resource
                  </button>
                ) : selectedEntry.access.state === MENTOR_RESOURCE_ACCESS_STATES.GRANT_REQUIRED ? (
                  <button type="button" className="mentorPrimaryButton" onClick={handleRequestAccess} disabled={saving}>
                    Request exact access
                  </button>
                ) : (
                  <button type="button" disabled>Assignment unavailable</button>
                )}
              </>
            ) : null}

            {message ? <p className="mentorActionMessage" role="status">{message}</p> : null}
          </section>

          <section className="mentorPanel">
            <span>Roadmap mentor launch readiness</span>
            <h2>{progressSummary.percent}% current progress</h2>
            <p>{progressSummary.days} Roadmap day records are visible to this assigned mentor.</p>
            <ul>
              <li>Roadmap access never unlocks linked resources.</li>
              <li>Each linked target keeps independent authorization.</li>
              <li>Progress reads are limited to assigned learners.</li>
            </ul>
          </section>
        </aside>
      </div>
    </section>
  );
}
