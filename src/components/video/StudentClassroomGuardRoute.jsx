import React from "react";
import { useParams } from "react-router-dom";

import StudentClassroomRoute from "./StudentClassroomRoute.jsx";
import VideoAccessGuard from "./VideoAccessGuard.jsx";

const safeDecodeRouteValue = (value = "") => {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
};

const findClassroomItem = (universalContent = [], activeVideoId = "") => {
  if (!activeVideoId) return null;

  return (
    universalContent.find(
      (item) =>
        item?.id === activeVideoId ||
        item?.videoId === activeVideoId ||
        item?.classId === activeVideoId
    ) || null
  );
};

export default function StudentClassroomGuardRoute({
  universalContent = [],
  user = null,
  isAdmin = false,
  hasPlanAccess,
}) {
  const { videoId = "" } = useParams();
  const activeVideoId = safeDecodeRouteValue(videoId);

  const classroomItem = React.useMemo(
    () => findClassroomItem(universalContent, activeVideoId),
    [universalContent, activeVideoId]
  );

  const isLoading = !classroomItem && universalContent.length === 0;

  return (
    <VideoAccessGuard
      item={classroomItem}
      user={user}
      isAdmin={isAdmin}
      hasPlanAccess={hasPlanAccess}
      isLoading={isLoading}
    >
      <StudentClassroomRoute
        universalContent={universalContent}
        user={user}
          isAdmin={isAdmin}
        hasPlanAccess={hasPlanAccess}
      />
    </VideoAccessGuard>
  );
}