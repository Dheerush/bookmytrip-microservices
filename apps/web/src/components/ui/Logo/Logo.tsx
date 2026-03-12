import Link from "next/link";
import styles from "./Logo.module.scss";

interface LogoProps {
  /** "dark" = over white bg (default), "light" = over dark/image bg */
  variant?: "dark" | "light";
}

const Logo = ({ variant = "dark" }: LogoProps) => {
  return (
    <Link href="/" className={`${styles.logo} ${styles[variant]}`}>
      {/* Icon */}
      <div className={styles.iconWrap}>
        <div className={styles.iconInner}>
          {/* Airplane SVG */}
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={styles.plane}
            aria-hidden="true"
          >
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
          {/* shimmer overlay */}
          <span className={styles.shimmer} aria-hidden="true" />
        </div>
        {/* decorative outer ring */}
        <span className={styles.ring} aria-hidden="true" />
      </div>

      {/* Wordmark */}
      <div className={styles.wordmark}>
        <span className={styles.name}>
          Book<span className={styles.accent}>My</span>Trip
        </span>
      </div>
    </Link>
  );
};

export default Logo;