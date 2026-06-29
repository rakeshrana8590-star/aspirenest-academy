import React, { useState } from "react";

export default function ExperienceCarousel({
  items = [],
  renderItem,
  empty = null,
  className = "",
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!items.length) {
    return empty || null;
  }

  const activeItem = items[activeIndex] || items[0];

  const goPrev = () => {
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  };

  const goNext = () => {
    setActiveIndex((current) => (current + 1) % items.length);
  };

  return (
    <div className={`experienceCarousel ${className}`.trim()}>
      <div className="experienceCarouselStage">
        {renderItem ? renderItem(activeItem, activeIndex) : activeItem}
      </div>

      {items.length > 1 ? (
        <div className="experienceCarouselControls">
          <button type="button" onClick={goPrev} aria-label="Previous item">‹</button>

          <div className="experienceCarouselDots">
            {items.map((item, index) => (
              <button
                type="button"
                key={item.id || index}
                className={index === activeIndex ? "isActive" : ""}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show item ${index + 1}`}
              />
            ))}
          </div>

          <button type="button" onClick={goNext} aria-label="Next item">›</button>
        </div>
      ) : null}
    </div>
  );
}
