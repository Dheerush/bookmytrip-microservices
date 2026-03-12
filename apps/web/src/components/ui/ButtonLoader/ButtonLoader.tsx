import styles from './ButtonLoader.module.scss';

interface ButtonLoaderProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

/**
 * Button with built-in spinner state.
 * Pass `loading={true}` to show spinner + loadingText and disable the button.
 *
 * Inherits all native <button> props — apply your own className for styling.
 */
export default function ButtonLoader({
  loading = false,
  loadingText = 'Please Wait...',
  children,
  disabled,
  className = '',
  ...rest
}: ButtonLoaderProps) {
  return (
    <button
      className={`${styles.button} ${className}`}
      disabled={loading || disabled}
      {...rest}
    >
      {loading ? (
        <>
          <span className={styles.spinner} />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
