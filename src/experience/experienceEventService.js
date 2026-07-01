import { addDoc, collection, doc, getDocs, limit, query, serverTimestamp, updateDoc } from "firebase/firestore";

import { db } from "../firebase";
import { EXPERIENCE_COLLECTIONS } from "./experienceConstants";
import {
  isPublicExperienceEvent,
  normalizeExperienceEvent,
  sortExperienceEvents,
} from "./experienceEventUtils";

export const createExperienceEvent = async (data = {}) => {
  const title = String(data.title || "").trim();

  if (!title) {
    throw new Error("Experience event title is required.");
  }

  const payload = {
    title,
    description: String(data.description || "").trim(),
    type: data.type || "",
    status: data.status || "",
    subject: String(data.subject || "").trim(),
    chapter: String(data.chapter || "").trim(),
    mentorName: String(data.mentorName || "").trim(),
    planType: String(data.planType || "FREE").trim(),
    startAt: data.startAt || "",
    endAt: data.endAt || "",
    ctaType: data.ctaType || "",
    ctaLabel: String(data.ctaLabel || "").trim(),
    ctaUrl: String(data.ctaUrl || "").trim(),
    priority: Number(data.priority || 0),
    featured: Boolean(data.featured),
    sourceType: data.sourceType || "manual",
    sourceId: data.sourceId || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, EXPERIENCE_COLLECTIONS.EVENTS), payload);

  return {
    id: docRef.id,
    ...payload,
  };
};

export const updateExperienceEvent = async (eventId, data = {}) => {
  const id = String(eventId || "").trim();
  const title = String(data.title || "").trim();

  if (!id) {
    throw new Error("Experience event id is required.");
  }

  if (!title) {
    throw new Error("Experience event title is required.");
  }

  const payload = {
    title,
    description: String(data.description || "").trim(),
    type: data.type || "",
    status: data.status || "",
    subject: String(data.subject || "").trim(),
    chapter: String(data.chapter || "").trim(),
    mentorName: String(data.mentorName || "").trim(),
    planType: String(data.planType || "FREE").trim(),
    startAt: data.startAt || "",
    endAt: data.endAt || "",
    ctaType: data.ctaType || "",
    ctaLabel: String(data.ctaLabel || "").trim(),
    ctaUrl: String(data.ctaUrl || "").trim(),
    priority: Number(data.priority || 0),
    featured: Boolean(data.featured),
    sourceType: data.sourceType || "manual",
    sourceId: data.sourceId || "",
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, EXPERIENCE_COLLECTIONS.EVENTS, id), payload);

  return {
    id,
    ...payload,
  };
};

export const archiveExperienceEvent = async (eventId) => {
  const id = String(eventId || "").trim();

  if (!id) {
    throw new Error("Experience event id is required.");
  }

  await updateDoc(doc(db, EXPERIENCE_COLLECTIONS.EVENTS, id), {
    status: "archived",
    archivedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id,
    status: "archived",
  };
};

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
