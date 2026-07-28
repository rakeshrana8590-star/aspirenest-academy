import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  fetchSignInMethodsForEmail,
  getAdditionalUserInfo,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

import { auth, db } from "../firebase";
import {
  canUseAspireNestExperience,
  getAspireNestAllowedExperiences,
  getAspireNestDisplayName,
  getAspireNestLandingRoute,
  isAspireNestStaffEmail,
  resolveAspireNestPostLoginRoute,
  resolveAspireNestRole,
} from "../auth/aspireNestIdentity";
import { upsertLearnerLoginSnapshot } from "../profile/learnerProfileService";
import { createVerifiedStudentAccountRecords } from "../profile/usernameService";
import {
  loadAspireNestAccountProfile,
  syncVerifiedStudentAccountStatus,
} from "../utils/authAccountService";
import {
  V8_EXPERIENCE_ROUTES,
  activateV8Experience,
  isV8StudentReaderPath,
  resolveV8ExperienceFromPath,
} from "./v8RoleRuntime";
import { subscribeV8RealLearnerDirectory } from "./v8LearnerDirectory";
import { subscribeV8AdminLiveData } from "./v8AdminLiveData";
import { installV8AdminLiveActions } from "./v8AdminLiveActions";
import {
  subscribeV8MentorLiveData,
  subscribeV8PublicLiveData,
  subscribeV8StudentLiveData,
} from "./v8PlatformLiveData";
import { installV8PlatformLiveActions } from "./v8PlatformLiveActions";

const ROUTES = V8_EXPERIENCE_ROUTES;
const GOOGLE_SETUP_KEY = "aspirenest_google_setup_uid";
let accountSetupInProgress = false;
let pendingGoogleUser = null;
let stopLearnerDirectory = null;
let latestLearnerDirectory = { ready: false, loading: false, learners: [], error: "" };
let latestAdminLiveData = {
  ready: false,
  loading: false,
  learners: [],
  resources: [],
  grants: [],
  payments: [],
  mentors: [],
  audit: [],
  pendingClaims: [],
  products: [],
  defaultMentor: null,
  missingRelationshipLearners: [],
  sourceErrors: {},
  sourceStatus: {},
  sourceCounts: {},
};

installV8AdminLiveActions({ auth, db });
installV8PlatformLiveActions({ auth, db });


let stopPublicLiveData = null;
let stopStudentLiveData = null;
let stopMentorLiveData = null;
let latestPublicLiveData = { ready: false, loading: false, resources: [], subjects: [], sourceErrors: {}, sourceStatus: {}, sourceCounts: {} };
let latestStudentLiveData = { ready: false, loading: false, resources: [], subjects: [], grants: [], assignments: [], questions: [], liveSessions: [], results: [], sourceErrors: {}, sourceStatus: {}, sourceCounts: {} };
let latestMentorLiveData = { ready: false, loading: false, learners: [], resources: [], assignments: [], questions: [], accessRequests: [], liveSessions: [], sourceErrors: {}, sourceStatus: {}, sourceCounts: {} };

const publishPublicLiveData = (nextState = {}) => {
  latestPublicLiveData = { ...latestPublicLiveData, ...nextState };
  window.__aspirenestPublicLiveData = latestPublicLiveData;
  window.dispatchEvent(new CustomEvent("aspirenest:public-live-data", { detail: latestPublicLiveData }));
};
const publishStudentLiveData = (nextState = {}) => {
  latestStudentLiveData = { ...latestStudentLiveData, ...nextState };
  window.__aspirenestStudentLiveData = latestStudentLiveData;
  window.dispatchEvent(new CustomEvent("aspirenest:student-live-data", { detail: latestStudentLiveData }));
};
const publishMentorLiveData = (nextState = {}) => {
  latestMentorLiveData = { ...latestMentorLiveData, ...nextState };
  window.__aspirenestMentorLiveData = latestMentorLiveData;
  window.dispatchEvent(new CustomEvent("aspirenest:mentor-live-data", { detail: latestMentorLiveData }));
};

