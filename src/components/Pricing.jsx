export default function Pricing({ handlePremiumPurchase }) {
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
      button: "Start Free",
      href: "#resources",
    },
    {
      badge: "BASIC",
      title: "Topic-wise Courses",
      price: "₹499",
      features: [
        ["🎯", "Topic Modules"],
        ["📚", "PYQ Practice"],
        ["📝", "Mini Tests"],
      ],
      button: "Join Now",
      href: "#contact",
    },
    {
      badge: "MOST POPULAR",
      title: "Premium Batch",
      price: "₹1499",
      features: [
        ["🎥", "Live Classes"],
        ["📘", "Complete Notes"],
        ["📝", "Full Mock Tests"],
        ["🏆", "Performance Tracking"],
      ],
      button: "Get Premium",
      action: handlePremiumPurchase,
      featured: true,
    },
    {
      badge: "MENTORSHIP",
      title: "Personal Mentorship",
      price: "₹2999",
      features: [
        ["👨‍🏫", "Mentor Guidance"],
        ["📈", "Progress Analysis"],
        ["🎯", "Strategy Sessions"],
        ["📞", "Priority Support"],
      ],
      button: "Apply Now",
      href: "#contact",
    },
  ];

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

            {plan.action ? (
              <button className="btnLink" onClick={plan.action}>
                {plan.button}
              </button>
            ) : (
              <a href={plan.href} className="btnLink">
                {plan.button}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}