import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { travelDiaries } from "@/data/travelDiaries";
import { travelDiaryDetails } from "@/data/travelDiaryDetails";
import styles from "./page.module.scss";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function DiaryPage({ params }: PageProps) {
  const { slug } = await params;
  const diary = travelDiaries.find((d) => d.slug === slug);
  const detail = travelDiaryDetails[slug];

  if (!diary || !detail) notFound();

  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <Image
          src={diary.image}
          alt={diary.title}
          fill
          priority
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <Link href="/#diaries" className={styles.back}>
            <ArrowLeft size={16} />
            Back to Travel Diaries
          </Link>
          <span className={styles.cityLabel}>
            {diary.city}, {diary.country}
          </span>
          <h1 className={styles.title}>{diary.title}</h1>
          <div className={styles.metaRow}>
            <span className={styles.metaChip}>
              <Calendar size={13} />
              {formatDate(diary.date)}
            </span>
            <span className={styles.metaChip}>
              <Clock size={13} />
              {diary.readTime}
            </span>
          </div>
        </div>
      </div>

      <article className={styles.body}>
        <div className={styles.author}>
          <span className={styles.authorInitial}>
            {diary.author.charAt(0)}
          </span>
          <div>
            <div className={styles.authorName}>{diary.author}</div>
            <div className={styles.authorSub}>Travel Writer</div>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.contentGrid}>
            <div className={styles.storyColumn}>
              <p className={styles.lead}>{detail.lead}</p>
              {detail.sections.map((section) => (
                <section key={section.heading} className={styles.sectionBlock}>
                  <h2 className={styles.sectionTitle}>{section.heading}</h2>
                  <p className={styles.sectionBody}>{section.body}</p>
                </section>
              ))}
              <div className={styles.takeawayCard}>
                <span className={styles.takeawayLabel}>Why This Diary Stays With You</span>
                <p>{detail.takeaway}</p>
              </div>
            </div>

            <aside className={styles.sidebar}>
              <div className={styles.sideCard}>
                <span className={styles.sideLabel}>Trip Highlights</span>
                <ul className={styles.highlightList}>
                  {detail.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.sideCard}>
                <span className={styles.sideLabel}>Quick Snapshot</span>
                <p className={styles.sideCopy}>{diary.excerpt}</p>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </main>
  );
}

export function generateStaticParams() {
  return travelDiaries.map((d) => ({ slug: d.slug }));
}
