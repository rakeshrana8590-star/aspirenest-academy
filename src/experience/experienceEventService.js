import { collection, getDocs, limit, query } from "firebase/firestore";

import { db } from "../firebase";
import { EXPERIENCE_COLLECTIONS } from "./experienceConstants";
import {
  isPublicExperienceEvent,
  normalizeExperienceEvent,
  sortExperienceEvents,
} from "./experienceEventUtils";

export const listExperienceEvents = async ({ maxCount = 30 } = {}) => {
  const eventsQuery = query(
    collection(db, EXPERIENCE_COLLECTIONS.EVENTS),
    limit(maxCount)
  );

  const snapshot = await getDocs(eventsQuery);

  return snapshot.docs.map((docSnap) =>
    normalizeExperienceEvent({
      id: docSnap.id,
      ...docSnap.data(),
    })
  );
};

export const listPublishedExperienceEvents = async ({ maxCount = 30 } = {}) => {
  const events = await listExperienceEvents({ maxCount });

  return sortExperienceEvents(
    events.filter((event) => isPublicExperienceEvent(event.raw || event))
  ).slice(0, maxCount);
};

export const resolveFeaturedExperienceEvent = (events = []) => {
  const normalized = sortExperienceEvents(
    events.map((event) => normalizeExperienceEvent(event.raw || event))
  );

  return (
    normalized.find((event) => event.status === "live") ||
    normalized.find((event) => event.featured) ||
    normalized[0] ||
    null
  );
};
