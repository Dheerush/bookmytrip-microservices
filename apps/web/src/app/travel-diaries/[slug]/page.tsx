import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { travelDiaries } from "@/data/travelDiaries";
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

  if (!diary) notFound();

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
          <p className={styles.lead}>{diary.excerpt}</p>
          <div className={styles.placeholder}>
            <p>
              Full diary content, photo gallery, and comments will be loaded
              from the backend API once integrated.
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}

export function generateStaticParams() {
  return travelDiaries.map((d) => ({ slug: d.slug }));
}
