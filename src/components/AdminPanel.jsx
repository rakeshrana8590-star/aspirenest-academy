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
  handleAddMockQuestion,
  mockQuestions,
  handleDeleteMockQuestion,

  paymentHistory,

  announcementTitle,
  setAnnouncementTitle,
  announcementMessage,
  setAnnouncementMessage,
  announcements,
  handleAddAnnouncement,
  handleDeleteAnnouncement,
}) {
  if (!isAdmin()) return null;

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
          <h3>Payment History</h3>

          <div className="adminStudentsGrid">
            {paymentHistory.length > 0 ? (
              paymentHistory.map((payment, index) => (
                <div
                  className="studentCard"
                  key={payment.id || index}
                >
                  <h4>{payment.email}</h4>

                  <p>💰 ₹{payment.amount}</p>

                  <p>⭐ {payment.plan}</p>

                  <p>
                    🕒{" "}
                    {payment.createdAt?.toDate
                      ? payment.createdAt
                          .toDate()
                          .toLocaleString()
                      : "Recently"}
                  </p>
                </div>
              ))
            ) : (
              <p>No payments found.</p>
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