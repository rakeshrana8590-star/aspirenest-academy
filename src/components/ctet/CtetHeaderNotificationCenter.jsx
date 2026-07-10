import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  buildExperienceNotifications,
  formatNotificationTime,
  getNotificationStorageKey,
  loadReadNotificationKeys,
  saveReadNotificationKeys,
} from "../../experience/experienceNotificationUtils";

export default function CtetHeaderNotificationCenter({
  user,
  announcements = [],
  events = [],
  contentItems = [],
  currentAffairs = [],
  roadmaps = [],
  mockResults = [],
  navigate,
  onOpen,
}) {
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
    const listRef = useRef(null);
  const storageKey = getNotificationStorageKey(user);

  const notifications = useMemo(
    () =>
      buildExperienceNotifications({
        announcements,
        events,
        contentItems,
        currentAffairs,
        roadmaps,
        mockResults,
        maxCount: 12,
      }),
    [announcements, events, contentItems, currentAffairs, roadmaps, mockResults]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);
    const [listScrollState, setListScrollState] = useState({
      hasOverflow: false,
      atEnd: true,
    });
  const [readKeys, setReadKeys] = useState(() =>
    loadReadNotificationKeys(storageKey)
  );

  useEffect(() => {
    setReadKeys(loadReadNotificationKeys(storageKey));
  }, [storageKey]);

  const updatePanelPosition = useCallback(() => {
    if (typeof window === "undefined" || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth <= 720;
    const edge = isMobile ? 12 : 16;
    const gap = isMobile ? 9 : 11;
    const minimumPanelHeight = 180;

    const width = isMobile
      ? Math.max(280, viewportWidth - edge * 2)
      : Math.min(404, viewportWidth - edge * 2);

    const preferredLeft = triggerRect.right - width;
    const left = isMobile
      ? edge
      : Math.min(
          Math.max(preferredLeft, edge),
          Math.max(edge, viewportWidth - width - edge)
        );

    const preferredTop = triggerRect.bottom + gap;
    const top = Math.min(
      Math.max(edge, preferredTop),
      Math.max(edge, viewportHeight - minimumPanelHeight - edge)
    );

    const maxHeight = Math.max(
      minimumPanelHeight,
      viewportHeight - top - edge
    );

    setPanelStyle({
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      width: `${Math.round(width)}px`,
      maxHeight: `${Math.round(maxHeight)}px`,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPanelStyle(null);
      return undefined;
    }

    updatePanelPosition();

    const handleLayoutChange = () => {
      window.requestAnimationFrame(updatePanelPosition);
    };

    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("scroll", handleLayoutChange, true);

    return () => {
      window.removeEventListener("resize", handleLayoutChange);
      window.removeEventListener("scroll", handleLayoutChange, true);
    };
  }, [isOpen, updatePanelPosition]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsideClick = (event) => {
      const clickedTrigger = triggerRef.current?.contains(event.target);
      const clickedPanel = panelRef.current?.contains(event.target);

      if (!clickedTrigger && !clickedPanel) setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick, { passive: true });
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    const closeNotificationPanel = () => setIsOpen(false);

    window.addEventListener(
      "aspirenest:ctet-account-menu-open",
      closeNotificationPanel
    );

    return () => {
      window.removeEventListener(
        "aspirenest:ctet-account-menu-open",
        closeNotificationPanel
      );
    };
  }, []);

  const readKeySet = useMemo(() => new Set(readKeys), [readKeys]);
  const unreadCount = notifications.reduce(
    (total, notification) =>
      readKeySet.has(notification.key) ? total : total + 1,
    0
  );

  const persistReadKeys = (nextKeys) => {
    const uniqueKeys = Array.from(new Set(nextKeys));
    setReadKeys(uniqueKeys);
    saveReadNotificationKeys(storageKey, uniqueKeys);
  };

  const markRead = (notificationKey) => {
    if (!notificationKey || readKeySet.has(notificationKey)) return;
    persistReadKeys([...readKeys, notificationKey]);
  };

  const markAllRead = () => {
    persistReadKeys([
      ...readKeys,
      ...notifications.map((notification) => notification.key),
    ]);
  };

    const updateListScrollState = useCallback(() => {
      const list = listRef.current;
      if (!list) return;

      const hasOverflow =
        list.scrollHeight > list.clientHeight + 1;
      const atEnd =
        !hasOverflow ||
        list.scrollTop + list.clientHeight >=
          list.scrollHeight - 2;

      setListScrollState((current) => {
        if (
          current.hasOverflow === hasOverflow &&
          current.atEnd === atEnd
        ) {
          return current;
        }

        return { hasOverflow, atEnd };
      });
    }, []);

    useLayoutEffect(() => {
      if (!isOpen || !panelStyle) return undefined;

      const frame = window.requestAnimationFrame(
        updateListScrollState
      );

      return () => window.cancelAnimationFrame(frame);
    }, [
      isOpen,
      panelStyle,
      notifications.length,
      updateListScrollState,
    ]);

    const scrollNotificationList = () => {
      const list = listRef.current;
      if (!list) return;

      list.scrollBy({
        top: Math.max(160, list.clientHeight * 0.72),
        behavior: "smooth",
      });
    };

  const openNotification = (notification) => {
    markRead(notification.key);
    setIsOpen(false);

    const target = String(notification.route || "/announcements").trim();

    if (/^https?:\/\//i.test(target)) {
      window.open(target, "_blank", "noopener,noreferrer");
      return;
    }

    navigate?.(target);
  };

  const togglePanel = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) onOpen?.();
  };

  const notificationPanel =
    isOpen && panelStyle && typeof document !== "undefined"
      ? createPortal(
          <div
            id="ctet-header-notification-panel"
            ref={panelRef}
              className={
                "ctetHeaderNotificationPanel" +
                (listScrollState.hasOverflow
                  ? " hasScrollableList"
                  : "")
              }
            role="dialog"
            aria-modal="false"
            aria-label="AspireNest notifications"
            style={panelStyle}
          >
            <div className="ctetNotificationPanelHeader">
              <div>
                <span>ASPIRENEST UPDATES</span>
                <h3>Notifications</h3>
                <p>
                  {unreadCount > 0
                    ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                    : "You are all caught up"}
                </p>
              </div>

              <button
                type="button"
                disabled={unreadCount === 0}
                onClick={markAllRead}
              >
                Mark all read
              </button>
            </div>

              <div
                ref={listRef}
                className="ctetNotificationList"
                aria-live="polite"
                onScroll={updateListScrollState}
              >
              {notifications.length > 0 ? (
                notifications.map((notification) => {
                  const isUnread = !readKeySet.has(notification.key);

                  return (
                    <button
                      type="button"
                      key={notification.key}
                      className={
                        "ctetNotificationRow" + (isUnread ? " isUnread" : "")
                      }
                      onClick={() => openNotification(notification)}
                    >
                      <span
                        className={
                          "ctetNotificationRowIcon is-" + notification.tone
                        }
                        aria-hidden="true"
                      >
                        {notification.icon}
                      </span>

                      <span className="ctetNotificationRowCopy">
                        <span className="ctetNotificationRowMeta">
                          <b>{notification.badge}</b>
                          <small>{formatNotificationTime(notification.timeAt)}</small>
                        </span>

                        <strong>{notification.title}</strong>
                        <span>{notification.message}</span>
                      </span>

                      <em aria-hidden="true">›</em>
                    </button>
                  );
                })
              ) : (
                <div className="ctetNotificationEmpty">
                  <span aria-hidden="true">✓</span>
                  <strong>No new updates</strong>
                  <p>Real academy announcements and events will appear here.</p>
                </div>
              )}
            </div>

              {listScrollState.hasOverflow &&
              !listScrollState.atEnd ? (
                <button
                  type="button"
                  className="ctetNotificationScrollCue"
                  onClick={scrollNotificationList}
                  aria-label="Scroll to more notifications"
                >
                  <span>More updates</span>
                  <b aria-hidden="true">{"\u2193"}</b>
                </button>
              ) : null}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="ctetHeaderNotificationWrap">
        <button
          ref={triggerRef}
          type="button"
          className={
            "ctetHeaderNotificationBell" + (isOpen ? " isOpen" : "")
          }
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-controls="ctet-header-notification-panel"
          onClick={togglePanel}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 20.5c.45.5 1.13.8 2 .8s1.55-.3 2-.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
          </svg>

          {unreadCount > 0 ? (
            <span className="ctetHeaderNotificationCount">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </div>

      {notificationPanel}
    </>
  );
}
