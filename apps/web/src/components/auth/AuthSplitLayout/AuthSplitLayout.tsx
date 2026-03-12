"use client"

import styles from "./AuthSplitLayout.module.scss"

interface Props {
  left: React.ReactNode
  rightImage: string
  quote: string
}

export default function AuthSplitLayout({
  left,
  rightImage,
  quote,
}: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>{left}</div>

      <div
        className={styles.right}
        style={{ backgroundImage: `url(${rightImage})` }}
      >
        <div className={styles.overlay} />
        <div className={styles.quote}>{quote}</div>
      </div>
    </div>
  )
}