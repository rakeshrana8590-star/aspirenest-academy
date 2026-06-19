import { Link } from "react-router-dom";

const academySystems = [
  {
    title: "CTET/TET Preparation",
    text: "AspireNest currently starts with a focused CTET/TET learning track, built for students preparing seriously for teacher eligibility exams.",
    metric: "Live",
  },
  {
    title: "More Learning Tracks Coming",
    text: "The academy is designed to grow beyond one exam, so future subjects, courses, and preparation programs can be added without breaking the system.",
    metric: "Next",
  },
  {
    title: "Guided Digital Learning",
    text: "Students get a clear path through notes, classes, practice, mock tests, progress, and revision instead of scattered links and confusion.",
    metric: "Clear",
  },
];

const studentJourney = [
  "Enter the CTET/TET preparation section",
  "Study subject-wise notes, classes, and resources",
  "Practice with chapter tests and full mock tests",
  "Review performance and continue improvement",
];

const trustCards = [
  {
    label: "Current Launch",
    value: "CTET/TET",
    text: "The first active learning track of AspireNest Academy is focused on CTET/TET preparation.",
  },
  {
    label: "Academy Model",
    value: "Expandable",
    text: "AspireNest is built as a growing academy platform, not a one-page exam website.",
  },
  {
    label: "Student Promise",
    value: "Clarity",
    text: "A clean learning journey where students know what to study, where to practice, and how to improve.",
  },
];

export default function AcademyOverviewRoute() {
  return (
    <main className="academyOverviewRoute">
      <section className="academyOverviewHero">
        <div className="academyOverviewHeroCopy">
          <span className="academyOverviewEyebrow">
            AspireNest Academy
          </span>

          <h1>
            A growing digital academy for focused and structured learning.
          </h1>

          <p>
            AspireNest Academy begins with a dedicated CTET/TET preparation
            platform and is being built as a complete learning ecosystem where
            more subjects, courses, and academic tracks can be added step by
            step.
          </p>

          <div className="academyOverviewHeroActions">
            <Link to="/ctet-tet" className="academyOverviewPrimaryBtn">
              Start CTET/TET Preparation
            </Link>

            <Link to="/login" className="academyOverviewSecondaryBtn">
              Login to AspireNest
            </Link>
          </div>

          <div className="academyOverviewHeroTrust">
            <span>CTET/TET Live</span>
            <span>More Tracks Coming</span>
            <span>Structured Learning</span>
          </div>
        </div>

        <div className="academyOverviewCommandCard">
          <div className="academyOverviewCommandTop">
            <span>ACADEMY LAUNCH</span>
            <strong>Active</strong>
          </div>

          <div className="academyOverviewCommandGrid">
            <div>
              <strong>CTET/TET</strong>
              <span>Current active preparation track</span>
            </div>

            <div>
              <strong>Notes</strong>
              <span>Subject and chapter learning resources</span>
            </div>

            <div>
              <strong>Classes</strong>
              <span>Recorded and live learning support</span>
            </div>

            <div>
              <strong>Tests</strong>
              <span>Practice, mock tests, and review flow</span>
            </div>
          </div>

          <div className="academyOverviewCommandFlow">
            <span>Study</span>
            <i />
            <span>Practice</span>
            <i />
            <span>Progress</span>
          </div>
        </div>
      </section>

      <section className="academyOverviewTrustGrid">
        {trustCards.map((card) => (
          <article className="academyOverviewTrustCard" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.text}</p>
          </article>
        ))}
      </section>

      <section className="academyOverviewSectionHeader">
        <span>Why AspireNest</span>
        <h2>Not just content. A clear learning direction.</h2>
        <p>
          A student should not feel lost after joining. AspireNest is being
          shaped as a guided academic space where preparation, practice, and
          progress stay connected.
        </p>
      </section>

      <section className="academyOverviewSystemGrid">
        {academySystems.map((item) => (
          <article className="academyOverviewSystemCard" key={item.title}>
            <div>
              <span>{item.metric}</span>
            </div>

            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="academyOverviewJourney">
        <div className="academyOverviewJourneyCopy">
          <span>Student Journey</span>
          <h2>Begin with CTET/TET. Grow with AspireNest.</h2>
          <p>
            The current launch is focused on CTET/TET students. As AspireNest
            grows, the same academy structure will support more learning
            programs with the same clarity and discipline.
          </p>

          <Link to="/ctet-tet" className="academyOverviewPrimaryBtn">
            Open CTET/TET Section
          </Link>
        </div>

        <div className="academyOverviewJourneyList">
          {studentJourney.map((step, index) => (
            <div className="academyOverviewJourneyItem" key={step}>
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="academyOverviewFinalCta">
        <span>Where Aspirations Turn Into Selections</span>
        <h2>Start with a focused preparation path.</h2>
        <p>
          AspireNest Academy is live with CTET/TET preparation and is growing
          into a broader digital academy for students who need structure,
          guidance, practice, and confidence.
        </p>

        <div className="academyOverviewHeroActions">
          <Link to="/ctet-tet" className="academyOverviewPrimaryBtn">
            Explore CTET/TET
          </Link>

          <Link to="/login" className="academyOverviewSecondaryBtn">
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}