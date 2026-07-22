import React from "react";
import { useParams } from "react-router-dom";

import {
  getProtectedContentUrl,
  readProtectedVideoAssetForDecision,
} from "../../protectedContentAssetsService.js";
import StudentClassroomRoute from "./StudentClassroomRoute.jsx";
import VideoAccessGuard, {
  VideoGuardScreen,
} from "./VideoAccessGuard.jsx";

const PROTECTED_VIDEO_SOURCE_FIELDS = Object.freeze([
  "replayUrl",
  "recordingUrl",
  "joinUrl",
  "liveUrl",
  "meetingUrl",
  "videoUrl",
  "fileUrl",
  "sourceUrl",
  "assetUrl",
]);

const safeDecodeRouteValue = (value = "") => {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
};

const findClassroomItem = (
  universalContent = [],
  activeVideoId = ""
) => {
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

const requiresProtectedSource = (item = {}) =>
  item.hasProtectedAsset === true ||
  Boolean(item.protectedAssetId || item.assetId);

function AuthorizedClassroom({
  classroomItem,
  universalContent,
  user,
  isAdmin,
  hasPlanAccess,
  watchDecision,
}) {
  const videoResourceId = String(
    classroomItem?.id ||
      classroomItem?.videoId ||
      classroomItem?.classId ||
      ""
  );
  const protectedSourceRequired =
    requiresProtectedSource(classroomItem);
  const [assetState, setAssetState] = React.useState(() => ({
    loading: protectedSourceRequired,
    error: "",
    sourceUrl: "",
  }));

  React.useEffect(() => {
    let active = true;

    if (!protectedSourceRequired) {
      setAssetState({
        loading: false,
        error: "",
        sourceUrl: "",
      });
      return () => {
        active = false;
      };
    }

    const assetId =
      classroomItem.protectedAssetId ||
      classroomItem.assetId ||
      videoResourceId;

    setAssetState({
      loading: true,
      error: "",
      sourceUrl: "",
    });

    readProtectedVideoAssetForDecision({
      assetId,
      videoId: videoResourceId,
      decision: watchDecision,
    })
      .then((asset) => {
        if (!active) return;

        const sourceUrl = getProtectedContentUrl(
          asset || {},
          PROTECTED_VIDEO_SOURCE_FIELDS
        );

        if (!sourceUrl) {
          throw new Error(
            "Protected classroom source is unavailable."
          );
        }

        setAssetState({
          loading: false,
          error: "",
          sourceUrl,
        });
      })
      .catch(() => {
        if (!active) return;

        setAssetState({
          loading: false,
          error: "Protected classroom source is unavailable.",
          sourceUrl: "",
        });
      });

    return () => {
      active = false;
    };
  }, [
    classroomItem,
    protectedSourceRequired,
    videoResourceId,
    watchDecision,
  ]);

  if (assetState.loading) {
    return (
      <VideoGuardScreen
        badge="SECURE SOURCE"
        title="Preparing protected classroom"
        message="AspireNest verified WATCH access and is now resolving the protected media source."
        primaryLabel="Reload Classroom"
        onPrimary={() => window.location.reload()}
        secondaryLabel="Back to Classes"
        onSecondary={() => window.history.back()}
      />
    );
  }

  if (assetState.error) {
    return (
      <VideoGuardScreen
        badge="SOURCE UNAVAILABLE"
        title="Protected classroom source could not be opened"
        message="The class remains closed because its protected source could not be verified. Reload or contact support."
        primaryLabel="Reload Classroom"
        onPrimary={() => window.location.reload()}
        secondaryLabel="Back to Classes"
        onSecondary={() => window.history.back()}
      />
    );
  }

  return (
    <StudentClassroomRoute
      universalContent={universalContent}
      user={user}
      isAdmin={isAdmin}
      hasPlanAccess={hasPlanAccess}
      classroomItemOverride={classroomItem}
      watchDecision={watchDecision}
      authorizedSourceUrl={assetState.sourceUrl}
      requiresProtectedAsset={protectedSourceRequired}
    />
  );
}

export default function StudentClassroomGuardRoute({
  universalContent = [],
  user = null,
  isAdmin = false,
  hasPlanAccess,
  accessState = {},
}) {
  const { videoId = "" } = useParams();
  const activeVideoId = safeDecodeRouteValue(videoId);

  const classroomItem = React.useMemo(
    () => findClassroomItem(universalContent, activeVideoId),
    [universalContent, activeVideoId]
  );

  const isLoading =
    accessState?.loading === true ||
    (!classroomItem && universalContent.length === 0);

  return (
    <VideoAccessGuard
      item={classroomItem}
      user={user}
      isAdmin={isAdmin}
      hasPlanAccess={hasPlanAccess}
      accessState={accessState}
      isLoading={isLoading}
    >
      {(watchDecision) => (
        <AuthorizedClassroom
          classroomItem={classroomItem}
          universalContent={universalContent}
          user={user}
          isAdmin={isAdmin}
          hasPlanAccess={hasPlanAccess}
          watchDecision={watchDecision}
        />
      )}
    </VideoAccessGuard>
  );
}
