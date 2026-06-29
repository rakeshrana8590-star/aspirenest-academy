import React from "react";

export default function ExperienceFooter({
  brand,
  description,
  links = [],
  contact = [],
  copyright,
}) {
  return (
    <footer className="experienceFooter">
      <div className="experienceFooterGrid">
        <div className="experienceFooterBrand">
          <h2>{brand}</h2>
          <p>{description}</p>
        </div>

        <div className="experienceFooterLinks">
          <h3>Quick Links</h3>
          {links.map((link) => (
            <button type="button" key={link.label} onClick={link.onClick}>
              {link.label}
            </button>
          ))}
        </div>

        <div className="experienceFooterContact">
          <h3>Contact</h3>
          {contact.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </div>

      <div className="experienceFooterBottom">
        {copyright}
      </div>
    </footer>
  );
}
