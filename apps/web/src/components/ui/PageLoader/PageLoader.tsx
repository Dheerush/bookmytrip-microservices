import styles from './PageLoader.module.scss';

interface PageLoaderProps {
  message?: string;
}

/**
 * Full-screen loading overlay.
 * Use when navigating between pages or doing heavy async work.
 */
export default function PageLoader({ message = 'Loading…' }: PageLoaderProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.spinner} />
      <p className={styles.text}>{message}</p>
    </div>
  );
}
