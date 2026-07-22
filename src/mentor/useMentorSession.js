import { useCallback, useEffect, useState } from "react";
import { loadMentorProfile } from "./mentorService";

export default function useMentorSession({
  user = null,
  isAdminUser = false,
} = {}) {
  const [loading, setLoading] = useState(Boolean(user));
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!user?.uid) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (isAdminUser) {
      setProfile({
        mentorUid: user.uid,
        role: "admin",
        status: "active",
        displayName: user.displayName || "Administrator",
      });
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextProfile = await loadMentorProfile(user.uid);
      setProfile(nextProfile);
    } catch (nextError) {
      setProfile(null);
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }, [isAdminUser, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isMentor = Boolean(
    isAdminUser ||
      (profile?.role === "mentor" && profile?.status === "active")
  );

  return {
    loading,
    error,
    profile,
    isMentor,
    refresh,
  };
}
