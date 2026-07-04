import { addDoc, collection, doc, getDocs, limit, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { db } from "../firebase";
import { EXPERIENCE_COLLECTIONS } from "./experienceConstants";
import {
  buildExperienceEventKey,
  isPublicExperienceEvent,
  normalizeExperienceEvent,
  sortExperienceEvents,
} from "./experienceEventUtils";

const buildExperiencePayload = (data = {}, includeCreateFields = false) => {
  const title = String(data.title || "").trim();
  const type = data.type || "";
  const startAt = data.startAt || "";

  const payload = {
    title,
    description: String(data.description || "").trim(),
    type,
    status: data.status || "",
    subject: String(data.subject || "").trim(),
    chapter: String(data.chapter || "").trim(),
    mentorName: String(data.mentorName || "").trim(),
    planType: String(data.planType || "FREE").trim(),
    startAt,
    endAt: data.endAt || "",
    thumbnail: String(data.thumbnail || data.thumbnailUrl || "").trim(),
    ctaType: data.ctaType || "",
    ctaLabel: String(data.ctaLabel || "").trim(),
    ctaUrl: String(data.ctaUrl || data.ctaLink || "").trim(),
    priority: Number(data.priority || 0),
    featured: Boolean(data.featured),
    sourceType: data.sourceType || "manual",
    sourceId: data.sourceId || "",
    experienceKey: buildExperienceEventKey({ title, type, startAt }),
    updatedAt: serverTimestamp(),
  };

  if (includeCreateFields) {
    payload.createdAt = serverTimestamp();
  }

  return payload;
};

const assertUniqueExperienceEvent = async (payload, currentId = "") => {
  if (!payload.experienceKey) return;

  const duplicateQuery = query(
    collection(db, EXPERIENCE_COLLECTIONS.EVENTS),
    where("experienceKey", "==", payload.experienceKey),
    limit(2)
  );

  const snapshot = await getDocs(duplicateQuery);
  const duplicate = snapshot.docs.find((docSnap) => docSnap.id !== currentId);

  if (duplicate) {
    throw new Error("Duplicate experience event already exists for this title, type, and start time.");
  }
};

export const createExperienceEvent = async (data = {}) => {
  const title = String(data.title || "").trim();

  if (!title) {
    throw new Error("Experience event title is required.");
  }

  const payload = buildExperiencePayload(data, true);

  await assertUniqueExperienceEvent(payload);

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

  const payload = buildExperiencePayload(data);

  await assertUniqueExperienceEvent(payload, id);

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
