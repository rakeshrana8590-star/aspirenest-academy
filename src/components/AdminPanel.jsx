import { useState } from "react";import {

  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
export default function AdminPanel({
  isAdmin,
  activeAdminTab,
  setActiveAdminTab,
  students,
  enquiries,
  leaderboard,
  handlePremiumControl,
  approvePaymentRequest,

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
  handleAddMockQuestion,
  mockQuestions,
  handleDeleteMockQuestion,

  paymentHistory,
  paymentRequests,
  loadPaymentRequests,

  announcementTitle,
  setAnnouncementTitle,
  announcementMessage,
  setAnnouncementMessage,
  announcements,
  handleAddAnnouncement,
  handleDeleteAnnouncement,
}) {
  if (!isAdmin()) return null;
  const [adminProofs, setAdminProofs] = useState({});

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

    <button
      className="btnLink"
      onClick={loadPaymentRequests}
    >
      Refresh Payment Requests
    </button>

    <div className="adminStudentsGrid">
      {paymentRequests && paymentRequests.length > 0 ? (
        paymentRequests.map((payment, index) => (
          <div
            className="studentCard"
            key={payment.id || index}
          >
            <h4>{payment.studentEmail || payment.email || "Student"}</h4>

            <p>💰 Amount: ₹{payment.amount}</p>
            <p>📦 Plan: {payment.planName || payment.plan || "Premium Plan"}</p>
            <p>🧾 Order ID: {payment.orderId}</p>
            <p>📌 Status: {payment.status}</p>

            {payment.studentProof && (
              <p>
                📝 Student Proof: {payment.studentProof}
              </p>
            )}

            <p>
              🕒{" "}
              {payment.createdAt?.toDate
                ? payment.createdAt.toDate().toLocaleString()
                : payment.createdAt || "Recently"}
            </p>
{payment.status !== "approved" && (
  <textarea
    value={adminProofs[payment.id] || ""}
    onChange={(e) =>
      setAdminProofs({
        ...adminProofs,
        [payment.id]: e.target.value,
      })
    }
    placeholder="Admin received payment message / UTR paste karo"
    rows="3"
    style={{
      width: "100%",
      marginTop: "12px",
      padding: "12px",
      borderRadius: "12px",
      border: "1px solid #ddd",
      resize: "none",
    }}
  />
)}
            {payment.status === "approved" ? (
  <div
    style={{
      marginTop: "12px",
      padding: "12px 16px",
      borderRadius: "14px",
      background: "#dcfce7",
      color: "#166534",
      fontWeight: "800",
      display: "inline-block",
    }}
  >
    ✅ Premium Activated
  </div>
) : (
<button
  className="btnLink"
  onClick={async () => {
    const adminProof = adminProofs[payment.id] || "";
    const studentProof = payment.studentProof || "";

    if (!adminProof.trim()) {
      alert("Admin received payment message / UTR paste karo.");
      return;
    }

    const studentText = studentProof.toLowerCase();
const adminText = adminProof.toLowerCase();

const utrMatch =
  studentText.match(/\d{6,}/)?.[0] ===
  adminText.match(/\d{6,}/)?.[0];

const amountMatch =
  studentText.includes(`₹${payment.amount}`) ||
  studentText.includes(`${payment.amount}`);

  if (!utrMatch || !amountMatch) {
    await updateDoc(doc(db, "paymentRequests", payment.id), {
      status: "review_required",
      reviewRequired: true,
      reviewReason: "UTR or amount mismatch",
      reviewedAt: new Date(),
    });
  
    alert(
      "Mismatch detected. Request moved to Review Required."
    );
  
    return;
  }

    approvePaymentRequest(payment);
  }}
>
  Auto Match & Approve
</button>
)}
{adminProofs[payment.id] && payment.studentProof && (
  <div
    style={{
      marginTop: "12px",
      padding: "12px",
      borderRadius: "12px",
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
    }}
  >
    <p style={{ fontWeight: "700", marginBottom: "8px" }}>
      🔍 Verification Compare
    </p>

    <p>
      <strong>Student:</strong> {payment.studentProof}
    </p>

    <p style={{ marginTop: "8px" }}>
      <strong>Admin:</strong> {adminProofs[payment.id]}
    </p>

    {(() => {
  const studentText = payment.studentProof.toLowerCase();
  const adminText = adminProofs[payment.id].toLowerCase();

  const studentUtr = studentText.match(/\d{6,}/)?.[0];
  const adminUtr = adminText.match(/\d{6,}/)?.[0];

  const utrMatch = studentUtr === adminUtr;

  const amountMatch =
    studentText.includes(`₹${payment.amount}`) ||
    studentText.includes(`${payment.amount}`);

  return utrMatch && amountMatch;
})() ? (
  <div
    style={{
      marginTop: "10px",
      color: "#166534",
      fontWeight: "800",
    }}
  >
    ✅ Possible Match Found
  </div>
) : (
      <div
        style={{
          marginTop: "10px",
          color: "#dc2626",
          fontWeight: "800",
        }}
      >
        ❌ Verification Mismatch
      </div>
    )}
  </div>
)}
          </div>
        ))
      ) : (
        <p>No payment requests found.</p>
      )}
    </div>
  </div>
)}

{activeAdminTab === "Announcements" && (
  <div className="adminStudentsSection">
    <h3>Announcements CMS</h3>

    <div className="dashboardCard">
      <input
        type="text"
        placeholder="Announcement Title"
        value={announcementTitle}
        onChange={(e) =>
          setAnnouncementTitle(e.target.value)
        }
      />

      <textarea
        placeholder="Write announcement message..."
        value={announcementMessage}
        onChange={(e) =>
          setAnnouncementMessage(e.target.value)
        }
      />

      <button
        className="btnLink"
        onClick={handleAddAnnouncement}
      >
        Publish Announcement
      </button>
    </div>

    <div className="adminStudentsGrid">
      {announcements.length > 0 ? (
        announcements.map((item, index) => (
          <div
            className="studentCard"
            key={item.id || index}
          >
            <h4>{item.title}</h4>

            <p>{item.message}</p>

            <button
              className="btnLink"
              onClick={() =>
                handleDeleteAnnouncement(item.id)
              }
            >
              Delete
            </button>
          </div>
        ))
      ) : (
        <p>No announcements yet.</p>
      )}
    </div>
  </div>
)}
    </div>
  );
}