const stopPlatformLiveData = () => {
  [stopStudentLiveData, stopMentorLiveData].forEach((stop) => { if (typeof stop === "function") { try { stop(); } catch (_) {} } });
  stopStudentLiveData = null;
  stopMentorLiveData = null;
};

const startPublicLiveData = () => {
  if (stopPublicLiveData) return;
  stopPublicLiveData = subscribeV8PublicLiveData({
    db,
    onLoading: () => publishPublicLiveData({ ready: false, loading: true }),
    onChange: (state) => publishPublicLiveData(state),
  });
};

const syncPlatformLiveData = (user) => {
  stopPlatformLiveData();
  publishStudentLiveData({ ready: false, loading: false, resources: [], subjects: [], grants: [], assignments: [], questions: [], liveSessions: [], results: [], sourceErrors: {}, sourceStatus: {}, sourceCounts: {} });
  publishMentorLiveData({ ready: false, loading: false, learners: [], resources: [], assignments: [], questions: [], accessRequests: [], liveSessions: [], sourceErrors: {}, sourceStatus: {}, sourceCounts: {} });
  if (!user) return;
  const role = resolveAspireNestRole(user);
  if (["student", "mentor", "admin"].includes(role)) {
    stopStudentLiveData = subscribeV8StudentLiveData({
      db,
      user,
      onLoading: () => publishStudentLiveData({ ready: false, loading: true }),
      onChange: (state) => publishStudentLiveData(state),
    });
  }
  if (["mentor", "admin"].includes(role)) {
    stopMentorLiveData = subscribeV8MentorLiveData({
      db,
      user,
      onLoading: () => publishMentorLiveData({ ready: false, loading: true }),
      onChange: (state) => publishMentorLiveData(state),
    });
  }
};

startPublicLiveData();

const publishLearnerDirectory = (nextState = {}) => {
  latestLearnerDirectory = { ...latestLearnerDirectory, ...nextState };
  window.__aspirenestRealLearnerDirectory = latestLearnerDirectory;
  window.dispatchEvent(
    new CustomEvent("aspirenest:real-learner-directory", { detail: latestLearnerDirectory })
  );
};

const publishAdminLiveData = (nextState = {}) => {
  latestAdminLiveData = { ...latestAdminLiveData, ...nextState };
  window.__aspirenestRealAdminData = latestAdminLiveData;
  window.dispatchEvent(
    new CustomEvent("aspirenest:real-admin-data", { detail: latestAdminLiveData })
  );
  publishLearnerDirectory({
    ready: latestAdminLiveData.ready,
    loading: latestAdminLiveData.loading,
    learners: latestAdminLiveData.learners || [],
    error: latestAdminLiveData.error || "",
  });
};

const stopRealLearnerDirectory = () => {
  if (typeof stopLearnerDirectory === "function") {
    try { stopLearnerDirectory(); } catch (_) {}
  }
  stopLearnerDirectory = null;
};

const syncRealAdminData = (user) => {
  stopRealLearnerDirectory();
  if (!user || resolveAspireNestRole(user) !== "admin") {
    publishAdminLiveData({
      ready: false, loading: false, learners: [], resources: [], grants: [], payments: [],
      mentors: [], audit: [], pendingClaims: [], products: [], defaultMentor: null, missingRelationshipLearners: [], sourceErrors: {}, sourceStatus: {}, sourceCounts: {}, error: "",
    });
    return;
  }

  stopLearnerDirectory = subscribeV8AdminLiveData({
    db,
    onLoading: () => publishAdminLiveData({ ready: false, loading: true, error: "" }),
    onChange: (liveData) => publishAdminLiveData({
      ...liveData,
      ready: true,
      loading: false,
      error: Object.keys(liveData.sourceErrors || {}).length
        ? "Some Admin data sources could not be read. Available live sources are still shown."
        : "",
    }),
    onError: (error, collectionName) => {
      console.warn(`Admin live-data read skipped for ${collectionName}:`, error?.message || error);
    },
  });
};

