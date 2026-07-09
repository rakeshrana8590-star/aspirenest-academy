import React, { useMemo, useState } from "react";

const OFFICIAL_WHATSAPP_NUMBER = "917304256002";

const accessOptions = [
  "Full Premium Plan",
  "Mock Test Only",
  "Notes/PDF Only",
  "Videos/Live Classes",
  "Roadmap / Study Plan",
  "Individual Test / Note / Video",
  "Payment / Access Help",
];

function buildWhatsAppUrl(message) {
  return `https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function CtetPricingMentorGuidance() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [accessNeed, setAccessNeed] = useState("Full Premium Plan");
  const [details, setDetails] = useState("");

  const whatsappUrl = useMemo(() => {
    const message = [
      "Hello Dr. Varsha Ma’am / AspireNest Academy,",
      "",
      "I need guidance before choosing AspireNest access.",
      "",
      `Name: ${name || "Not entered"}`,
      `Login Email: ${email || "Not entered"}`,
      `Mobile: ${mobile || "Not entered"}`,
      `Required Access: ${accessNeed}`,
      `Subject / Chapter / Item / Doubt: ${details || "Please guide me for the best plan/access."}`,
      "",
      "Please guide me with the most suitable plan or access option.",
    ].join("\n");

    return buildWhatsAppUrl(message);
  }, [name, email, mobile, accessNeed, details]);

  return (
    <section className="ctetPricingMentorGuide" aria-label="Mentor guidance before choosing plan">
      <div className="ctetPricingMentorGuideText">
        <span>Mentor Guidance First</span>
        <h3>Not sure what to unlock?</h3>
        <p>
          Before choosing any plan, mock test, notes, videos, roadmap, or individual access,
          talk to your mentor once and get the right guidance.
        </p>

        <div className="ctetPricingMentorGuideChips">
          <b>Full Plan</b>
          <b>Mock Test</b>
          <b>Notes</b>
          <b>Videos</b>
          <b>Roadmap</b>
          <b>Individual Access</b>
        </div>
      </div>

      <div className="ctetPricingMentorGuideForm">
        <label>
          <b>Name</b>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" />
        </label>

        <label>
          <b>Login Email</b>
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter registered email" />
        </label>

        <label>
          <b>Mobile</b>
          <input value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="Enter mobile number" />
        </label>

        <label>
          <b>Access Needed</b>
          <select value={accessNeed} onChange={(event) => setAccessNeed(event.target.value)}>
            {accessOptions.map((option) => (
              <option value={option} key={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="ctetPricingMentorGuideWide">
          <b>Subject / Chapter / Item / Doubt</b>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Example: I need only CDP mock test access / notes for Chapter 1 to 4 / full premium plan guidance..."
          />
        </label>

        <button
          className="ctetPricingMentorGuideCta"
          type="button"
          onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")}
        >
          Open WhatsApp for Guidance <span>›</span>
        </button>
      </div>
    </section>
  );
}
