import { useCallback, useEffect, useMemo, useState } from "react";

import {
  listPublishedExperienceEvents,
  resolveFeaturedExperienceEvent,
} from "./experienceEventService";
import {
  normalizeExperienceEvent,
  sortExperienceEvents,
} from "./experienceEventUtils";

const EMPTY_EVENTS = [];

export default function useExperienceEvents({
  enabled = true,
  autoLoad = true,
  maxCount = 30,
} = {}) {
  const [events, setEvents] = useState(EMPTY_EVENTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadExperienceEvents = useCallback(async () => {
    if (!enabled) {
      setEvents(EMPTY_EVENTS);
      setLoading(false);
      setError(null);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const records = await listPublishedExperienceEvents({ maxCount });
      setEvents(records);
      return records;
    } catch (loadError) {
      setError(loadError);
      setEvents(EMPTY_EVENTS);
      return [];
    } finally {
      setLoading(false);
    }
  }, [enabled, maxCount]);

  useEffect(() => {
    if (!autoLoad) return;
    loadExperienceEvents();
  }, [autoLoad, loadExperienceEvents]);

  const normalizedEvents = useMemo(
    () => sortExperienceEvents(events.map((event) => normalizeExperienceEvent(event.raw || event))),
    [events]
  );

  const featuredEvent = useMemo(
    () => resolveFeaturedExperienceEvent(normalizedEvents),
    [normalizedEvents]
  );

  const liveEvents = useMemo(
    () => normalizedEvents.filter((event) => event.status === "live"),
    [normalizedEvents]
  );

  const upcomingEvents = useMemo(
    () =>
      normalizedEvents.filter((event) =>
        ["scheduled", "published"].includes(event.status)
      ),
    [normalizedEvents]
  );

  const completedEvents = useMemo(
    () =>
      normalizedEvents.filter((event) =>
        ["completed", "expired"].includes(event.status)
      ),
    [normalizedEvents]
  );

  return {
    events: normalizedEvents,
    featuredEvent,
    liveEvents,
    upcomingEvents,
    completedEvents,
    loading,
    error,
    hasEvents: normalizedEvents.length > 0,
    refresh: loadExperienceEvents,
  };
}
