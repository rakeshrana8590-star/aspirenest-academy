import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {

  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CONTENT_SECTIONS,
  PLAN_TYPES,
} from "../contentSystem";
import { AdminButton, AdminStatusPill } from "./shared/admin";
export default function AdminPanel({
  isAdmin,
  activeAdminTab,
  setActiveAdminTab,
  students,
  enquiries,
  leaderboard,
  handlePremiumControl,

  adminNoteTitle,
  setAdminNoteTitle,
  adminNoteCategory,
  setAdminNoteCategory,
  adminNotePages,
  setAdminNotePages,
  manualNotePdfUrl,
  setManualNotePdfUrl,
  setAdminNotePdf,
  uploadingPdf,
  handleUploadPdf,
  adminNoteType,
  setAdminNoteType,
  handleSaveNote,
  editingNoteId,
  notesData,
  firebaseNotes,
  handleDeleteNote,
  handleEditNote,

  currentTitle,
  setCurrentTitle,
  currentMonth,
  setCurrentMonth,
  currentPages,
  setCurrentPages,
  manualCurrentPdfUrl,
  setManualCurrentPdfUrl,
  setCurrentPdf,
  uploadingCurrentPdf,
  handleUploadCurrentPdf,
  currentType,
  setCurrentType,
  handleSaveCurrentAffairs,
  editingCurrentId,
  currentAffairsList,
  fallbackCurrentAffairs,
  handleDeleteCurrentAffairs,
  handleEditCurrentAffairs,

  adminQuestion,
  setAdminQuestion,
  adminOption1,
  setAdminOption1,
  adminOption2,
  setAdminOption2,
  adminOption3,
  setAdminOption3,
  adminOption4,
  setAdminOption4,
  adminAnswer,
  setAdminAnswer,
  adminSubject,
  setAdminSubject,
  adminLevel,
  setAdminLevel,
  adminAccessPlan,
  setAdminAccessPlan,
  handleAddMockQuestion,
  mockQuestions,
  handleDeleteMockQuestion,

  paymentHistory,
  loadPaymentRequests,

  announcementTitle,
  setAnnouncementTitle,
  announcementMessage,
  setAnnouncementMessage,
  announcements,
  handleAddAnnouncement,
  handleDeleteAnnouncement,
  universalContent,
  contentLoading,

  cmsTitle,
  setCmsTitle,
  cmsSection,
  setCmsSection,
  cmsSubject,
  setCmsSubject,
  cmsCourse,
  setCmsCourse,
  cmsChapter,
  setCmsChapter,

  cmsPlanType,
  setCmsPlanType,

  cmsContentType,
  setCmsContentType,

  cmsSourceType,
  setCmsSourceType,

  cmsFileUrl,
  setCmsFileUrl,

  cmsVideoUrl,
  setCmsVideoUrl,

  cmsThumbnailUrl,
  setCmsThumbnailUrl,

  cmsMentorName,
  setCmsMentorName,

  cmsMonth,
  setCmsMonth,

  cmsDuration,
  setCmsDuration,

  cmsStatus,
  setCmsStatus,

  editingCmsId,
  setEditingCmsId,

  handleSaveUniversalContent,
}) {
  const navigate = useNavigate();
const [adminProofs, setAdminProofs] = useState({});
const [cmsFilter, setCmsFilter] = useState("ALL");
const [cmsPlanFilter, setCmsPlanFilter] = useState("ALL");

if (!isAdmin()) return null;

  const uniqueStudents = students.filter(
    (student, index, self) =>
      index ===
      self.findIndex((s) => s.email === student.email)
  );
  const analyticsChartData = [
    { name: "Mon", students: 2, enquiries: 1 },
    { name: "Tue", students: 4, enquiries: 2 },
    { name: "Wed", students: 5, enquiries: 2 },
    { name: "Thu", students: 7, enquiries: 3 },
    { name: "Fri", students: 9, enquiries: 5 },
    { name: "Sat", students: 12, enquiries: 6 },
  ];

  const allNotes =
    firebaseNotes.length > 0 ? firebaseNotes : notesData;

  const allCurrentAffairs =
    currentAffairsList.length > 0
      ? currentAffairsList
      : fallbackCurrentAffairs;

  return (
    <div className="adminProPanel">
      <div className="adminProHeader">
        <div>
          <span className="badge">Admin Panel PRO</span>

          <h2>Platform Control Center</h2>

          <p>
            Manage students, enquiries, notes, current affairs,
            mock tests, payments and announcements.
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
          "Universal CMS",
        ].map((tab) => (
          <button
          key={tab}
          className={
            activeAdminTab === tab
              ? "adminTab activeAdminTab"
              : "adminTab"
          }
          onClick={() => {
            setActiveAdminTab(tab);
        
            const adminRoutes = {
              Dashboard: "/admin",
              Students: "/admin/students",
              Enquiries: "/admin/enquiries",
              Notes: "/admin/notes",
              "Current Affairs": "/admin/current-affairs",
              "Mock Tests": "/admin/mock-tests",
              Analytics: "/admin/analytics",
              Payments: "/admin/content/payments",
              Announcements: "/admin/announcements",
            };
        
            navigate(adminRoutes[tab]);
          }}
        >
          {tab}
        </button>
        ))}
      </div>

      {activeAdminTab === "Dashboard" && (
  <div className="adminDashboardPro">

    <div className="adminStatsGrid">

      <div className="dashboardCard proStatCard">
        <span className="statIcon">👨‍🎓</span>

        <h3>Total Students</h3>

        <p>{uniqueStudents.length}</p>

        <small>Registered learners</small>
      </div>

      <div className="dashboardCard proStatCard">
        <span className="statIcon">📩</span>

        <h3>Total Enquiries</h3>

        <p>{enquiries.length}</p>

        <small>Course interest leads</small>
      </div>

      <div className="dashboardCard proStatCard">
        <span className="statIcon">📝</span>

        <h3>Mock Results</h3>

        <p>{leaderboard.length}</p>

        <small>Practice activity</small>
      </div>

      <div className="dashboardCard proStatCard">
        <span className="statIcon">⭐</span>

        <h3>Premium Users</h3>

        <p>
          {
          uniqueStudents.filter(
            (student) => student.isPremium
          ).length
          }
        </p>

        <small>Paid access enabled</small>
      </div>

      <div className="dashboardCard proStatCard">
        <span className="statIcon">📚</span>

        <h3>Total Notes</h3>

        <p>{allNotes.length}</p>

        <small>Learning resources</small>
      </div>

      <div className="dashboardCard proStatCard">
        <span className="statIcon">📢</span>

        <h3>Announcements</h3>

        <p>{announcements.length}</p>

        <small>Live updates</small>
      </div>

    </div>

    <div className="adminInsightPanel">

      <h3>Platform Health</h3>

      <p>
        AspireNest Academy admin system is active.
        You can manage students, premium access,
        notes, current affairs, mock tests,
        payments and announcements from this
        control center.
      </p>

    </div>

  </div>
)}

      {activeAdminTab === "Students" && (
        <div className="adminStudentsSection">
          <h3>Registered Students</h3>

          <div className="adminStudentsGrid">
            {uniqueStudents.length > 0 ? (
              uniqueStudents.map((student, index) => (
                <div className="studentCard" key={student.id || index}>
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
{activeAdminTab === "Analytics" && (
  <div className="adminStudentsSection">
    <h3>Platform Analytics</h3>

    <div className="adminOverviewGrid">

      <div className="dashboardCard">
        <h3>Total Students</h3>
        <p>{uniqueStudents.length}</p>
      </div>

      <div className="dashboardCard">
        <h3>Premium Users</h3>
        <p>
          {
            uniqueStudents.filter(
              (student) => student.isPremium
            ).length
          }
        </p>
      </div>

      <div className="dashboardCard">
        <h3>Total Enquiries</h3>
        <p>{enquiries.length}</p>
      </div>

      <div className="dashboardCard">
        <h3>Mock Questions</h3>
        <p>{mockQuestions.length}</p>
      </div>

      <div className="dashboardCard">
        <h3>Total Notes</h3>
        <p>{allNotes.length}</p>
      </div>

      <div className="dashboardCard">
        <h3>Current Affairs</h3>
        <p>{allCurrentAffairs.length}</p>
      </div>

    </div>

    <div className="adminChartsGrid">
      <div className="dashboardCard">
        <h3>Student Growth</h3>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={analyticsChartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="students"
              stroke="#ff8800"
              strokeWidth={4}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="dashboardCard">
        <h3>Enquiries Analytics</h3>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={analyticsChartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="enquiries"
              fill="#ff8800"
              radius={[10, 10, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
)}
      {activeAdminTab === "Enquiries" && (
        <div className="adminStudentsSection">
          <h3>Student Enquiries</h3>

          <div className="adminStudentsGrid">
            {enquiries.length > 0 ? (
              enquiries.map((enquiry, index) => (
                <div className="studentCard" key={enquiry.id || index}>
                  <h4>
                    {enquiry.fullName || "New Enquiry"}
                  </h4>

                  <p>📞 {enquiry.mobile}</p>

                  <p>📧 {enquiry.email}</p>

                  <p>
                    🕒{" "}
                    {enquiry.createdAt?.toDate
                      ? enquiry.createdAt
                          .toDate()
                          .toLocaleString()
                      : "Recently"}
                  </p>
                </div>
              ))
            ) : (
              <p>No enquiries found.</p>
            )}
          </div>
        </div>
      )}

      {activeAdminTab === "Notes" && (
        <div className="adminStudentsSection">
          <h3>Notes CMS</h3>

          <div className="dashboardCard">
            <input
              type="text"
              placeholder="Note Title"
              value={adminNoteTitle}
              onChange={(e) =>
                setAdminNoteTitle(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Category"
              value={adminNoteCategory}
              onChange={(e) =>
                setAdminNoteCategory(e.target.value)
              }
            />

            <input
              type="number"
              placeholder="Pages"
              value={adminNotePages}
              onChange={(e) =>
                setAdminNotePages(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="PDF URL"
              value={manualNotePdfUrl}
              onChange={(e) =>
                setManualNotePdfUrl(e.target.value)
              }
            />

            <input
              type="file"
              accept="application/pdf"
              onChange={(e) =>
                setAdminNotePdf(e.target.files[0])
              }
            />

            <select
              value={adminNoteType}
              onChange={(e) =>
                setAdminNoteType(e.target.value)
              }
            >
              <option value="FREE">FREE</option>
              <option value="PREMIUM">PREMIUM</option>
            </select>

            <button
              className="btnLink"
              onClick={handleUploadPdf}
            >
              {uploadingPdf
                ? "Uploading..."
                : "Upload PDF"}
            </button>

            <button
              className="btnLink"
              onClick={handleSaveNote}
            >
              {editingNoteId
                ? "Update Note"
                : "Save Note"}
            </button>
          </div>

          <div className="adminStudentsGrid">
            {allNotes.map((note, index) => (
              <div className="studentCard" key={note.id || index}>
                <h4>{note.title}</h4>

                <p>📚 {note.category}</p>

                <p>📄 {note.pages} Pages</p>

                <p>⭐ {note.type}</p>

                <div className="studentActions">
                  <button
                    className="btnLink"
                    onClick={() => handleEditNote(note)}
                  >
                    Edit
                  </button>

                  <button
                    className="btnLink"
                    onClick={() =>
                      handleDeleteNote(note.id)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeAdminTab === "Current Affairs" && (
        <div className="adminStudentsSection">
          <h3>Current Affairs CMS</h3>

          <div className="dashboardCard">
            <input
              type="text"
              placeholder="Current Affairs Title"
              value={currentTitle}
              onChange={(e) =>
                setCurrentTitle(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Month"
              value={currentMonth}
              onChange={(e) =>
                setCurrentMonth(e.target.value)
              }
            />

            <input
              type="number"
              placeholder="Pages"
              value={currentPages}
              onChange={(e) =>
                setCurrentPages(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="PDF URL"
              value={manualCurrentPdfUrl}
              onChange={(e) =>
                setManualCurrentPdfUrl(e.target.value)
              }
            />

            <input
              type="file"
              accept="application/pdf"
              onChange={(e) =>
                setCurrentPdf(e.target.files[0])
              }
            />

            <select
              value={currentType}
              onChange={(e) =>
                setCurrentType(e.target.value)
              }
            >
              <option value="FREE">FREE</option>
              <option value="PREMIUM">PREMIUM</option>
            </select>

            <button
              className="btnLink"
              onClick={handleUploadCurrentPdf}
            >
              {uploadingCurrentPdf
                ? "Uploading..."
                : "Upload PDF"}
            </button>

            <button
              className="btnLink"
              onClick={handleSaveCurrentAffairs}
            >
              {editingCurrentId
                ? "Update Current Affairs"
                : "Save Current Affairs"}
            </button>
          </div>

          <div className="adminStudentsGrid">
            {allCurrentAffairs.map((item, index) => (
              <div className="studentCard" key={item.id || index}>
                <h4>{item.title}</h4>

                <p>📅 {item.month}</p>

                <p>📄 {item.pages} Pages</p>

                <p>⭐ {item.type}</p>

                <div className="studentActions">
                  <button
                    className="btnLink"
                    onClick={() =>
                      handleEditCurrentAffairs(item)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="btnLink"
                    onClick={() =>
                      handleDeleteCurrentAffairs(item.id)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeAdminTab === "Mock Tests" && (
        <div className="adminStudentsSection">
          <h3>Mock Test CMS</h3>

          <div className="dashboardCard">
            <input
              type="text"
              placeholder="Question"
              value={adminQuestion}
              onChange={(e) =>
                setAdminQuestion(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Option 1"
              value={adminOption1}
              onChange={(e) =>
                setAdminOption1(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Option 2"
              value={adminOption2}
              onChange={(e) =>
                setAdminOption2(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Option 3"
              value={adminOption3}
              onChange={(e) =>
                setAdminOption3(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Option 4"
              value={adminOption4}
              onChange={(e) =>
                setAdminOption4(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Correct Answer"
              value={adminAnswer}
              onChange={(e) =>
                setAdminAnswer(e.target.value)
              }
            />

            <select
              value={adminSubject}
              onChange={(e) =>
                setAdminSubject(e.target.value)
              }
            >
              <option value="CDP">CDP</option>
              <option value="Maths">Maths</option>
              <option value="EVS">EVS</option>
              <option value="Language">Language</option>
            </select>

            <select
              value={adminLevel}
              onChange={(e) =>
                setAdminLevel(e.target.value)
              }
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <select
  value={adminAccessPlan}
  onChange={(e) =>
    setAdminAccessPlan(e.target.value)
  }
>
  <option value="FREE">
    FREE ACCESS
  </option>

  <option value="PREMIUM">
    PREMIUM ACCESS
  </option>

  <option value="MENTORSHIP">
    MENTORSHIP ACCESS
  </option>
</select>

            <button
              className="btnLink"
              onClick={handleAddMockQuestion}
            >
              Add Question
            </button>
          </div>

          <div className="adminStudentsGrid">
            {mockQuestions.length > 0 ? (
              mockQuestions.map((question, index) => (
                <div
                  className="studentCard"
                  key={question.id || index}
                >
                  <h4>
                    {question.subject || "Mock Question"}
                  </h4>

                  <p>{question.question}</p>

                  <p>✅ Answer: {question.answer}</p>

                  <p>
                    🎚️ Level:{" "}
                    {question.level || "Easy"}
                  </p>

                  <div className="studentActions">
                    <button
                      className="btnLink"
                      onClick={() =>
                        handleDeleteMockQuestion(index)
                      }
                    >
                      Delete Question
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No mock questions found.</p>
            )}
          </div>
        </div>
      )}

{activeAdminTab === "Payments" && (
  <div className="adminStudentsSection">
    <h3>Payment Verification</h3>
    <p>Payment Verification has moved to Content Studio for the 1 App • 1 System admin flow.</p>
    <div className="studentActions">
      <button
        className="btnLink"
        onClick={() => navigate("/admin/content/payments")}
      >
        Open Payment Verification
      </button>
    </div>
  </div>
)}

{activeAdminTab === "Universal CMS" && (
  <div className="adminStudentsSection">
    <h3>🌍 Universal Content CMS</h3>

    <div className="dashboardCard proCard">
      <p>
        Upload and manage notes, current affairs,
        videos, PDFs, and premium learning content.
      </p>

      <div className="adminFormGrid">
        <input type="text" placeholder="Content Title" value={cmsTitle} onChange={(e) => setCmsTitle(e.target.value)} />
        <input type="text" placeholder="Subject" value={cmsSubject} onChange={(e) => setCmsSubject(e.target.value)} />
        <input type="text" placeholder="Course" value={cmsCourse} onChange={(e) => setCmsCourse(e.target.value)} />
        <input type="text" placeholder="Chapter" value={cmsChapter} onChange={(e) => setCmsChapter(e.target.value)} />
        <input type="text" placeholder="Month" value={cmsMonth} onChange={(e) => setCmsMonth(e.target.value)} />
        <input type="text" placeholder="Mentor Name" value={cmsMentorName} onChange={(e) => setCmsMentorName(e.target.value)} />
        <input type="text" placeholder="PDF / Drive URL" value={cmsFileUrl} onChange={(e) => setCmsFileUrl(e.target.value)} />
        <input type="text" placeholder="YouTube Video URL" value={cmsVideoUrl} onChange={(e) => setCmsVideoUrl(e.target.value)} />

        <select value={cmsSection} onChange={(e) => setCmsSection(e.target.value)}>
          <option value={CONTENT_SECTIONS.NOTES}>Notes</option>
          <option value={CONTENT_SECTIONS.CURRENT_AFFAIRS}>Current Affairs</option>
          <option value={CONTENT_SECTIONS.RECORDED_VIDEO}>Recorded Video</option>
          <option value={CONTENT_SECTIONS.COURSE_MATERIAL}>Course Material</option>
        </select>

        <select value={cmsContentType} onChange={(e) => setCmsContentType(e.target.value)}>
          <option value="PDF">PDF</option>
          <option value="VIDEO">VIDEO</option>
        </select>

        <select value={cmsPlanType} onChange={(e) => setCmsPlanType(e.target.value)}>
          <option value="FREE">FREE</option>
          <option value="BASIC">BASIC</option>
          <option value="PREMIUM">PREMIUM</option>
          <option value="MENTORSHIP">MENTORSHIP</option>
        </select>

        <button className="premiumBtn" onClick={handleSaveUniversalContent}>
          {editingCmsId ? "Update Content" : "Publish Content"}
        </button>
      </div>
    </div>

    <div className="universalContentList">
      <h4>📦 Published Universal Content</h4>
      <div
  style={{
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "18px",
    marginBottom: "20px",
  }}
>

  <div
  style={{
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "14px",
  }}
>
<div className="cmsGroupedOverview">

  <div className="cmsGroupBlock">
    <h4>📘 NOTES</h4>

    <div className="cmsMiniChips">
    <button
  className="premiumBtn smallBtn"
  onClick={() => {
    setCmsFilter("notes");
    setCmsPlanFilter("FREE");
  }}
>
  FREE (
  {
    universalContent.filter(
      (item) =>
        item.section === "notes" &&
        item.planType === "FREE"
    ).length
  }
  )
</button>

<button
  className="premiumBtn smallBtn"
  onClick={() => {
    setCmsFilter("notes");
    setCmsPlanFilter("BASIC");
  }}
>
  BASIC (
  {
    universalContent.filter(
      (item) =>
        item.section === "notes" &&
        item.planType === "BASIC"
    ).length
  }
  )
</button>

<button
  className="premiumBtn smallBtn"
  onClick={() => {
    setCmsFilter("notes");
    setCmsPlanFilter("PREMIUM");
  }}
>
  PREMIUM (
  {
    universalContent.filter(
      (item) =>
        item.section === "notes" &&
        item.planType === "PREMIUM"
    ).length
  }
  )
</button>

<button
  className="premiumBtn smallBtn"
  onClick={() => {
    setCmsFilter("notes");
    setCmsPlanFilter("MENTORSHIP");
  }}
>
  MENTORSHIP (
  {
    universalContent.filter(
      (item) =>
        item.section === "notes" &&
        item.planType === "MENTORSHIP"
    ).length
  }
  )
</button>
    </div>
  </div>

  <div className="cmsGroupBlock">
    <h4>📰 CURRENT AFFAIRS</h4>

    <div className="cmsMiniChips">
      <span>
        TOTAL (
        {
          universalContent.filter(
            (item) =>
              item.section === "currentAffairs"
          ).length
        }
        )
      </span>
    </div>
  </div>

  <div className="cmsGroupBlock">
    <h4>🎥 RECORDED VIDEOS</h4>

    <div className="cmsMiniChips">
      <span>
        TOTAL (
        {
          universalContent.filter(
            (item) =>
              item.section === "recordedVideo"
          ).length
        }
        )
      </span>
    </div>
  </div>

</div>
</div>
</div>

      <p style={{ color: "#111827", fontWeight: "900" }}>
        Total Universal Items: {Array.isArray(universalContent) ? universalContent.length : 0}
      </p>

      {contentLoading ? (
        <p>Loading content...</p>
      ) : Array.isArray(universalContent) && universalContent.length > 0 ? (
        <div className="universalContentGrid">
          {universalContent
.filter((item) => {
  const sectionMatch =
    cmsFilter === "ALL"
      ? true
      : item.section === cmsFilter;

  const planMatch =
    cmsPlanFilter === "ALL"
      ? true
      : item.planType === cmsPlanFilter;

  return sectionMatch && planMatch;
})
.map((item) => (
            <div className="universalContentCard" key={item.id}>
              <div
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#0f172a",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "900",
    width: "fit-content",
  }}
>
  {(item.section || "CONTENT").toUpperCase()} •{" "}
  {(item.planType || "FREE").toUpperCase()} •{" "}
  {(item.contentType || "PDF").toUpperCase()}
</div>
              <strong>{item.title || "Untitled Content"}</strong>

              <p>Section: {item.section || "—"}</p>
              <p>Subject: {item.subject || "—"}</p>
              <p>Month: {item.month || "—"}</p>
              <p>Plan: {item.planType || "FREE"}</p>
              <p>Type: {item.contentType || "—"}</p>
              <p>Source: {item.sourceType || "—"}</p>
              <p>Status: {item.status || "PUBLISHED"}</p>

              <button
                className="premiumBtn smallBtn"
                onClick={() => {
                  setEditingCmsId(item.id);
                  setCmsTitle(item.title || "");
                  setCmsSubject(item.subject || "");
                  setCmsCourse(item.course || "");
                  setCmsChapter(item.chapter || "");
                  setCmsMonth(item.month || "");
                  setCmsMentorName(item.mentorName || "");
                  setCmsFileUrl(item.fileUrl || "");
                  setCmsVideoUrl(item.videoUrl || "");
                  setCmsSection(item.section || CONTENT_SECTIONS.NOTES);
                  setCmsContentType(item.contentType || "PDF");
                  setCmsPlanType(item.planType || PLAN_TYPES.FREE);

                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
              >
                ✏️ Edit
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontWeight: "800" }}>
          No universal content uploaded yet.
        </p>
      )}
    </div>
  </div>
)}

    </div>
  );
}