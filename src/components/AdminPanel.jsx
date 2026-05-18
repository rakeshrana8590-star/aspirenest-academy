export default function AdminPanel({
  isAdmin,
  activeAdminTab,
  setActiveAdminTab,
  students,
  enquiries,
  leaderboard,
  handlePremiumControl,
}) {
  if (!isAdmin()) return null;

  return (
    <div className="adminProPanel">
      <div className="adminProHeader">
        <div>
          <span className="badge">Admin Panel PRO</span>

          <h2>Platform Control Center</h2>

          <p>
            Manage students, enquiries, notes, current affairs, mock tests,
            payments and announcements.
          </p>
        </div>
      </div>

      <div className="adminTabs">
        {[
          "Dashboard",
          "Students",
          "Enquiries",
          "Notes",
          "Current Affairs",
          "Mock Tests",
          "Analytics",
          "Payments",
          "Announcements",
        ].map((tab) => (
          <button
            key={tab}
            className={
              activeAdminTab === tab
                ? "adminTab activeAdminTab"
                : "adminTab"
            }
            onClick={() => setActiveAdminTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeAdminTab === "Dashboard" && (
        <div className="adminOverviewGrid">
          <div className="dashboardCard">
            <h3>Total Students</h3>
            <p>{students.length}</p>
          </div>

          <div className="dashboardCard">
            <h3>Total Enquiries</h3>
            <p>{enquiries.length}</p>
          </div>

          <div className="dashboardCard">
            <h3>Total Mock Results</h3>
            <p>{leaderboard.length}</p>
          </div>

          <div className="dashboardCard">
            <h3>Admin Mode</h3>
            <p>Active</p>
          </div>
        </div>
      )}

      {activeAdminTab === "Students" && (
        <div className="adminStudentsSection">
          <h3>Registered Students</h3>

          <div className="adminStudentsGrid">
            {students.length > 0 ? (
              students.map((student, index) => (
                <div
                  className="studentCard"
                  key={student.id || index}
                >
                  <h4>{student.name || "Student"}</h4>

                  <p>📧 {student.email}</p>

                  <p>
                    ⭐{" "}
                    {student.isPremium
                      ? "Premium User"
                      : "Free User"}
                  </p>

                  <p>
                    📊 Mock Attempts:{" "}
                    {student.mockAttempts || 0}
                  </p>

                  <div className="studentActions">
                    <button
                      className="btnLink"
                      onClick={() =>
                        handlePremiumControl(
                          student.email,
                          true
                        )
                      }
                    >
                      Make Premium
                    </button>

                    <button
                      className="btnLink"
                      onClick={() =>
                        handlePremiumControl(
                          student.email,
                          false
                        )
                      }
                    >
                      Remove Premium
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No students found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}export default function AdminPanel({
  isAdmin,
  activeAdminTab,
  setActiveAdminTab,
  students,
  enquiries,
  leaderboard,
  handlePremiumControl,
}) {
  if (!isAdmin()) return null;

  return (
    <div className="adminProPanel">
      <div className="adminProHeader">
        <div>
          <span className="badge">Admin Panel PRO</span>

          <h2>Platform Control Center</h2>

          <p>
            Manage students, enquiries, notes, current affairs, mock tests,
            payments and announcements.
          </p>
        </div>
      </div>

      <div className="adminTabs">
        {[
          "Dashboard",
          "Students",
          "Enquiries",
          "Notes",
          "Current Affairs",
          "Mock Tests",
          "Analytics",
          "Payments",
          "Announcements",
        ].map((tab) => (
          <button
            key={tab}
            className={
              activeAdminTab === tab
                ? "adminTab activeAdminTab"
                : "adminTab"
            }
            onClick={() => setActiveAdminTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeAdminTab === "Dashboard" && (
        <div className="adminOverviewGrid">
          <div className="dashboardCard">
            <h3>Total Students</h3>
            <p>{students.length}</p>
          </div>

          <div className="dashboardCard">
            <h3>Total Enquiries</h3>
            <p>{enquiries.length}</p>
          </div>

          <div className="dashboardCard">
            <h3>Total Mock Results</h3>
            <p>{leaderboard.length}</p>
          </div>

          <div className="dashboardCard">
            <h3>Admin Mode</h3>
            <p>Active</p>
          </div>
        </div>
      )}

      {activeAdminTab === "Students" && (
        <div className="adminStudentsSection">
          <h3>Registered Students</h3>

          <div className="adminStudentsGrid">
            {students.length > 0 ? (
              students.map((student, index) => (
                <div
                  className="studentCard"
                  key={student.id || index}
                >
                  <h4>{student.name || "Student"}</h4>

                  <p>📧 {student.email}</p>

                  <p>
                    ⭐{" "}
                    {student.isPremium
                      ? "Premium User"
                      : "Free User"}
                  </p>

                  <p>
                    📊 Mock Attempts:{" "}
                    {student.mockAttempts || 0}
                  </p>

                  <div className="studentActions">
                    <button
                      className="btnLink"
                      onClick={() =>
                        handlePremiumControl(
                          student.email,
                          true
                        )
                      }
                    >
                      Make Premium
                    </button>

                    <button
                      className="btnLink"
                      onClick={() =>
                        handlePremiumControl(
                          student.email,
                          false
                        )
                      }
                    >
                      Remove Premium
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No students found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}