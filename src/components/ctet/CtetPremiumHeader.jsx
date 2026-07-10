import React from "react";
import AspireNestLogo from "../AspireNestLogo.jsx";
import CtetHeaderNotificationCenter from "./CtetHeaderNotificationCenter.jsx";

const HEADER_LINKS = [
  ["Learning Hub", "/ctet-tet"],
  ["Mock Tests", "/ctet-tet/mock-tests"],
  ["Notes", "/ctet-tet/notes"],
  ["Videos", "/ctet-tet/videos"],
  ["Current Affairs", "/ctet-tet/current-affairs"],
  ["Roadmaps", "/ctet-tet/roadmaps"],
  ["Pricing", "/ctet-tet/pricing"],
];

export default function CtetPremiumHeader({
  className = "",
  user,
  isAdminUser = false,
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
  const rootClassName = ["ctetExperienceStickyHeader", className]
    .filter(Boolean)
    .join(" ");

  const roleLabel = user ? (isAdminUser ? "Admin" : "Student") : "Login";
  const accessLabel = user
    ? isAdminUser
      ? "Premium Access"
      : "Learning Access"
    : "Start Learning";
  const accountBadge = user ? (isAdminUser ? "AN" : "ST") : "IN";

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
    <div className={rootClassName}>
      <div className="ctetLockedNav">
        <button
          type="button"
          className="ctetLockedBrand"
          onClick={() => navigate("/ctet-tet")}
        >
          <AspireNestLogo />
        </button>

        <nav className="ctetLockedLinks" aria-label="AspireNest navigation">
          {HEADER_LINKS.map(([label, url]) => (
            <button type="button" key={label} onClick={() => navigate(url)}>
              {label}
              {label === "Pricing" ? <em>Premium</em> : null}
            </button>
          ))}
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

                <button
                  type="button"
                  onClick={() => openAccountTarget("/my-profile")}
                >
                  <span>👤</span>
                  <div>
                    <strong>Profile</strong>
                    <small>View account details</small>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openAccountTarget(
                      isAdminUser ? "/admin" : "/student-dashboard"
                    )
                  }
                >
                  <span>{isAdminUser ? "⚙️" : "📊"}</span>
                  <div>
                    <strong>
                      {isAdminUser ? "Admin Dashboard" : "Student Dashboard"}
                    </strong>
                    <small>
                      {isAdminUser ? "Manage academy" : "Track learning"}
                    </small>
                  </div>
                </button>

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
