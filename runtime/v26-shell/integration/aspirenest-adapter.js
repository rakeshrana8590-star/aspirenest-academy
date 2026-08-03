(() => {
  'use strict';

  /**
   * Production-only AspireNest adapter selector.
   *
   * - Never loads or references the deterministic demo adapter.
   * - Uses window.__aspirenestExactResourceAdapter when a real bridge exists.
   * - Fails closed for every unavailable operation.
   * - Keeps openCanonical as a local route-only action.
   */
  const external =
    window.__aspirenestExactResourceAdapter &&
    typeof window.__aspirenestExactResourceAdapter === 'object'
      ? window.__aspirenestExactResourceAdapter
      : Object.create(null);

  const required = [
  "getSession",
  "login",
  "logout",
  "authorize",
  "recordProgress",
  "recordAttempt",
  "recordStudyAction",
  "requestMentorHelp",
  "openCanonical"
];
  const methodNames = [
  "getSession",
  "login",
  "registerAccount",
  "signInWithGoogle",
  "requestPasswordReset",
  "resendVerification",
  "completeEmailVerification",
  "checkUsernameAvailability",
  "logout",
  "authorize",
  "recordProgress",
  "recordAttempt",
  "recordStudyAction",
  "requestMentorHelp",
  "loadMockTest",
  "listExperienceEvents",
  "saveExperienceEntity",
  "archiveExperienceEntity",
  "saveAdminResource",
  "publishAdminResource",
  "unpublishAdminResource",
  "archiveAdminResource",
  "saveAccessGrant",
  "extendAccessGrant",
  "revokeAccessGrant",
  "restoreAccessGrant",
  "previewBulkAccess",
  "applyBulkAccess",
  "rollbackBulkAccessBatch",
  "saveAccessBundle",
  "regenerateAccessKey",
  "regenerateAccessInvite",
  "redeemAccessKey",
  "redeemAccessInvite",
  "saveAccessProduct",
  "saveAccessKey",
  "saveAccessInvite",
  "loadRoleAnalytics",
  "loadSubjectWorkspace",
  "loadProtectedVideo",
  "saveVideoProgress",
  "saveVideoStudyAction",
  "loadMentorWorkspace",
  "createMentorAssignment",
  "answerMentorQuestion",
  "scheduleMentorSession",
  "createMentorAccessRequest",
  "loadAdminWorkspace",
  "saveAdminOperation",
  "saveAdminSettings",
  "loadStudentWorkspace",
  "loadStudentProfile",
  "saveStudentProfile",
  "saveStudentPreferences",
  "loadCurrentAffairsReader",
  "loadMentorProfessionalProfile",
  "saveMentorProfessionalProfile",
  "saveMentorProfessionalEntry",
  "deleteMentorProfessionalEntry",
  "saveMentorProfileVisibility",
  "publishMentorProfessionalProfile",
  "uploadMentorProfilePhoto",
  "removeMentorProfilePhoto",
  "loadPublicMentorDirectory",
  "createStudentAccessRequest",
  "listAccessRequests",
  "approveAccessRequest",
  "updateAccessRequest",
  "createNotificationJob",
  "saveCommerceSettings",
  "saveEmailSettings",
  "createCommerceOrder",
  "createRazorpayQr",
  "createPaymentLink",
  "reconcilePayment",
  "validateAdminResource",
  "saveAdminResourceAsset",
  "createAdminResourceVersion",
  "updateLearnerLifecycle",
  "verifyMentorProfile",
  "exportAdminReport",
  "runAdminReadiness",
  "loadStudentCommandCenter",
  "loadStudentTasks",
  "updateStudentTask",
  "loadStudentAssignments",
  "submitStudentAssignment",
  "loadStudentCourses",
  "loadStudentRevisionHub",
  "loadStudentNotifications",
  "saveStudentNotificationPreferences",
  "loadStudentResults",
  "loadStudentAccountSecurity",
  "requestStudentDataExport",
  "loadMentorCommandCenter",
  "loadMentorToday",
  "loadMentorNotifications",
  "saveMentorNotificationPreferences",
  "loadMentorLearner360",
  "saveMentorIntervention",
  "saveMentorCommunication",
  "saveMentorGroup",
  "saveMentorAssignmentDraft",
  "publishMentorAssignment",
  "reviewMentorAssignment",
  "saveMentorCollection",
  "loadMentorCalendar",
  "saveMentorPreferences",
  "loadMentorAccountSecurity",
  "requestMentorAccountReview",
  "loadMentorOutcomes",
  "createPublicSupportRequest",
  "createPublicAccessEnquiry",
  "loadMockAdminWorkspace",
  "saveMockTest",
  "validateMockTest",
  "importMockQuestions",
  "saveQuestionBankQuestion",
  "publishMockTest",
  "duplicateMockTest",
  "archiveMockTest",
  "exportMockTest",
  "loadMockResults",
  "updateMockResultPolicy",
  "saveMockAttemptDraft",
  "loadMockAttemptDraft",
  "pauseMockAttempt",
  "resumeMockAttempt",
  "loadNotesAdminWorkspace",
  "saveNote",
  "validateNote",
  "importNoteContent",
  "uploadNoteAsset",
  "publishNote",
  "unpublishNote",
  "archiveNote",
  "restoreNote",
  "saveNoteProgress",
  "saveVideo",
  "publishVideo",
  "validateVideo",
  "downloadVideoAttachment",
  "saveLive",
  "publishLive",
  "validateLive",
  "saveLiveReminder",
  "saveCurrentAffairs",
  "publishCurrentAffairs",
  "validateCurrentAffairs",
  "saveRoadmap",
  "publishRoadmap",
  "validateRoadmap",
  "recordRoadmapProgress",
  "loadVideoAdminWorkspace",
  "uploadVideoAsset",
  "processVideoAsset",
  "saveVideoCaptions",
  "resolveProtectedVideo",
  "loadVideoAnalytics",
  "createLiveProviderSession",
  "updateLiveProviderSession",
  "resolveLiveJoin",
  "recordLiveAttendance",
  "createLiveReplayDraft",
  "cancelLiveSession",
  "saveCurrentAffairsPages",
  "publishCurrentAffairsCorrection",
  "loadCurrentAffairsSourceRegister",
  "assignRoadmap",
  "rescheduleRoadmap",
  "loadRoadmapProgress",
  "loadNotificationCenter",
  "saveNotificationPreferences",
  "createNotification",
  "scheduleNotification",
  "publishNotification",
  "archiveNotification",
  "saveNotificationRule",
  "saveNotificationTemplate",
  "listNotificationDelivery",
  "exportNotificationAudit",
  "openCanonical"
];
  const missing = required.filter(
    (name) => typeof external[name] !== 'function'
  );

  const unavailable = (name) => {
    if (name === 'getSession') {
      return Promise.resolve({
        authenticated: false,
        user: null,
        roles: [],
        activeRole: null,
        code: 'PRODUCTION_ADAPTER_UNAVAILABLE'
      });
    }

    if (name === 'authorize') {
      return Promise.resolve({
        allowed: false,
        code: 'PRODUCTION_ADAPTER_UNAVAILABLE'
      });
    }

    return Promise.resolve({
      ok: false,
      code: 'PRODUCTION_ADAPTER_UNAVAILABLE',
      method: name
    });
  };

  const adapter = {
    mode: missing.length ? 'production-unavailable' : 'production',
    missingProductionMethods: missing
  };

  for (const name of methodNames) {
    adapter[name] = (...args) => {
      const handler = external[name];

      if (typeof handler === 'function') {
        try {
          return Promise.resolve(handler.apply(external, args));
        } catch (error) {
          return Promise.reject(error);
        }
      }

      if (name === 'openCanonical') {
        const request = args[0] || {};
        const route = typeof request.route === 'string' ? request.route : '';

        if (!route) {
          return unavailable(name);
        }

        window.location.hash = route.startsWith('#') ? route : '#' + route;

        return Promise.resolve({
          ok: true,
          route,
          mode: 'route-only'
        });
      }

      return unavailable(name);
    };
  }

  window.AspireNestExactAdapter = Object.freeze(adapter);

  window.dispatchEvent(
    new CustomEvent('aspirenest:exact-adapter-ready', {
      detail: {
        mode: window.AspireNestExactAdapter.mode,
        missing
      }
    })
  );
})();
