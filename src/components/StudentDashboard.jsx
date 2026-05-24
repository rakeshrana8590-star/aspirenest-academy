import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function StudentDashboard({
  user,
  isPremiumUser,
  userPlanType,
  membershipExpiry,
  hasPlanAccess,
  isAdmin,
  handlePremiumSectionAccess,
  handleLogout,
  loadAdminData,
  mockResults,
  averageAccuracy,
  highestScore,
  totalMockAttempts,
  dailyStreak,
  weeklyGrowthMessage,
  estimatedRank,
  rankPredictionMessage,
  estimatedStudyHours,
  studyTimeMessage,
  aiStudyPlan,
  analyticsMessage,
  weakestSubject,
  smartRecommendation,
  performanceChartData,
  subjectChartData,
  chartColors,
}) {
  const getDaysRemaining = () => {
    if (!membershipExpiry) return null;
  
    const today = new Date();
    const expiry = new Date(membershipExpiry);
  
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
    return diffDays;
  };
  
  const daysRemaining = getDaysRemaining();
  if (!user) return null;

  return (
    <section className="studentDashboard">
      <aside className="dashboardSidebar">
        <h3>Dashboard</h3>

        <div className="userEmail">
          <p>Welcome,</p>
          <strong>{user.email}</strong>
          <span>
  {isPremiumUser
    ? `🌟 ${userPlanType} MEMBER`
    : "FREE MEMBER"}
</span>
        </div>

        <div className="dashboardMenu">
          <button>📚 My Courses</button>
          <button>📝 Mock Tests</button>
          <button>📈 Progress</button>
          <button>📥 Download Notes</button>
          <button>🎯 Revision Planner</button>
        </div>

        {isAdmin() && (
          <button className="logoutBtn" onClick={loadAdminData}>
            👑 Load Admin Data
          </button>
        )}

        <button className="logoutBtn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="dashboardContent">
        <span className="badge">Student Analytics</span>

        <h2>Your Learning Command Center</h2>

        <p className="sectionText">
          Track your mock test progress, accuracy, weak areas and AI study plan.
        </p>

        <div className="analyticsCard">
  <h3>🚀 Membership Status</h3>

  <h2>
    {isPremiumUser
      ? `🌟 ${userPlanType}`
      : "FREE PLAN"}
  </h2>

  <p>
    {isPremiumUser
      ? "Premium features unlocked successfully."
      : "Upgrade to unlock premium notes, mock tests and AI guidance."}
  </p>

  {!isPremiumUser && (
    <button
      className="btnLink"
      onClick={handlePremiumSectionAccess}
      style={{ marginTop: "12px" }}
    >
      Upgrade Now
    </button>
  )}
</div>
{membershipExpiry && (
  <div className="analyticsCard">
    <h3>📅 Membership Expiry</h3>

    <h2>
      {new Date(membershipExpiry).toLocaleDateString()}
    </h2>

    <p>
      Your premium access is active until this date.
    </p>
    {daysRemaining !== null && (
  <p
    style={{
      marginTop: "10px",
      fontWeight: "700",
      color:
        daysRemaining <= 7
          ? "#dc2626"
          : "#16a34a",
    }}
  >
    {daysRemaining > 0
      ? `⏳ ${daysRemaining} days remaining`
      : "❌ Membership expired"}
  </p>
)}
  </div>
)}
{daysRemaining !== null && daysRemaining <= 7 && (
  <button
    className="btnLink"
    onClick={handlePremiumSectionAccess}
    style={{ marginTop: "12px" }}
  >
    Renew / Upgrade Membership
  </button>
)}
        <div className="dashboardCards">
          <div className="dashboardMiniCard">
            <h3>{totalMockAttempts}</h3>
            <p>Total Mock Attempts</p>
          </div>

          <div className="dashboardMiniCard">
            <h3>{averageAccuracy}%</h3>
            <p>Average Accuracy</p>
          </div>

          <div className="dashboardMiniCard">
            <h3>{highestScore}%</h3>
            <p>Highest Score</p>
          </div>

          <div className="dashboardMiniCard">
            <h3>{dailyStreak}</h3>
            <p>Practice Streak</p>
          </div>
        </div>

        <div className="analyticsGrid">
          <div className="analyticsCard">
            <h3>📊 Progress Summary</h3>
            <p>{analyticsMessage}</p>
            <p>{weeklyGrowthMessage}</p>
          </div>

          <div className="analyticsCard">
            <h3>🎯 Weak Subject</h3>
            <h2>{weakestSubject}</h2>
            <p>{smartRecommendation}</p>
          </div>

          <div className="analyticsCard">
            <h3>🏆 Rank Prediction</h3>
            <h2>{estimatedRank}</h2>
            <p>{rankPredictionMessage}</p>
          </div>

          <div className="analyticsCard">
            <h3>⏱️ Study Time</h3>
            <h2>{estimatedStudyHours} hrs</h2>
            <p>{studyTimeMessage}</p>
          </div>
        </div>

        <div className="analyticsCharts">
          <div className="chartCard">
            <h3>📈 Weekly Performance</h3>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={performanceChartData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#f97316"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chartCard">
            <h3>📊 Subject Performance</h3>

            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={subjectChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {subjectChartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="studyPlanBox">
          <h3>🤖 AI Study Plan</h3>

          <ul>
            {aiStudyPlan.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          {hasPlanAccess("PREMIUM") ? (
  <button className="btnLink">
    Premium Guidance Active ✅
  </button>
) : (
  <button className="btnLink" onClick={handlePremiumSectionAccess}>
    Unlock Premium Guidance
  </button>
)}
        </div>

        {mockResults.length === 0 && (
          <p className="sectionText">
            Attempt your first mock test to unlock personalized analytics.
          </p>
        )}
      </main>
    </section>
  );
}

