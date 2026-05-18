export default function StudentDashboard({
    user,
    isPremiumUser,
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
  }) {
    if (!user) return null;
  
    return (
      <section className="studentDashboard">
        <div className="dashboardSidebar">
          <h3>Dashboard</h3>
  
          <div className="userEmail">
            <p>Welcome, {user.email}</p>
  
            <span>
              {isPremiumUser ? "🌟 PREMIUM MEMBER" : "FREE MEMBER"}
            </span>
          </div>
  
          <button className="logoutBtn" onClick={handleLogout}>
            Logout
          </button>
  
          {isAdmin() && (
            <button className="logoutBtn" onClick={loadAdminData}>
              Load Admin Data
            </button>
          )}
        </div>
  
        <div className="dashboardContent">
          <span className="badge">Student Analytics</span>
  
          <h2>Your Learning Command Center</h2>
  
          <p className="sectionText">
            Track your mock test progress, accuracy, weak areas and AI study plan.
          </p>
  
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
  
          <div className="studyPlanBox">
            <h3>🤖 AI Study Plan</h3>
  
            <ul>
              {aiStudyPlan.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
  
            <button className="btnLink" onClick={handlePremiumSectionAccess}>
              Unlock Premium Guidance
            </button>
          </div>
  
          {mockResults.length === 0 && (
            <p className="sectionText">
              Attempt your first mock test to unlock personalized analytics.
            </p>
          )}
        </div>
      </section>
    );
  }