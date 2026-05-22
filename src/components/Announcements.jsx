export default function Announcements({ announcements = [] }) {
  return (
    <section className="announcementsSection">
      <div className="announcementHeader">
        <span className="badge">Latest Updates</span>

        <h2>Announcements</h2>

        <p className="sectionText">
          Important course updates, notices and latest platform announcements.
        </p>
      </div>

      <div className="adminStudentsGrid">
        {announcements.length > 0 ? (
          announcements.map((item, index) => (
            <div className="studentCard" key={item.id || index}>
              <h4>{item.title || "Announcement"}</h4>

              <p>{item.message || "No message available."}</p>

              <p>
                🕒{" "}
                {item.createdAt?.toDate
                  ? item.createdAt.toDate().toLocaleString()
                  : "Recently"}
              </p>
            </div>
          ))
        ) : (
          <div className="studentCard">
            <h4>No announcements yet</h4>
            <p>Latest updates will appear here soon.</p>
          </div>
        )}
      </div>
    </section>
  );
}