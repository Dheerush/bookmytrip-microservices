import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, ArrowLeft } from "lucide-react";
import { destinations } from "@/data/destinations";
import styles from "./page.module.scss";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN").format(price);
}

export default async function DestinationPage({ params }: PageProps) {
  const { slug } = await params;
  const dest = destinations.find((d) => d.slug === slug);

  if (!dest) notFound();

  const discount = Math.round(
    ((dest.originalPrice - dest.discountedPrice) / dest.originalPrice) * 100,
  );

  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <Image
          src={dest.image}
          alt={dest.name}
          fill
          priority
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <Link href="/#destinations" className={styles.back}>
            <ArrowLeft size={16} />
            Back to Destinations
          </Link>
          <h1 className={styles.title}>
            {dest.name}, {dest.country}
          </h1>
          <div className={styles.metaRow}>
            <span className={styles.metaChip}>
              <MapPin size={13} />
              {dest.continent}
            </span>
            <span className={styles.metaChip}>
              <Star size={13} fill="currentColor" />
              {dest.rating} ({dest.reviewCount} reviews)
            </span>
            <span className={styles.metaChip}>{dest.duration}</span>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.tags}>
          {dest.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        <div className={styles.priceCard}>
          <div className={styles.priceLabel}>Starting from</div>
          <div className={styles.priceRow}>
            <span className={styles.original}>
              ₹{formatPrice(dest.originalPrice)}
            </span>
            <span className={styles.discounted}>
              ₹{formatPrice(dest.discountedPrice)}
            </span>
            <span className={styles.badge}>{discount}% OFF</span>
          </div>
          <div className={styles.perPerson}>per person</div>
          <button className={styles.bookBtn} type="button">
            Book Now
          </button>
        </div>

        <div className={styles.placeholder}>
          <p>
            Detailed itinerary, gallery, reviews, and booking form will be
            populated here once the backend API is integrated.
          </p>
        </div>
      </div>
    </main>
  );
}

export function generateStaticParams() {
  return destinations.map((d) => ({ slug: d.slug }));
}
