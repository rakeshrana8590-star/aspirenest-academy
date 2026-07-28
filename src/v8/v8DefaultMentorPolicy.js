import {
  ASPIRENEST_MENTOR_EMAIL,
  normalizeAspireNestEmail,
} from "../auth/aspireNestIdentity";

export const ASPIRENEST_DEFAULT_MENTOR_NAME = "Dr. Varsha Maru";
export const ASPIRENEST_DEFAULT_MENTOR_EMAIL = ASPIRENEST_MENTOR_EMAIL;
export const ASPIRENEST_DEFAULT_MENTOR_POLICY_ID = "default-mentor-v1";

const clean = (value = "") => String(value ?? "").trim();

const learnerUids = (learner = {}) =>
  [...new Set([learner.uid, learner.id, ...(learner.uidAliases || [])].map(clean).filter(Boolean))];

const learnerEmails = (learner = {}) =>
  [...new Set([learner.email, ...(learner.emailAliases || [])].map(normalizeAspireNestEmail).filter(Boolean))];

const isActive = (record = {}) => {
  const status = clean(record.status || record.assignmentStatus || record.mentorAssignmentStatus).toLowerCase();
  return !status || ["active", "assigned", "published", "verified"].includes(status);
};

const relationMatchesLearner = (relation = {}, learner = {}) => {
  const relationUid = clean(relation.studentUid || relation.learnerUid || relation.uid || relation.userId);
  if (relationUid && learnerUids(learner).includes(relationUid)) return true;
  const relationEmail = normalizeAspireNestEmail(
    relation.studentEmail || relation.learnerEmail || relation.email || relation.normalizedEmail
  );
  return Boolean(relationEmail && learnerEmails(learner).includes(relationEmail));
};

const relationMatchesMentor = (relation = {}, mentor = {}) => {
  const relationUid = clean(relation.mentorUid || relation.mentorId);
  const mentorUid = clean(mentor.uid || mentor.id);
  if (relationUid && mentorUid && relationUid === mentorUid) return true;
  const relationEmail = normalizeAspireNestEmail(relation.mentorEmail);
  const mentorEmail = normalizeAspireNestEmail(mentor.email);
  return Boolean(relationEmail && mentorEmail && relationEmail === mentorEmail);
};

export const findAspireNestDefaultMentor = (mentors = []) => {
  const exact = (Array.isArray(mentors) ? mentors : []).find(
    (mentor) => normalizeAspireNestEmail(mentor.email) === ASPIRENEST_DEFAULT_MENTOR_EMAIL
  );
  return exact || null;
};

export const applyAspireNestDefaultMentorPolicy = ({
  learners = [],
  mentors = [],
  mentorStudentLinks = [],
} = {}) => {
  const defaultMentor = findAspireNestDefaultMentor(mentors);
  const mentorName = clean(defaultMentor?.name || defaultMentor?.displayName) || ASPIRENEST_DEFAULT_MENTOR_NAME;
  const mentorEmail = normalizeAspireNestEmail(defaultMentor?.email) || ASPIRENEST_DEFAULT_MENTOR_EMAIL;
  const mentorUid = clean(defaultMentor?.uid || defaultMentor?.id);
  const links = (Array.isArray(mentorStudentLinks) ? mentorStudentLinks : []).filter(isActive);

  const projectedLearners = (Array.isArray(learners) ? learners : []).map((learner) => {
    const explicitLink = links.find(
      (link) => relationMatchesLearner(link, learner) && (!defaultMentor || relationMatchesMentor(link, defaultMentor))
    );
    const profileMentorEmail = normalizeAspireNestEmail(learner.mentorEmail);
    const profileMentorUid = clean(learner.mentorUid);
    const profileAssigned =
      isActive({ status: learner.mentorAssignmentStatus }) &&
      (profileMentorEmail === mentorEmail || (mentorUid && profileMentorUid === mentorUid));
    const persisted = Boolean(explicitLink || profileAssigned);

    return {
      ...learner,
      mentor: mentorName,
      mentorName,
      mentorUid: clean(explicitLink?.mentorUid || profileMentorUid || mentorUid),
      mentorEmail,
      mentorAssignmentStatus: "active",
      mentorPersisted: persisted,
      mentorSource: explicitLink ? "mentor_link" : profileAssigned ? "learner_profile" : "default_policy",
    };
  });

  const projectedMentors = (Array.isArray(mentors) ? mentors : []).map((mentor) => {
    if (normalizeAspireNestEmail(mentor.email) !== mentorEmail) return mentor;
    const assignedLearners = projectedLearners.filter((learner) => learner.mentorEmail === mentorEmail);
    return {
      ...mentor,
      name: clean(mentor.name || mentor.displayName) || mentorName,
      email: mentorEmail,
      learners: assignedLearners.length,
      learnerIds: assignedLearners.map((learner) => learner.id),
    };
  });

  return {
    learners: projectedLearners,
    mentors: projectedMentors,
    defaultMentor: defaultMentor
      ? { uid: mentorUid, id: mentorUid || mentorEmail, name: mentorName, email: mentorEmail }
      : { uid: "", id: mentorEmail, name: mentorName, email: mentorEmail },
    missingRelationshipLearners: projectedLearners.filter(
      (learner) => !learner.mentorPersisted && clean(learner.uid)
    ),
  };
};
