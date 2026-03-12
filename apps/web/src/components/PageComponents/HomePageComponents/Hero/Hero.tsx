import SearchTabs from "../SearchTabs/SearchTabs";
import styles from "./Hero.module.scss";

const TRUST_CHIPS = [
  { icon: "✦", label: "10M+ Happy Travellers" },
  { icon: "◈", label: "Best Price Guarantee" },
  { icon: "⬡", label: "Secure Payments" },
  { icon: "◉", label: "150+ Countries" },
];

const Hero = () => {
  return (
    <section
      className={styles.heroContainer}
      style={{ backgroundImage: "url('/home/vacation1.jpeg')" }}
    >
      {/* Layered dark overlay */}
      <div className={styles.overlay} aria-hidden="true" />

      {/* Animated grain texture */}
      <div className={styles.grain} aria-hidden="true" />

      {/* ── Main content ── */}
      <div className={styles.content}>

        {/* Eyebrow label */}
        <p className={styles.eyebrow} aria-hidden="true">
          Luxury Travel Awaits
        </p>

        {/* Headline */}
        <h1 className={styles.headline}>
          The World Is{" "}
          <span className={styles.accent}>Yours</span>
          <span className={styles.headlineStrong}>
            Begin the Journey.
          </span>
        </h1>

        {/* Gold divider */}
        <span className={styles.headlineDivider} aria-hidden="true" />

        {/* Subtext */}
        <p className={styles.subtext}>
          Flights, hotels, trains &amp; curated holiday packages —<br />
          crafted for travellers who expect the extraordinary.
        </p>

        {/* Search tabs */}
        <div className={styles.searchWrapper}>
          <SearchTabs />
        </div>

        {/* Trust chips */}
        <div className={styles.trustRow} role="list">
          {TRUST_CHIPS.map((chip) => (
            <div key={chip.label} className={styles.trustChip} role="listitem">
              <span className={styles.chipIcon} aria-hidden="true">
                {chip.icon}
              </span>
              {chip.label}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollHint} aria-hidden="true">
        <span className={styles.scrollLine} />
        Scroll
      </div>
    </section>
  );
};

export default Hero;