import { useCallback, useEffect, useState } from "react";
import { loadMentorProfile } from "./mentorService";
import { getAspireNestDisplayName, isAspireNestMentor } from "../auth/aspireNestIdentity";

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

    if (isAdminUser || isAspireNestMentor(user)) {
      setProfile({
        mentorUid: user.uid,
        role: isAdminUser ? "admin" : "mentor",
        status: "active",
        email: user.email || "",
        displayName: getAspireNestDisplayName(user),
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
      isAspireNestMentor(user) ||
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
