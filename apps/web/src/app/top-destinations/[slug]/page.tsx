import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, ArrowLeft } from "lucide-react";
import { destinations } from "@/data/destinations";
import { destinationGuides } from "@/data/destinationGuides";
import DestinationGallery from "@/components/ui/DestinationGallery/DestinationGallery";
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
  const guide = destinationGuides[slug];

  if (!dest || !guide) notFound();

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

        <div className={styles.layout}>
          <div className={styles.contentColumn}>
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
              <Link href={`/packages?destination=${encodeURIComponent(dest.name)}`} className={styles.bookBtn}>
                Book Now
              </Link>
            </div>

            <section className={styles.copySection}>
              <h2 className={styles.sectionTitle}>About {dest.name}</h2>
              <p>{guide.about}</p>
            </section>

            <section className={styles.copySection}>
              <h2 className={styles.sectionTitle}>History & Cultural Backdrop</h2>
              <p>{guide.history}</p>
            </section>

            <section className={styles.copySection}>
              <h2 className={styles.sectionTitle}>Why Travellers Keep Choosing It</h2>
              <p>{guide.attraction}</p>
            </section>

            <div className={styles.infoGrid}>
              <section className={styles.infoCard}>
                <span className={styles.infoLabel}>Cuisine</span>
                <p>{guide.cuisine}</p>
              </section>
              <section className={styles.infoCard}>
                <span className={styles.infoLabel}>Demography & Local Character</span>
                <p>{guide.demographics}</p>
              </section>
              <section className={styles.infoCard}>
                <span className={styles.infoLabel}>Safety Snapshot</span>
                <p>{guide.safety}</p>
              </section>
            </div>

            <section className={styles.quickFacts}>
              <h2 className={styles.sectionTitle}>Quick Facts</h2>
              <div className={styles.factGrid}>
                {guide.quickFacts.map((fact) => (
                  <div key={fact.label} className={styles.factCard}>
                    <span className={styles.factLabel}>{fact.label}</span>
                    <strong>{fact.value}</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className={styles.galleryColumn}>
            <div className={styles.galleryCard}>
              <span className={styles.infoLabel}>Destination Gallery</span>
              <DestinationGallery images={guide.gallery} title={dest.name} />
            </div>
            <div className={styles.statsCard}>
              <span className={styles.infoLabel}>Tourism Signals</span>
              <div className={styles.statList}>
                {guide.tourismStats.map((stat) => (
                  <div key={stat.label} className={styles.statRow}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export function generateStaticParams() {
  return destinations.map((d) => ({ slug: d.slug }));
}
