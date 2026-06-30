import React, { useState } from "react";

const supportRows = [
  {
    icon: "✉",
    tone: "mail",
    title: "Email Support",
    text: "support@aspirenestacademy.com",
    action: "Write to us",
    url: "mailto:support@aspirenestacademy.com",
  },
  {
    icon: "☘",
    tone: "whatsapp",
    title: "WhatsApp Support",
    text: "+91 98765 43210",
    action: "Chat Now",
    url: "https://wa.me/919876543210",
  },
  {
    icon: "⌖",
    tone: "location",
    title: "Our Location",
    text: "India",
    action: "View on Map",
    url: "https://maps.google.com/?q=India",
  },
  {
    icon: "◷",
    tone: "time",
    title: "Typical Response",
    text: "We typically reply within a few minutes during working hours.",
    action: "",
    url: "",
  },
];

const faqItems = [
  "How do I access premium classes?",
  "Are mock tests included in premium?",
  "Can I use AspireNest on mobile?",
  "How do I contact support?",
];

const footerColumns = [
  {
    title: "Quick Links",
    links: [
      ["Courses", "/ctet-tet/courses"],
      ["Notes", "/ctet-tet/notes"],
      ["Mock Tests", "/ctet-tet/mock-tests"],
    ],
  },
  {
    title: "Explore",
    links: [
      ["Videos", "/ctet-tet/videos"],
      ["Roadmaps", "/ctet-tet/roadmaps"],
      ["Pricing", "/ctet-tet/pricing"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Terms & Conditions", ""],
      ["Privacy Policy", ""],
      ["Refund Policy", ""],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Us", ""],
      ["Careers", ""],
      ["Contact Us", ""],
    ],
  },
];

function openUrl(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function CtetSupportFooterScreen({
  fullName,
  setFullName,
  mobile,
  setMobile,
  contactEmail,
  setContactEmail,
  onSubmit,
  navigate,
}) {
  const [message, setMessage] = useState("");

  return (
    <section className="ctetS5LockedScreen" id="contact">
      <div className="ctetS5LockedShell">
        <div className="ctetS5LockedTopGrid">
          <article className="ctetS5LockedCard ctetS5LockedEnquiry">
            <div className="ctetS5LockedTitle">
              <span>☊</span>
              <div>
                <h3>Support & Enquiry</h3>
                <p>We’re here to help you on your preparation journey.</p>
              </div>
            </div>

            <div className="ctetS5LockedForm">
              <label>
                <b>Full Name</b>
                <div>
                  <i>♙</i>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
              </label>

              <label>
                <b>Mobile Number</b>
                <div>
                  <i>☏</i>
                  <input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Enter your mobile number"
                  />
                </div>
              </label>

              <label>
                <b>Email Address</b>
                <div>
                  <i>✉</i>
                  <input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </label>

              <label className="ctetS5LockedMessage">
                <b>Message</b>
                <div>
                  <i>▱</i>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                  />
                </div>
              </label>
            </div>

            <button className="ctetS5LockedSubmit" type="button" onClick={onSubmit}>
              Submit Enquiry <span>✈</span>
            </button>
          </article>

          <article className="ctetS5LockedCard ctetS5LockedSupport">
            <div className="ctetS5LockedTitle">
              <span>🛡</span>
              <div>
                <h3>AspireNest Support</h3>
                <p>
                  Have questions about our courses, notes, mock tests, roadmaps,
                  payments or access? Our team is ready to help.
                </p>
              </div>
            </div>

            <div className="ctetS5LockedSupportRows">
              {supportRows.map((row) => (
                <button
                  type="button"
                  key={row.title}
                  className="ctetS5LockedSupportRow"
                  onClick={() => openUrl(row.url)}
                  disabled={!row.url}
                >
                  <i className={`is-${row.tone}`}>{row.icon}</i>
                  <div>
                    <strong>{row.title}</strong>
                    <small>{row.text}</small>
                  </div>
                  {row.action && <b>{row.action} ›</b>}
                </button>
              ))}
            </div>
          </article>

          <article className="ctetS5LockedCard ctetS5LockedFaq">
            <div className="ctetS5LockedTitle">
              <span>?</span>
              <div>
                <h3>Frequently Asked Questions</h3>
              </div>
            </div>

            <div className="ctetS5LockedFaqList">
              {faqItems.map((faq) => (
                <button type="button" key={faq}>
                  {faq}
                  <span>⌄</span>
                </button>
              ))}
            </div>

            <div className="ctetS5LockedQuestionBox">
              <div>
                <strong>Still have questions?</strong>
                <p>Our support experts are happy to help.</p>
              </div>
              <button type="button" onClick={() => openUrl("mailto:support@aspirenestacademy.com")}>
                ☊ Contact Support
              </button>
            </div>
          </article>
        </div>

        <footer className="ctetS5LockedFooter">
          <div className="ctetS5LockedBrand">
            <img src="/logo-header.png" alt="AspireNest Academy" />
            <p>
              India’s Most Trusted Platform for CTET/TET Preparation. Smart
              Learning. Real Results.
            </p>
            <div className="ctetS5LockedSocials">
              <button type="button">▶</button>
              <button type="button">✈</button>
              <button type="button">◎</button>
              <button type="button">f</button>
            </div>
          </div>

          <div className="ctetS5LockedLinks">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h4>{column.title}</h4>
                {column.links.map(([label, url]) => (
                  <button
                    type="button"
                    key={label}
                    onClick={() => {
                      if (url) navigate(url);
                    }}
                  >
                    <span>›</span> {label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="ctetS5LockedNewsletter">
            <h4>✉ Stay Ahead. Stay Updated.</h4>
            <p>Subscribe for exam updates, new batches and tips to ace CTET/TET.</p>
            <div>
              <span>✉</span>
              <input placeholder="Enter your email" />
              <button type="button">✈</button>
            </div>
          </div>
        </footer>

        <div className="ctetS5LockedBottom">
          <span>© 2025 AspireNest Academy. All rights reserved.</span>
          <strong>✦ Made with ❤️ for Aspirants ✦</strong>
          <span>Empowering Educators. Shaping Futures.</span>
        </div>
      </div>
    </section>
  );
}
