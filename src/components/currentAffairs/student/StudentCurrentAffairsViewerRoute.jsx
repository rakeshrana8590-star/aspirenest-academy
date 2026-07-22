import React from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  CURRENT_AFFAIRS_ACTIONS,
  CURRENT_AFFAIRS_REASON_CODES,
  buildCurrentAffairsAccessEvidence,
  buildCurrentAffairsActionDecision,
} from "../../../access/currentAffairsActionPolicy.js";
import {
  getProtectedContentUrl,
  readProtectedCurrentAffairsAssetForDecision,
} from "../../../protectedContentAssetsService.js";
import {
  getCurrentAffairsPdfUrl,
  getMonthCurrentAffairs,
  getPublishedCurrentAffairs,
  hasCurrentAffairsProtectedAsset,
} from "../shared/currentAffairsUtils";

const CURRENT_AFFAIRS_SOURCE_FIELDS =
  Object.freeze([
    "pdfUrl",
    "fileUrl",
    "downloadUrl",
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

function CurrentAffairsViewerState({
  badge = "CURRENT AFFAIRS",
  title = "Resource unavailable",
  message = "",
  primaryLabel = "Back to Month",
  onPrimary,
  secondaryLabel = "",
  onSecondary,
}) {
  return (
    <section className="studentCaPage">
      <div className="studentCaShelf studentCaViewerState">
        <span>{badge}</span>
        <h1>{title}</h1>
        {message ? <p>{message}</p> : null}

        <div className="studentCaViewerActions">
          <button
            type="button"
            className="studentCaViewerPrimary"
            onClick={onPrimary}
          >
            {primaryLabel}
          </button>

          {secondaryLabel ? (
            <button
              type="button"
              className="studentCaViewerSecondary"
              onClick={onSecondary}
            >
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AuthorizedCurrentAffairsViewer({
  resource,
  readDecision,
  monthId,
}) {
  const navigate = useNavigate();
  const resourceId = String(resource?.id || "");
  const protectedSourceRequired =
    hasCurrentAffairsProtectedAsset(resource);
  const legacySourceUrl = getCurrentAffairsPdfUrl(
    resource
  );

  const [sourceState, setSourceState] =
    React.useState(() => ({
      loading: protectedSourceRequired,
      error: "",
      sourceUrl:
        protectedSourceRequired ||
        !readDecision?.legacySourceAllowed
          ? ""
          : legacySourceUrl,
    }));

  React.useEffect(() => {
    let active = true;

    if (!protectedSourceRequired) {
      setSourceState({
        loading: false,
        error: readDecision?.legacySourceAllowed &&
          legacySourceUrl
          ? ""
          : "The verified resource does not have a readable PDF source.",
        sourceUrl:
          readDecision?.legacySourceAllowed
            ? legacySourceUrl
            : "",
      });

      return () => {
        active = false;
      };
    }

    const assetId =
      resource.protectedAssetId ||
      resource.assetId ||
      resourceId;

    setSourceState({
      loading: true,
      error: "",
      sourceUrl: "",
    });

    readProtectedCurrentAffairsAssetForDecision({
      assetId,
      resourceId,
      decision: readDecision,
    })
      .then((asset) => {
        if (!active) return;

        const sourceUrl = getProtectedContentUrl(
          asset || {},
          CURRENT_AFFAIRS_SOURCE_FIELDS
        );

        if (!sourceUrl) {
          throw new Error(
            "Protected Current Affairs source is unavailable."
          );
        }

        setSourceState({
          loading: false,
          error: "",
          sourceUrl,
        });
      })
      .catch(() => {
        if (!active) return;

        setSourceState({
          loading: false,
          error:
            "Protected Current Affairs source is unavailable.",
          sourceUrl: "",
        });
      });

    return () => {
      active = false;
    };
  }, [
    legacySourceUrl,
    protectedSourceRequired,
    readDecision,
    resource,
    resourceId,
  ]);

  if (sourceState.loading) {
    return (
      <CurrentAffairsViewerState
        badge="SECURE SOURCE"
        title="Preparing protected PDF"
        message="AspireNest verified READ access and is resolving the protected Current Affairs source."
        primaryLabel="Reload Viewer"
        onPrimary={() => window.location.reload()}
        secondaryLabel="Back to Month"
        onSecondary={() =>
          navigate(
            `/ctet-tet/current-affairs/${encodeURIComponent(
              monthId
            )}`
          )
        }
      />
    );
  }

  if (sourceState.error || !sourceState.sourceUrl) {
    return (
      <CurrentAffairsViewerState
        badge="SOURCE UNAVAILABLE"
        title="Current Affairs PDF could not be opened"
        message={sourceState.error}
        primaryLabel="Reload Viewer"
        onPrimary={() => window.location.reload()}
        secondaryLabel="Back to Month"
        onSecondary={() =>
          navigate(
            `/ctet-tet/current-affairs/${encodeURIComponent(
              monthId
            )}`
          )
        }
      />
    );
  }

  return (
    <section className="studentCaPage">
      <div className="studentCaShelf studentCaViewerShell">
        <div className="studentCaViewerHeader">
          <div>
            <span>VERIFIED READ ACCESS</span>
            <h1>{resource.title}</h1>
            <p>
              {resource.month || "Current Affairs"} •{" "}
              {resource.week ||
                resource.chapter ||
                "Monthly PDF"}
            </p>
          </div>

          <div className="studentCaViewerActions">
            <button
              type="button"
              className="studentCaViewerSecondary"
              onClick={() =>
                navigate(
                  `/ctet-tet/current-affairs/${encodeURIComponent(
                    monthId
                  )}`
                )
              }
            >
              Back to Month
            </button>

            <button
              type="button"
              className="studentCaViewerPrimary"
              onClick={() =>
                window.open(
                  sourceState.sourceUrl,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              Open New Tab
            </button>
          </div>
        </div>

        <div className="studentCaViewerFrame">
          <iframe
            src={sourceState.sourceUrl}
            title={resource.title}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>

        <div className="studentCaViewerNotice">
          <span>🔐</span>
          <p>
            This source is exposed only after login,
            resource-bound READ authorization, publication
            checks, and protected-asset resolution.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function StudentCurrentAffairsViewerRoute({
  universalContent = [],
  currentAffairsList = [],
  user = null,
  hasPlanAccess,
  accessState = {},
  isAdmin = false,
}) {
  const navigate = useNavigate();
  const {
    monthId = "",
    resourceId = "",
  } = useParams();

  const activeMonthId =
    safeDecodeRouteValue(monthId);
  const activeResourceId =
    safeDecodeRouteValue(resourceId);

  const publishedCurrentAffairs =
    React.useMemo(
      () =>
        getPublishedCurrentAffairs(
          universalContent,
          currentAffairsList
        ),
      [universalContent, currentAffairsList]
    );

  const monthItems = React.useMemo(
    () =>
      getMonthCurrentAffairs(
        publishedCurrentAffairs,
        activeMonthId
      ),
    [publishedCurrentAffairs, activeMonthId]
  );

  const resource = React.useMemo(
    () =>
      monthItems.find(
        (item) =>
          String(item?.id || "") ===
          activeResourceId
      ) || null,
    [monthItems, activeResourceId]
  );

  const access = React.useMemo(
    () =>
      buildCurrentAffairsAccessEvidence({
        resource,
        user,
        isAdmin,
        hasPlanAccess,
        accessState,
        isLoading:
          accessState?.loading === true,
      }),
    [
      resource,
      user,
      isAdmin,
      hasPlanAccess,
      accessState,
    ]
  );

  const readDecision = React.useMemo(
    () =>
      buildCurrentAffairsActionDecision({
        action:
          CURRENT_AFFAIRS_ACTIONS.READ,
        resource,
        principal: {
          uid: user?.uid || "",
          email: user?.email || "",
          role: user?.role || "",
          isAuthenticated: Boolean(user),
          isAdmin,
        },
        access,
      }),
    [resource, user, isAdmin, access]
  );

  const backToMonth = () =>
    navigate(
      `/ctet-tet/current-affairs/${encodeURIComponent(
        activeMonthId
      )}`
    );

  if (
    readDecision.reason ===
    CURRENT_AFFAIRS_REASON_CODES.ACCESS_LOADING
  ) {
    return (
      <CurrentAffairsViewerState
        badge="VERIFYING ACCESS"
        title="Loading Current Affairs access"
        message="AspireNest will keep the PDF closed until the access decision is complete."
        primaryLabel="Reload Viewer"
        onPrimary={() => window.location.reload()}
        secondaryLabel="Back to Month"
        onSecondary={backToMonth}
      />
    );
  }

  if (
    readDecision.reason ===
      CURRENT_AFFAIRS_REASON_CODES.NOT_FOUND ||
    readDecision.reason ===
      CURRENT_AFFAIRS_REASON_CODES
        .NOT_CURRENT_AFFAIRS
  ) {
    return (
      <CurrentAffairsViewerState
        badge="RESOURCE NOT FOUND"
        title="This Current Affairs PDF is unavailable"
        message="The resource may be unpublished, deleted, or the direct link may be incorrect."
        onPrimary={backToMonth}
        secondaryLabel="Current Affairs Library"
        onSecondary={() =>
          navigate("/ctet-tet/current-affairs")
        }
      />
    );
  }

  if (
    readDecision.reason ===
    CURRENT_AFFAIRS_REASON_CODES.UNPUBLISHED
  ) {
    return (
      <CurrentAffairsViewerState
        badge="RESOURCE UNAVAILABLE"
        title="This Current Affairs PDF is not published"
        message="The resource is currently draft, unpublished, or archived."
        onPrimary={backToMonth}
        secondaryLabel="View Plans"
        onSecondary={() =>
          navigate("/ctet-tet/pricing")
        }
      />
    );
  }

  if (
    readDecision.reason ===
    CURRENT_AFFAIRS_REASON_CODES.LOGIN_REQUIRED
  ) {
    const returnTo =
      `/ctet-tet/current-affairs/` +
      `${encodeURIComponent(activeMonthId)}/read/` +
      `${encodeURIComponent(activeResourceId)}`;

    return (
      <CurrentAffairsViewerState
        badge="LOGIN REQUIRED"
        title="Login required to read this PDF"
        message={`Please login with your student account to open this ${readDecision.requiredPlan} Current Affairs resource.`}
        primaryLabel="Login"
        onPrimary={() =>
          navigate(
            `/login?returnTo=${encodeURIComponent(
              returnTo
            )}`
          )
        }
        secondaryLabel="View Plans"
        onSecondary={() =>
          navigate("/ctet-tet/pricing")
        }
      />
    );
  }

  if (
    readDecision.reason ===
    CURRENT_AFFAIRS_REASON_CODES.ACCESS_ERROR
  ) {
    return (
      <CurrentAffairsViewerState
        badge="ACCESS UNAVAILABLE"
        title="Current Affairs access could not be verified"
        message="AspireNest kept this protected PDF closed because the access check was unavailable."
        primaryLabel="Reload Viewer"
        onPrimary={() => window.location.reload()}
        secondaryLabel="Back to Month"
        onSecondary={backToMonth}
      />
    );
  }

  if (!readDecision.allowed) {
    return (
      <CurrentAffairsViewerState
        badge="ACCESS LOCKED"
        title={`${readDecision.requiredPlan} access required`}
        message="This exact PDF is not included in the currently verified plan, module, bundle, or item access."
        primaryLabel="View Plans"
        onPrimary={() =>
          navigate("/ctet-tet/pricing")
        }
        secondaryLabel="Back to Month"
        onSecondary={backToMonth}
      />
    );
  }

  return (
    <AuthorizedCurrentAffairsViewer
      resource={resource}
      readDecision={readDecision}
      monthId={activeMonthId}
    />
  );
}
