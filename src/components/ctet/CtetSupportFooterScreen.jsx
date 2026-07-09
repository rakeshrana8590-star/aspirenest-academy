import React, { useState } from "react";

const OFFICIAL_EMAIL = "aspirenestacademy@gmail.com";
const OFFICIAL_WHATSAPP_NUMBER = "917304256002";
const OFFICIAL_WHATSAPP_DISPLAY = "+91 73042 56002";
const EMAIL_SUPPORT_SUBJECT = "AspireNest Academy Support & Access Guidance";
const EMAIL_SUPPORT_BODY = [
  "Dear AspireNest Academy Team,",
  "",
  "I need guidance regarding CTET/TET preparation and access options.",
  "",
  "My details are:",
  "",
  "Name:",
  "Registered Email:",
  "Mobile Number:",
  "Support Required: Plan / Payment / Mock Test / Notes / Videos / Roadmap / Individual Access",
  "Message:",
  "",
  "Please guide me with the most suitable plan or access option.",
  "",
  "Thank you.",
].join("\n");

function buildWhatsAppUrl(message) {
  return `https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function buildEmailUrl(subject = "AspireNest Academy Support", body = "") {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: OFFICIAL_EMAIL,
    su: subject,
    body,
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
}

function openUrl(url) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

const supportRows = [
  {
    icon: "✉",
    tone: "mail",
    title: "Email Support",
    text: OFFICIAL_EMAIL,
    action: "Write to us",
    url: buildEmailUrl(EMAIL_SUPPORT_SUBJECT, EMAIL_SUPPORT_BODY),
  },
  {
    icon: "☘",
    tone: "whatsapp",
    title: "WhatsApp Support",
    text: OFFICIAL_WHATSAPP_DISPLAY,
    action: "Chat Now",
    url: buildWhatsAppUrl(
      "Hello AspireNest Academy,\nI need support for CTET/TET preparation, plan, payment, or access.\nPlease guide me."
    ),
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
  {
    question: "How do I access premium classes?",
    answer:
      "First talk to the mentor on WhatsApp. After payment/access confirmation, AspireNest admin will activate your plan, module, or individual access.",
  },
  {
    question: "Are mock tests included in premium?",
    answer:
      "Yes, premium access can include mock tests. Individual mock test access can also be given manually if required.",
  },
  {
    question: "Can I use AspireNest on mobile?",
    answer:
      "Yes. AspireNest is built for mobile, tablet, laptop, and desktop. Use the same login account on your device.",
  },
  {
    question: "How do I contact support?",
    answer:
      "Use the WhatsApp support button or fill the support form. Your details will open directly in WhatsApp for quick guidance.",
  },
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
  const [activeFaq, setActiveFaq] = useState(-1);

  function handleSubmitEnquiry() {
    const whatsappMessage = [
      "Hello Dr. Varsha Ma’am / AspireNest Academy,",
      "",
      "I need guidance/support for CTET/TET preparation.",
      "",
      `Name: ${fullName || "Not entered"}`,
      `Mobile: ${mobile || "Not entered"}`,
      `Email: ${contactEmail || "Not entered"}`,
      `Support Needed: Plan / Payment / Access / Mock Test / Notes / Videos / Roadmap`,
      `Message: ${message || "Please guide me for the best plan/access."}`,
      "",
      "Please guide me on WhatsApp.",
    ].join("\n");

    openUrl(buildWhatsAppUrl(whatsappMessage));

    if (typeof onSubmit === "function") {
      onSubmit();
    }
  }

  function handleContactSupport() {
    const whatsappMessage = [
      "Hello AspireNest Academy,",
      "I still have questions about CTET/TET preparation, plan, payment, or access.",
      "Please guide me.",
    ].join("\n");

    openUrl(buildWhatsAppUrl(whatsappMessage));
  }

  return (
    <section className="ctetS5LockedScreen" id="contact">
      <div className="ctetS5LockedShell">
        <div className="ctetS5LockedTopGrid">
          <article className="ctetS5LockedCard ctetS5LockedEnquiry">
            <div className="ctetS5LockedTitle">
              <span>☊</span>
              <div>
                <h3>Support & Enquiry</h3>
                <p>Plan, payment, access, notes, mock tests, videos, or roadmap — ask before you choose.</p>
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
                <b>Your Requirement</b>
                <div>
                  <i>▱</i>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Example: I need only mock test access / full plan / notes / video class / roadmap guidance..."
                  />
                </div>
              </label>
            </div>

            <button className="ctetS5LockedSubmit" type="button" onClick={handleSubmitEnquiry}>
              Send on WhatsApp <span>✈</span>
            </button>
          </article>

          <article className="ctetS5LockedCard ctetS5LockedSupport">
            <div className="ctetS5LockedTitle">
              <span>🛡</span>
              <div>
                <h3>AspireNest Support</h3>
                <p>
                  Before choosing any plan or access, talk to your mentor once.
                  We help you choose the right access.
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
              {faqItems.map((faq, index) => {
                const isOpen = activeFaq === index;

                return (
                  <div className="ctetS5LockedFaqItem" key={faq.question}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setActiveFaq(isOpen ? -1 : index)}
                    >
                      {faq.question}
                      <span>{isOpen ? "⌃" : "⌄"}</span>
                    </button>

                    {isOpen ? (
                      <p className="ctetS5LockedFaqAnswer">{faq.answer}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="ctetS5LockedQuestionBox">
              <div>
                <strong>Still have questions?</strong>
                <p>Ask on WhatsApp before choosing a plan or access.</p>
              </div>
              <button type="button" onClick={handleContactSupport}>
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
