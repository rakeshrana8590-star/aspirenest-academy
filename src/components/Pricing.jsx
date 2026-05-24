import { useState } from "react";

export default function Pricing({ createPaymentRequest, setActiveSection }) {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      badge: "FREE",
      title: "Starter",
      price: "₹0",
      features: [
        ["📘", "Sample Notes"],
        ["📝", "1 Mock Test"],
        ["📅", "Study Plan"],
      ],
      unlocks: ["FREE NOTES", "Demo Mock Test", "Free Resources"],
      button: "Start Free",
    },
    {
      badge: "BASIC",
      title: "Topic-wise Courses",
      price: "₹499",
      amount: 499,
      features: [
        ["🎯", "Topic Modules"],
        ["📚", "PYQ Practice"],
        ["📝", "Mini Tests"],
      ],
      unlocks: ["BASIC NOTES", "Topic-wise PDFs", "Mini Practice Sets"],
      button: "Join Now",
    },
    {
      badge: "MOST POPULAR",
      title: "Premium Batch",
      price: "₹1499",
      amount: 1499,
      features: [
        ["🎥", "Live Classes"],
        ["📘", "Complete Notes"],
        ["📝", "Full Mock Tests"],
        ["🏆", "Performance Tracking"],
      ],
      unlocks: [
        "PREMIUM LIBRARY",
        "Full Mock Test Series",
        "Premium Current Affairs",
        "AI Dashboard",
      ],
      button: "Get Premium",
      featured: true,
    },
    {
      badge: "MENTORSHIP",
      title: "Personal Mentorship",
      price: "₹2999",
      amount: 2999,
      features: [
        ["👨‍🏫", "Mentor Guidance"],
        ["📈", "Progress Analysis"],
        ["🎯", "Strategy Sessions"],
        ["📞", "Priority Support"],
      ],
      unlocks: [
        "Everything in Premium",
        "MENTORSHIP VAULT",
        "Personal Strategy Sheets",
        "Priority Support",
      ],
      button: "Apply Now",
    },
  ];

  const handleFreeStart = () => {
    setActiveSection(null);

    setTimeout(() => {
      document.querySelector(".freeResources")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleBuyPlan = (plan) => {
    if (plan.amount) {
      createPaymentRequest(plan.title, plan.amount);
    } else {
      handleFreeStart();
    }
  };

  return (
    <section id="pricing" className="pricingPro applePricing">
      <div className="pricingHeader">
        <h2>Choose Your Learning Plan</h2>
        <p>Flexible pricing for every CTET/TET aspirant.</p>
      </div>

      <div className="pricingGrid">
        {plans.map((plan) => (
          <div
            className={`pricingCard ${plan.featured ? "featuredPrice" : ""}`}
            key={plan.title}
          >
            <span className="priceBadge">{plan.badge}</span>

            <h3>{plan.title}</h3>
            <h1>{plan.price}</h1>

            <ul>
              {plan.features.map(([icon, text]) => (
                <li key={text}>
                  <span className="featureIcon">{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <button
              className="btnLink outlinePlanBtn"
              onClick={() => setSelectedPlan(plan)}
            >
              View Details
            </button>

            <button className="btnLink" onClick={() => handleBuyPlan(plan)}>
              {plan.button}
            </button>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="planModalOverlay">
          <div className="planModal">
            <button
              className="planModalClose"
              onClick={() => setSelectedPlan(null)}
            >
              ×
            </button>

            <span className="priceBadge">{selectedPlan.badge}</span>
            <h2>{selectedPlan.title}</h2>
            <h1>{selectedPlan.price}</h1>

            <h3>What you get</h3>
            <ul>
              {selectedPlan.features.map(([icon, text]) => (
                <li key={text}>
                  {icon} {text}
                </li>
              ))}
            </ul>

            <h3>Unlocks</h3>
            <ul>
              {selectedPlan.unlocks.map((item) => (
                <li key={item}>✅ {item}</li>
              ))}
            </ul>

            <button
              className="btnLink"
              onClick={() => {
                handleBuyPlan(selectedPlan);
                setSelectedPlan(null);
              }}
            >
              {selectedPlan.button}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}