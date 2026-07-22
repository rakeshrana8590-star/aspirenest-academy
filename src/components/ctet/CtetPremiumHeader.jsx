import React from "react";
import {
  buildAdaptiveShellHeaderModel,
} from "../../access/adaptiveShellHeaderModel";
import AspireNestLogo from "../AspireNestLogo.jsx";
import CtetHeaderNotificationCenter from "./CtetHeaderNotificationCenter.jsx";
import useMentorSession from "../../mentor/useMentorSession";

export default function CtetPremiumHeader({
  className = "",
  user,
  isAdminUser = false,
  shellNavigation = null,
  currentPath = "",
  announcements = [],
  events = [],
  contentItems = [],
  currentAffairs = [],
  roadmaps = [],
  mockResults = [],
  navigate,
  accountMenuRef,
  accountMenuOpen,
  setAccountMenuOpen,
  accountDisplayName,
  accountEmail,
  openAccountTarget,
  logoutFromAccountMenu,
}) {
  const mentorSession = useMentorSession({
    user,
    isAdminUser,
  });
  const isMentorUser = Boolean(
    !mentorSession.loading &&
      !mentorSession.error &&
      mentorSession.isMentor &&
      !isAdminUser
  );

  const rootClassName = ["ctetExperienceStickyHeader", className]
    .filter(Boolean)
    .join(" ");

  const headerModel =
    buildAdaptiveShellHeaderModel({
      shellNavigation,
      user,
      isAdminUser,
      isMentorUser,
      currentPath,
    });
  const {
    roleLabel,
    accessLabel,
    accountBadge,
  } = headerModel;

  const handleAccountClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("aspirenest:ctet-account-menu-open"));
    }

    if (!user) {
      navigate("/login");
      return;
    }

    setAccountMenuOpen((open) => !open);
  };

  return (
    <div
      className={rootClassName}
      data-shell-mode={headerModel.mode}
      data-shell-fail-closed={
        headerModel.isFailClosed
          ? "true"
          : "false"
      }
    >
      <div className="ctetLockedNav">
        <button
          type="button"
          className="ctetLockedBrand"
          onClick={() =>
            navigate(headerModel.brandRoute)
          }
        >
          <AspireNestLogo />
        </button>

        <nav className="ctetLockedLinks" aria-label="AspireNest navigation">
          {headerModel.primaryItems.map(
            (item) => (
              <button
                type="button"
                key={item.id}
                aria-current={
                  item.isActive
                    ? "page"
                    : undefined
                }
                onClick={() =>
                  navigate(item.route)
                }
              >
                {item.label}
                {item.badge ? (
                  <em>{item.badge}</em>
                ) : null}
              </button>
            )
          )}
        </nav>

        <div className="ctetLockedTools">
          <CtetHeaderNotificationCenter
            user={user}
            announcements={announcements}
            events={events}
            contentItems={contentItems}
            currentAffairs={currentAffairs}
            roadmaps={roadmaps}
            mockResults={mockResults}
            navigate={navigate}
            onOpen={() => setAccountMenuOpen(false)}
          />

          <div className="accountMenuWrap" ref={accountMenuRef}>
            <button
              type="button"
              className="ctetLockedAccount"
              onClick={handleAccountClick}
              aria-haspopup={
                user ? "menu" : undefined
              }
              aria-expanded={
                user
                  ? accountMenuOpen
                  : undefined
              }
              title={`${roleLabel} — ${accessLabel}`}
            >
              <i />
              <span>
                <strong>{roleLabel}</strong>
                <small>{accessLabel}</small>
              </span>
              <b>{accountBadge}</b>
            </button>

            {user && accountMenuOpen ? (
              <div className="premiumAccountDropdown">
                <div className="accountDropdownProfile">
                  <b>{accountBadge}</b>
                  <div>
                    <strong>{accountDisplayName}</strong>
                    <small>{accountEmail}</small>
                  </div>
                </div>

                {headerModel.accountItems.map(
                  (item) => (
                    <button
                      type="button"
                      key={item.id}
                      aria-current={
                        item.isActive
                          ? "page"
                          : undefined
                      }
                      onClick={() =>
                        openAccountTarget(
                          item.route
                        )
                      }
                    >
                      <span>{item.icon}</span>
                      <div>
                        <strong>
                          {item.label}
                        </strong>
                        <small>
                          {item.description}
                        </small>
                      </div>
                    </button>
                  )
                )}

                <button
                  type="button"
                  className="danger"
                  onClick={logoutFromAccountMenu}
                >
                  <span>🚪</span>
                  <div>
                    <strong>Logout</strong>
                    <small>Sign out safely</small>
                  </div>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
