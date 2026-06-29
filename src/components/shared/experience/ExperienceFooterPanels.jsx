import React from "react";

export default function ExperienceFooterPanels({
  id,
  support,
  enquiryTitle,
  enquiryContent,
  faqTitle,
  faqs = [],
}) {
  return (
    <section className="experienceFooterPanels" id={id}>
      <div className="experienceFooterPanelCard">
        <span>{support?.badge}</span>
        <h3>{support?.title}</h3>
        <p>{support?.description}</p>
        <strong>{support?.strong}</strong>
      </div>

      <div className="experienceFooterPanelCard experienceEnquiryPanel">
        <span>GET IN TOUCH</span>
        <h3>{enquiryTitle}</h3>
        {enquiryContent}
      </div>

      <div className="experienceFooterPanelCard">
        <span>FAQ</span>
        <h3>{faqTitle}</h3>
        {faqs.map((faq) => (
          <p key={faq}>▶ {faq}</p>
        ))}
      </div>
    </section>
  );
}
