import React, { useEffect, useMemo, useState } from "react";

function getRemaining(targetAt) {
  const target = targetAt ? new Date(targetAt).getTime() : 0;
  const diff = Math.max(0, target - Date.now());

  return {
    total: diff,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export default function ExperienceCountdown({
  targetAt,
  label = "Starts in",
  completedLabel = "Started",
  className = "",
}) {
  const initial = useMemo(() => getRemaining(targetAt), [targetAt]);
  const [remaining, setRemaining] = useState(initial);

  useEffect(() => {
    setRemaining(getRemaining(targetAt));

    const timer = window.setInterval(() => {
      setRemaining(getRemaining(targetAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [targetAt]);

  const isComplete = remaining.total <= 0;

  return (
    <div className={`experienceCountdown ${className}`.trim()}>
      <span className="experienceCountdownLabel">
        {isComplete ? completedLabel : label}
      </span>

      <div className="experienceCountdownGrid">
        <div><strong>{remaining.days}</strong><span>Days</span></div>
        <div><strong>{remaining.hours}</strong><span>Hours</span></div>
        <div><strong>{remaining.minutes}</strong><span>Min</span></div>
        <div><strong>{remaining.seconds}</strong><span>Sec</span></div>
      </div>
    </div>
  );
}
