export default function Pricing({ handlePremiumPurchase }) {
    return (
      <section id="pricing" className="pricingPro">
        <h2>Choose Your Learning Plan</h2>
  
        <p className="sectionText">
          Flexible pricing for every CTET/TET aspirant.
        </p>
  
        <div className="pricingGrid">
          <div className="pricingCard">
            <span className="priceBadge">FREE</span>
  
            <h3>Starter</h3>
  
            <h1>₹0</h1>
  
            <ul>
              <li>📘 Sample Notes</li>
              <li>📝 1 Mock Test</li>
              <li>📅 Study Plan</li>
            </ul>
  
            <a href="#resources" className="btnLink">
              Start Free
            </a>
          </div>
  
          <div className="pricingCard">
            <span className="priceBadge orange">BASIC</span>
  
            <h3>Topic-wise Courses</h3>
  
            <h1>₹499</h1>
  
            <ul>
              <li>🎯 Topic Modules</li>
              <li>📚 PYQ Practice</li>
              <li>📝 Mini Tests</li>
            </ul>
  
            <a href="#contact" className="btnLink">
              Join Now
            </a>
          </div>
  
          <div className="pricingCard featuredPrice">
            <span className="priceBadge premium">MOST POPULAR</span>
  
            <h3>Premium Batch</h3>
  
            <h1>₹1499</h1>
  
            <ul>
              <li>🎥 Live Classes</li>
              <li>📘 Complete Notes</li>
              <li>📝 Full Mock Tests</li>
              <li>🏆 Performance Tracking</li>
            </ul>
  
            <button className="btnLink" onClick={handlePremiumPurchase}>
              Get Premium
            </button>
          </div>
  
          <div className="pricingCard darkPrice">
            <span className="priceBadge darkTag">MENTORSHIP</span>
  
            <h3>Personal Mentorship</h3>
  
            <h1>₹2999</h1>
  
            <ul>
              <li>👨‍🏫 Mentor Guidance</li>
              <li>📈 Progress Analysis</li>
              <li>🎯 Strategy Sessions</li>
              <li>📞 Priority Support</li>
            </ul>
  
            <a href="#contact" className="btnLink">
              Apply Now
            </a>
          </div>
        </div>
      </section>
    );
  }