// Backward-compatible name retained for G13 learner-directory wiring tests.
// subscribeV8RealLearnerDirectory remains the isolated learner-only adapter; G14 uses the full Admin subscription.
const syncRealLearnerDirectory = (user) => syncRealAdminData(user);

window.addEventListener("aspirenest:student-runtime-ready", () => {
  if (window.__aspirenestStudentLiveData) publishStudentLiveData(window.__aspirenestStudentLiveData);
});
window.addEventListener("aspirenest:experience-runtime-ready", () => {
  if (window.__aspirenestPublicLiveData) publishPublicLiveData(window.__aspirenestPublicLiveData);
  if (window.__aspirenestMentorLiveData) publishMentorLiveData(window.__aspirenestMentorLiveData);
});

window.addEventListener("aspirenest:admin-runtime-ready", () => {
  if (window.__aspirenestRealAdminData) publishAdminLiveData(window.__aspirenestRealAdminData);
  else if (window.__aspirenestRealLearnerDirectory) publishLearnerDirectory(window.__aspirenestRealLearnerDirectory);
});

const createGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
};

const normalizePath = (value = window.location.pathname) => {
  const path = String(value || "/").replace(/\/+$/, "");
  return path || "/";
};
const requestedReturnTo = () => new URLSearchParams(window.location.search).get("returnTo") || "";
const isGoogleSetupRoute = () => normalizePath() === "/create-account" && new URLSearchParams(window.location.search).get("provider") === "google";
const navigate = (url, replace = false) => replace ? window.location.replace(url) : window.location.assign(url);
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

const setSession = (user, profile = {}) => {
  const role = user ? resolveAspireNestRole(user) : "public";
  const allowed = user ? [...getAspireNestAllowedExperiences(user)] : ["public"];
  const profileName = String(
    profile?.fullName || profile?.name || profile?.displayName || ""
  ).trim();
  const displayName = user
    ? role === "student"
      ? profileName || getAspireNestDisplayName(user)
      : getAspireNestDisplayName(user)
    : "";
  const planType = String(
    profile?.planType || profile?.subscriptionType || profile?.currentPlan || ""
  ).trim().toUpperCase();

  window.__aspirenestAuthSession = {
    ready: true,
    user,
    uid: user?.uid || "",
    role,
    allowed,
    email: user?.email || profile?.email || "",
    displayName,
    username: String(profile?.username || "").trim(),
    planType,
    emailVerified: user?.emailVerified === true,
    profile: profile && typeof profile === "object" ? profile : {},
  };
  document.documentElement.dataset.aspirenestRole = role;
  window.dispatchEvent(new CustomEvent("aspirenest:session-ready", { detail: window.__aspirenestAuthSession }));
};

