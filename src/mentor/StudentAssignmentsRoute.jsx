import React, { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  loadAssignmentFeedback,
  loadStudentAssignments,
  markStudentAssignmentComplete,
} from "./mentorService";
import { isSafeMentorRoute } from "./mentorAccessModel";

const formatDate = (value) => {
  if (!value) return "No due date";
  const raw = typeof value?.toDate === "function" ? value.toDate() : value;
  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function StudentAssignmentsRoute({ user = null } = {}) {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const userUid = user?.uid || "";

  const refresh = useCallback(async () => {
    if (!userUid) {
      setAssignments([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setAssignments(await loadStudentAssignments(userUid));
    } catch (nextError) {
      setError(nextError);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [userUid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const showFeedback = async (assignmentId) => {
    try {
      const items = await loadAssignmentFeedback({ assignmentId, studentUid: userUid });
      setFeedback((current) => ({ ...current, [assignmentId]: items }));
    } catch (nextError) {
      setMessage(nextError?.message || "Feedback could not be loaded.");
    }
  };

  const completeAssignment = async (assignmentId) => {
    try {
      await markStudentAssignmentComplete({ assignmentId });
      setMessage("Assignment marked complete.");
      await refresh();
    } catch (nextError) {
      setMessage(nextError?.message || "Assignment could not be completed.");
    }
  };

  if (!user) {
    return <Navigate to="/login?returnTo=%2Fassignments" replace />;
  }

  return (
    <section className="mentorWorkspacePage studentAssignmentsPage">
      <header className="mentorWorkspaceHero">
        <div>
          <span>My Assignments</span>
          <h1>Mentor-guided learning queue</h1>
          <p>
            An assignment does not create paid access. Every protected resource
            rechecks your current entitlement when opened.
          </p>
        </div>
        <div className="mentorWorkspaceMetric">
          <strong>{assignments.length}</strong>
          <span>assignments</span>
        </div>
      </header>

      {loading ? (
        <div className="mentorSecureState">Loading your assignments…</div>
      ) : error ? (
        <div className="mentorSecureState">Assignments are temporarily unavailable.</div>
      ) : assignments.length === 0 ? (
        <div className="mentorSecureState">No mentor assignment is available yet.</div>
      ) : (
        <div className="mentorAssignmentList">
          {assignments.map((assignment) => (
            <article className="mentorAssignmentCard" key={assignment.id}>
              <div>
                <span>{assignment.status} • {formatDate(assignment.dueAt)}</span>
                <h2>{assignment.title}</h2>
                <p>{assignment.objective || "Complete the assigned learning resource."}</p>
              </div>
              <div className="mentorAssignmentActions">
                <button
                  type="button"
                  onClick={() =>
                    isSafeMentorRoute(assignment.canonicalRoute)
                      ? navigate(assignment.canonicalRoute)
                      : setMessage("This assignment does not have a safe resource route.")
                  }
                >
                  Open resource
                </button>
                {!['completed', 'reviewed', 'cancelled'].includes(assignment.status) ? (
                  <button type="button" onClick={() => completeAssignment(assignment.id)}>
                    Mark complete
                  </button>
                ) : null}
                <button type="button" onClick={() => showFeedback(assignment.id)}>
                  View feedback
                </button>
              </div>
              {(feedback[assignment.id] || []).map((item) => (
                <blockquote key={item.id}>{item.message}</blockquote>
              ))}
            </article>
          ))}
        </div>
      )}

      {message ? <p className="mentorActionMessage" role="status">{message}</p> : null}
    </section>
  );
}
