import Link from "next/link"
import styles from "./AuthFormWrapper.module.scss"

interface Props {
  title: string
  subtitle: string
  children: React.ReactNode
  footerText: string
  footerLink: string
  footerLinkText: string
}

export default function AuthFormWrapper({
  title,
  subtitle,
  children,
  footerText,
  footerLink,
  footerLinkText,
}: Props) {
  return (
    <div className={styles.card}>
      <h1 className={styles.logo}>BookMyTrip</h1>

      <h2 className={styles.title}>{title}</h2>

      <p className={styles.subtitle}>{subtitle}</p>

      <div className={styles.form}>{children}</div>

      <p className={styles.footer}>
        {footerText} <Link href={footerLink}>{footerLinkText}</Link>
      </p>
    </div>
  )
}