const initials = (user) => {
  const source = getAspireNestDisplayName(user) || user?.email || "AN";
  const parts = String(source).replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?)\s+/i, "").trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)[0]}` : source.slice(0, 2)).toUpperCase();
};

const syncIdentityChrome = (user, experience) => {
  const session = window.__aspirenestAuthSession || {};
  const avatar = document.getElementById("accountButton");
  if (avatar) {
    avatar.textContent = user ? initials({ ...user, displayName: session.displayName }) : "AN";
    avatar.setAttribute(
      "aria-label",
      user ? `Open ${session.displayName || getAspireNestDisplayName(user)} account menu` : "Open account menu"
    );
  }
  document.body.dataset.authenticated = user ? "true" : "false";
  document.body.dataset.experience = experience;
};

const applyCurrentRoute = async (user) => {
  const path = normalizePath();
  const experience = resolveV8ExperienceFromPath(path);

  if (experience !== "public") {
    if (!user) {
      const returnTarget =
        experience === "student" && isV8StudentReaderPath(path)
          ? `${path}${window.location.search || ""}`
          : ROUTES[experience];
      navigate(
        `/login?returnTo=${encodeURIComponent(returnTarget)}`,
        true
      );
      return;
    }
    if (!canUseAspireNestExperience(user, experience)) {
      navigate(getAspireNestLandingRoute(user), true);
      return;
    }
  }

  await activateV8Experience(experience, window);
  syncIdentityChrome(user, experience);
  document.documentElement.classList.remove("aspirenest-auth-pending");
  document.documentElement.classList.add("aspirenest-auth-ready");
};

const authStory = () => `
  <section class="aspirenest-auth-story">
    <span class="aspirenest-auth-brand"><strong>AspireNest</strong><small>Academy</small></span>
    <h1>Secure access to your Learning Drive.</h1>
    <p>One verified account connects learning resources, exact access, progress, mock tests and mentor guidance.</p>
    <div class="aspirenest-auth-points">
      <div class="aspirenest-auth-point">▤ Notes & IntelliText</div>
      <div class="aspirenest-auth-point">◇ Mock Test Practice</div>
      <div class="aspirenest-auth-point">▶ Video & Live Classes</div>
      <div class="aspirenest-auth-point">⇢ AspirePath Roadmaps</div>
    </div>
  </section>`;

const statusNode = () => document.getElementById("aspirenestAuthStatus");
const setStatus = (message = "", type = "") => {
  const node = statusNode();
  if (!node) return;
  node.className = `aspirenest-auth-status ${type}`.trim();
  node.textContent = message;
};
const setBusy = (form, busy, label = "Please wait") => {
  form.querySelectorAll("button,input,select").forEach((node) => { node.disabled = busy; });
  const submit = form.querySelector('[type="submit"]');
  if (!submit) return;
  if (!submit.dataset.label) submit.dataset.label = submit.textContent;
  submit.innerHTML = busy ? `<span class="aspirenest-auth-spinner"></span>${escapeHtml(label)}` : escapeHtml(submit.dataset.label);
};
const firebaseMessage = (error) => {
  const code = String(error?.code || "");
  const map = {
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/user-not-found": "No account was found for this email.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/email-already-in-use": "An account already exists for this email.",
    "auth/weak-password": "Use a stronger password with at least 6 characters.",
    "auth/popup-closed-by-user": "Google sign-in was closed before completion.",
    "auth/cancelled-popup-request": "Another Google sign-in request is already open.",
    "auth/account-exists-with-different-credential": "This email already uses another sign-in method. Use the original method for this account.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "USERNAME_ALREADY_EXISTS": "This username is already in use.",
  };
  return map[code] || error?.message || "The request could not be completed.";
};

const passwordLoginMessage = async (error, email) => {
  if (!["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password"].includes(String(error?.code || ""))) return firebaseMessage(error);
  try {
    const methods = await fetchSignInMethodsForEmail(auth, String(email || "").trim().toLowerCase());
    if (methods.includes("google.com") && !methods.includes("password")) {
      return "This account uses Google sign-in. Choose Continue with Google.";
    }
  } catch (_) {}
  return firebaseMessage(error);
};

function removeOverlay() { document.getElementById("aspirenestAuthOverlay")?.remove(); }

const cancelPendingGoogleSetup = async () => {
  const user = pendingGoogleUser || auth.currentUser;
  const pendingUid = sessionStorage.getItem(GOOGLE_SETUP_KEY);
  if (user && pendingUid && pendingUid === user.uid) {
    try { await deleteUser(user); } catch (_) { try { await signOut(auth); } catch (_) {} }
  } else {
    try { await signOut(auth); } catch (_) {}
  }
  sessionStorage.removeItem(GOOGLE_SETUP_KEY);
  pendingGoogleUser = null;
  accountSetupInProgress = false;
  navigate("/", true);
};

function renderLogin() {
  removeOverlay();
  document.body.insertAdjacentHTML("beforeend", `
    <div class="aspirenest-auth-overlay" id="aspirenestAuthOverlay" role="dialog" aria-modal="true" aria-labelledby="aspirenestAuthTitle">
      <div class="aspirenest-auth-dialog">
        ${authStory()}
        <section class="aspirenest-auth-formpane">
          <div class="aspirenest-auth-head"><div><h2 id="aspirenestAuthTitle">Welcome Back</h2><p>Sign in to continue your AspireNest journey.</p></div><button class="aspirenest-auth-close" type="button" data-auth-close aria-label="Back to Public Website">×</button></div>
          <form class="aspirenest-auth-form" id="aspirenestLoginForm">
            <div class="aspirenest-auth-field"><label for="aspirenestEmail">Email address</label><input id="aspirenestEmail" name="email" type="email" autocomplete="email" required placeholder="Enter registered email"></div>
            <div class="aspirenest-auth-field"><label for="aspirenestPassword">Password</label><input id="aspirenestPassword" name="password" type="password" autocomplete="current-password" required placeholder="Enter password"></div>
            <div class="aspirenest-auth-row"><button class="aspirenest-auth-link" type="button" data-auth-show>Show password</button><button class="aspirenest-auth-link" type="button" data-auth-forgot>Forgot Password?</button></div>
            <div class="aspirenest-auth-actions"><button class="aspirenest-auth-primary" type="submit">Login</button><button class="aspirenest-auth-secondary" type="button" data-auth-google>Continue with Google</button></div>
          </form>
          <div id="aspirenestAuthStatus" class="aspirenest-auth-status" aria-live="polite"></div>
          <div class="aspirenest-auth-foot">New student? <button type="button" data-auth-create>Create Account</button></div>
        </section>
      </div>
    </div>`);

  const form = document.getElementById("aspirenestLoginForm");
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); setStatus(); setBusy(form, true, "Signing in");
    try {
      const credential = await signInWithEmailAndPassword(auth, form.email.value.trim(), form.password.value);
      const target = resolveAspireNestPostLoginRoute(credential.user, requestedReturnTo());
      navigate(target || getAspireNestLandingRoute(credential.user), true);
    } catch (error) {
      setStatus(await passwordLoginMessage(error, form.email.value), "error");
      setBusy(form, false);
    }
  });
  document.querySelector("[data-auth-google]").addEventListener("click", async () => {
    setStatus(); setBusy(form, true, "Connecting"); accountSetupInProgress = true;
    try {
      const credential = await signInWithPopup(auth, createGoogleProvider());
      const info = getAdditionalUserInfo(credential);
      const role = resolveAspireNestRole(credential.user);
      if (info?.isNewUser && role === "student") {
        pendingGoogleUser = credential.user;
        sessionStorage.setItem(GOOGLE_SETUP_KEY, credential.user.uid);
        const params = new URLSearchParams(window.location.search);
        params.set("provider", "google");
        history.replaceState(null, "", `/create-account?${params.toString()}`);
        renderGoogleAccountCompletion(credential.user);
        return;
      }
      accountSetupInProgress = false;
      const target = resolveAspireNestPostLoginRoute(credential.user, requestedReturnTo());
      navigate(target || getAspireNestLandingRoute(credential.user), true);
    } catch (error) {
      accountSetupInProgress = false;
      if (error?.code !== "auth/cancelled-popup-request") setStatus(firebaseMessage(error), "error");
      setBusy(form, false);
    }
  });
  document.querySelector("[data-auth-forgot]").addEventListener("click", async () => {
    const email = form.email.value.trim();
    if (!email) return setStatus("Enter your registered email first.", "error");
    try { await sendPasswordResetEmail(auth, email); setStatus("Password reset email sent.", "success"); }
    catch (error) { setStatus(firebaseMessage(error), "error"); }
  });
  document.querySelector("[data-auth-show]").addEventListener("click", (event) => {
    const field = form.password; const show = field.type === "password"; field.type = show ? "text" : "password"; event.currentTarget.textContent = show ? "Hide password" : "Show password";
  });
  document.querySelector("[data-auth-create]").addEventListener("click", () => navigate(`/create-account${window.location.search}`));
  document.querySelector("[data-auth-close]").addEventListener("click", () => navigate("/"));
}

const profileFields = () => `
  <div class="aspirenest-auth-grid">
    <div class="aspirenest-auth-field"><label>Student full name</label><input name="fullName" required autocomplete="name" placeholder="Enter full name"></div>
    <div class="aspirenest-auth-field"><label>Username</label><input name="username" required minlength="3" maxlength="24" autocomplete="username" placeholder="Choose username"></div>
    <div class="aspirenest-auth-field"><label>Mobile / WhatsApp</label><input name="mobile" inputmode="tel" autocomplete="tel" placeholder="Optional mobile number"></div>
    <div class="aspirenest-auth-field"><label>Target exam</label><select name="targetExam"><option>CTET Paper I + II</option><option>CTET Paper I</option><option>CTET Paper II</option><option>State TET</option></select></div>
    <div class="aspirenest-auth-field"><label>Preparation level</label><select name="preparationLevel"><option>Beginner</option><option>Studying regularly</option><option>Revision stage</option><option>Mock test ready</option></select></div>
    <div class="aspirenest-auth-field"><label>Preferred medium</label><select name="preferredMedium"><option>Bilingual</option><option>English</option><option>Hindi</option><option>Gujarati</option></select></div>
  </div>`;

const studentProfile = (values, { google = false } = {}) => ({
  fullName: String(values.fullName).trim(),
  name: String(values.fullName).trim(),
  username: String(values.username).trim(),
  mobileNumber: String(values.mobile || "").trim(),
  mobile: String(values.mobile || "").trim(),
  whatsappNumber: String(values.mobile || "").trim(),
  targetExam: values.targetExam,
  examTrack: "CTET/TET",
  currentProgram: "CTET/TET",
  preparationLevel: values.preparationLevel,
  preferredMedium: values.preferredMedium,
  role: "student",
  isPremium: false,
  planType: "FREE",
  subscriptionType: "FREE",
  paymentStatus: "FREE",
  premiumStatus: "FREE",
  purchasedCourses: [],
  emailVerified: google,
  authProvider: google ? "google.com" : "password",
  accountStatus: google ? "active" : "pendingEmailVerification",
  profileStatus: google ? "verified" : "basicProfileCreated",
  profileCompletion: 60,
  onboardingStatus: google ? "basicProfileComplete" : "basicProfilePending",
});

function renderCreateAccount() {
  removeOverlay();
  document.body.insertAdjacentHTML("beforeend", `
    <div class="aspirenest-auth-overlay" id="aspirenestAuthOverlay" role="dialog" aria-modal="true" aria-labelledby="aspirenestAuthTitle">
      <div class="aspirenest-auth-dialog">
        ${authStory()}
        <section class="aspirenest-auth-formpane">
          <div class="aspirenest-auth-head"><div><h2 id="aspirenestAuthTitle">Create Student Account</h2><p>Set up one verified AspireNest learning identity.</p></div><button class="aspirenest-auth-close" type="button" data-auth-close aria-label="Back to Public Website">×</button></div>
          <form class="aspirenest-auth-form" id="aspirenestCreateForm">
            ${profileFields()}
            <div class="aspirenest-auth-grid">
              <div class="aspirenest-auth-field"><label>Email address</label><input name="email" type="email" required autocomplete="email" placeholder="Enter registered email"></div>
              <div class="aspirenest-auth-field"><label>Password</label><input name="password" type="password" required minlength="6" autocomplete="new-password" placeholder="Enter password"></div>
              <div class="aspirenest-auth-field full"><label>Confirm password</label><input name="confirmPassword" type="password" required minlength="6" autocomplete="new-password" placeholder="Confirm password"></div>
            </div>
            <div class="aspirenest-auth-actions"><button class="aspirenest-auth-primary" type="submit">Create Account & Send Verification</button><button class="aspirenest-auth-secondary" type="button" data-auth-login>Back to Login</button></div>
          </form>
          <div id="aspirenestAuthStatus" class="aspirenest-auth-status" aria-live="polite"></div>
        </section>
      </div>
    </div>`);

  const form = document.getElementById("aspirenestCreateForm");
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); setStatus();
    const values = Object.fromEntries(new FormData(form).entries());
    if (values.password !== values.confirmPassword) return setStatus("Passwords do not match.", "error");
    if (isAspireNestStaffEmail(values.email)) return setStatus("Admin and Mentor accounts cannot be self-registered.", "error");
    setBusy(form, true, "Creating account");
    let createdUser = null;
    accountSetupInProgress = true;
    try {
      const credential = await createUserWithEmailAndPassword(auth, String(values.email).trim(), String(values.password));
      createdUser = credential.user;
      await updateProfile(createdUser, { displayName: String(values.fullName).trim() });
      await createVerifiedStudentAccountRecords({ firebaseUser: createdUser, profile: studentProfile(values) });
      await sendEmailVerification(createdUser);
      await signOut(auth);
      accountSetupInProgress = false;
      form.reset();
      setStatus("Account created. Verification email sent. Verify your email, then log in.", "success");
      setBusy(form, false);
    } catch (error) {
      if (createdUser) { try { await deleteUser(createdUser); } catch (_) {} }
      try { await signOut(auth); } catch (_) {}
      accountSetupInProgress = false;
      setStatus(firebaseMessage(error), "error"); setBusy(form, false);
    }
  });
  document.querySelector("[data-auth-login]").addEventListener("click", () => navigate(`/login${window.location.search}`));
  document.querySelector("[data-auth-close]").addEventListener("click", () => navigate("/"));
}

function renderGoogleAccountCompletion(user) {
  removeOverlay();
  const displayName = getAspireNestDisplayName(user);
  document.body.insertAdjacentHTML("beforeend", `
    <div class="aspirenest-auth-overlay" id="aspirenestAuthOverlay" role="dialog" aria-modal="true" aria-labelledby="aspirenestAuthTitle">
      <div class="aspirenest-auth-dialog">
        ${authStory()}
        <section class="aspirenest-auth-formpane">
          <div class="aspirenest-auth-head"><div><h2 id="aspirenestAuthTitle">Complete Student Account</h2><p>Google verified ${escapeHtml(user.email || "your email")}. Complete the learning profile once.</p></div><button class="aspirenest-auth-close" type="button" data-auth-google-cancel aria-label="Cancel account setup">×</button></div>
          <form class="aspirenest-auth-form" id="aspirenestGoogleCreateForm">
            ${profileFields()}
            <div class="aspirenest-auth-field"><label>Verified Google email</label><input name="email" type="email" readonly value="${escapeHtml(user.email || "")}"></div>
            <div class="aspirenest-auth-actions"><button class="aspirenest-auth-primary" type="submit">Complete Student Account</button><button class="aspirenest-auth-secondary" type="button" data-auth-google-cancel>Cancel</button></div>
          </form>
          <div id="aspirenestAuthStatus" class="aspirenest-auth-status" aria-live="polite"></div>
        </section>
      </div>
    </div>`);

  const form = document.getElementById("aspirenestGoogleCreateForm");
  form.fullName.value = displayName;
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); setStatus(); setBusy(form, true, "Saving account");
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      await updateProfile(user, { displayName: String(values.fullName).trim() });
      await createVerifiedStudentAccountRecords({ firebaseUser: user, profile: studentProfile(values, { google: true }) });
      sessionStorage.removeItem(GOOGLE_SETUP_KEY);
      pendingGoogleUser = null;
      accountSetupInProgress = false;
      navigate(resolveAspireNestPostLoginRoute(user, requestedReturnTo()) || "/student", true);
    } catch (error) {
      setStatus(firebaseMessage(error), "error"); setBusy(form, false);
    }
  });
  document.querySelectorAll("[data-auth-google-cancel]").forEach((button) => button.addEventListener("click", cancelPendingGoogleSetup));
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.getElementById("aspirenestAuthOverlay")) {
    event.preventDefault();
    if (isGoogleSetupRoute()) cancelPendingGoogleSetup(); else navigate("/", true);
  }
});

function showDenied(role) {
  const message = role === "admin" ? "Only the Admin account can use Admin Learning Drive." : role === "mentor" ? "Only Mentor or Admin accounts can use Mentor Workspace." : "This account cannot use the requested workspace.";
  if (typeof window.__aspirenestStudentAPI?.toast === "function") window.__aspirenestStudentAPI.toast(message, "!");
  else window.alert(message);
}

let signOutInProgress = false;

const clearAspireNestAuthSession = () => {
  stopRealLearnerDirectory();
  publishLearnerDirectory({ ready: false, loading: false, learners: [], error: "" });
  sessionStorage.removeItem(GOOGLE_SETUP_KEY);
  pendingGoogleUser = null;
  accountSetupInProgress = false;
  removeOverlay();
  window.__aspirenestAuthSession = {
    ready: true,
    user: null,
    uid: "",
    role: "public",
    allowed: ["public"],
    email: "",
    displayName: "",
    username: "",
    planType: "",
    emailVerified: false,
    profile: {},
  };
  document.documentElement.dataset.aspirenestRole = "public";
  document.body.dataset.authenticated = "false";
  window.dispatchEvent(
    new CustomEvent("aspirenest:session-cleared", {
      detail: window.__aspirenestAuthSession,
    })
  );
};

const performAspireNestSignOut = async () => {
  if (signOutInProgress) return;
  signOutInProgress = true;
  try {
    await signOut(auth);
  } finally {
    clearAspireNestAuthSession();
    signOutInProgress = false;
    navigate("/", true);
  }
};

window.addEventListener("aspirenest:signout", performAspireNestSignOut);
window.__aspirenestAuthAPI = Object.freeze({
  signOut: performAspireNestSignOut,
  getSession: () => window.__aspirenestAuthSession || null,
});
window.addEventListener("aspirenest:access-denied", (event) => showDenied(event.detail?.role));

const path = normalizePath();
if (path === "/login") renderLogin();
if (path === "/create-account" && !isGoogleSetupRoute()) renderCreateAccount();

onAuthStateChanged(auth, async (user) => {
  const profile = user
    ? await loadAspireNestAccountProfile(db, user).catch(() => ({}))
    : {};
  setSession(user, profile);
  syncRealLearnerDirectory(user);
  syncPlatformLiveData(user);

  if (isGoogleSetupRoute() && user && resolveAspireNestRole(user) === "student") {
    accountSetupInProgress = true;
    pendingGoogleUser = user;
    renderGoogleAccountCompletion(user);
    document.documentElement.classList.remove("aspirenest-auth-pending");
    document.documentElement.classList.add("aspirenest-auth-ready");
    return;
  }

  if (accountSetupInProgress) return;

  if (user && resolveAspireNestRole(user) === "student") {
    syncVerifiedStudentAccountStatus(db, user).catch((error) => {
      console.warn("Student account status sync skipped:", error?.message || error);
    });
    upsertLearnerLoginSnapshot({ user }).catch((error) => {
      console.warn("Learner login snapshot skipped:", error?.message || error);
    });
  }

  const currentPath = normalizePath();
  if ((currentPath === "/login" || currentPath === "/create-account") && user) {
    const target = resolveAspireNestPostLoginRoute(user, requestedReturnTo());
    navigate(target || getAspireNestLandingRoute(user), true);
    return;
  }

  try {
    await applyCurrentRoute(user);
  } catch (error) {
    console.error("AspireNest V8 role runtime failed:", error);
    document.documentElement.classList.remove("aspirenest-auth-pending");
    document.documentElement.classList.add("aspirenest-auth-ready");
    showDenied(resolveV8ExperienceFromPath(currentPath));
  }
});
