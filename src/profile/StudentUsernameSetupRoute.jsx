import React from "react";

import { claimUsernameForExistingUser } from "./usernameService";
import { normalizeUsername, validateUsername } from "./usernameModel";

import "../styles/profile/usernameSetup.css";

export default function StudentUsernameSetupRoute({
  user = null,
  currentUsername = "",
  onUsernameSaved = () => {},
  navigate,
}) {
  const [username, setUsername] = React.useState(currentUsername || "");
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const validation = React.useMemo(() => validateUsername(username), [username]);

  React.useEffect(() => {
    setUsername(currentUsername || "");
  }, [currentUsername]);

  const submit = async (event) => {
    event.preventDefault();
    if (saving || currentUsername) return;
    if (!validation.ok) {
      setMessage(validation.message);
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const result = await claimUsernameForExistingUser({
        firebaseUser: user,
        username: validation.normalizedUsername,
      });
      onUsernameSaved(result.username);
      setMessage(`Username @${result.username} is now linked to your UID.`);
    } catch (error) {
      setMessage(error?.message || "Username could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="usernameSetupPage">
      <section className="usernameSetupCard">
        <div className="usernameSetupIcon">@</div>
        <span>ASPIRENEST IDENTITY</span>
        <h1>{currentUsername ? "Your username" : "Choose your username"}</h1>
        <p>Your username is used for your profile, assignments and learning activity. Account ownership and security always remain linked to your Firebase UID.</p>

        <form onSubmit={submit}>
          <label>
            <span>Unique username</span>
            <div className="usernameSetupInput"><b>@</b><input autoFocus={!currentUsername} disabled={Boolean(currentUsername)} value={username} minLength="3" maxLength="24" onChange={(event) => setUsername(normalizeUsername(event.target.value))} placeholder="rakesh_rana" /></div>
          </label>
          <div className={`usernameSetupValidation ${currentUsername || validation.ok ? "valid" : ""}`} role="status">
            <strong>{currentUsername ? "Username linked" : validation.ok ? "Format ready" : "Check username"}</strong>
            <small>{currentUsername ? `@${currentUsername}` : validation.message}</small>
          </div>
          {message ? <div className="usernameSetupMessage" role="status">{message}</div> : null}
          <div className="usernameSetupRules"><span>3–24 characters</span><span>Start with a letter</span><span>Lowercase letters, numbers, underscore</span><span>Reserved names blocked</span></div>
          <div className="usernameSetupActions">
            <button type="button" className="secondary" onClick={() => navigate("/my-profile")}>Profile settings</button>
            {currentUsername ? <button type="button" className="primary" onClick={() => navigate("/")}>Continue learning</button> : <button type="submit" className="primary" disabled={saving || !validation.ok}>{saving ? "Saving…" : "Save username"}</button>}
          </div>
        </form>
      </section>
    </main>
  );
}
