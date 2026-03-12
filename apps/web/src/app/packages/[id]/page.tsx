"use client";

import { use, useState } from "react";
import Link from "next/link";
import { packages } from "../../../data/packages";
import styles from "./page.module.scss";

export default function PackageDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pkg = packages.find((p) => p.id === id);

  const [activeImg, setActiveImg] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [guideImgError, setGuideImgError] = useState(false);

  if (!pkg) return <div className={styles.notFound}>Package not found.</div>;

  const destinations =
    pkg.region === "India"
      ? pkg.cities?.join(", ")
      : pkg.countries?.join(", ") || pkg.cities?.join(", ");

  const discount = pkg.originalPrice
    ? Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)
    : null;

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        {pkg.images?.[activeImg] && !imgError ? (
          <img
            src={pkg.images[activeImg]}
            alt={pkg.name}
            className={styles.heroImg}
            onError={() => setImgError(true)}
          />
        ) : null}
        <div className={styles.heroGradient} />

        {/* <Link href="/packages" className={styles.backLink}>
          ← Packages
        </Link> */}

        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>
            {pkg.subRegion} · {pkg.duration}
          </p>
          <h1 className={styles.heroTitle}>{pkg.name}</h1>
          <div className={styles.heroMeta}>
            <span className={styles.heroPill}>📍 {destinations}</span>
            <span className={styles.heroPill}>🏨 {pkg.hotel}</span>
            <span className={styles.heroPill}>★ {pkg.guide.rating}</span>
            <span className={styles.heroPill}>🗓 {pkg.bestSeason}</span>
            <span className={styles.heroPricePill}>
              ₹{pkg.price.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* ── Thumbnail strip ── */}
      {pkg.images.length > 1 && (
        <div className={styles.thumbStrip}>
          {pkg.images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${pkg.name} view ${i + 1}`}
              className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ""}`}
              onClick={() => { setActiveImg(i); setImgError(false); }}
            />
          ))}
        </div>
      )}

      {/* ── Body ── */}
      <div className={styles.body}>

        {/* ── Left column ── */}
        <div className={styles.left}>

          {/* Stats row */}
          <p className={styles.sectionLabel}>At a Glance</p>
          <div className={styles.highlights}>
            <div className={styles.highlight}>
              <span className={styles.highlightLabel}>Duration</span>
              <span className={styles.highlightValue}>{pkg.durationDays}D / {pkg.durationNights}N</span>
            </div>
            <div className={styles.highlight}>
              <span className={styles.highlightLabel}>Best Season</span>
              <span className={styles.highlightValue}>{pkg.bestSeason}</span>
            </div>
            <div className={styles.highlight}>
              <span className={styles.highlightLabel}>Group Size</span>
              <span className={styles.highlightValue}>{pkg.groupSize}</span>
            </div>
            <div className={styles.highlight}>
              <span className={styles.highlightLabel}>Trip Type</span>
              <span className={styles.highlightValue}>{pkg.tripType}</span>
            </div>
            {/* <div className={styles.highlight}>
              <span className={styles.highlightLabel}>Total Reviews</span>
              <span className={styles.highlightValue}>{pkg.reviews.length} ★</span>
            </div> */}
          </div>

          {/* Description */}
          <p className={styles.sectionLabel}>About this Package</p>
          <p className={styles.description}>{pkg.description}</p>

          {/* Highlight bullets */}
          <p className={styles.sectionLabel}>Package Highlights</p>
          <ul className={styles.highlightList}>
            {pkg.highlights.map((h, i) => (
              <li key={i} className={styles.highlightItem}>{h}</li>
            ))}
          </ul>

          {/* Tags */}
          <div className={styles.tags}>
            {pkg.tags.map((t) => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>

          {/* Inclusions / Exclusions */}
          <p className={styles.sectionLabel}>What's Included</p>
          <div className={styles.inclExcl}>
            <div className={styles.inclBox}>
              <p className={styles.inclExclTitle}>Included</p>
              <ul className={styles.inclList}>
                {pkg.inclusions.map((item) => (
                  <li key={item} className={styles.inclItem}>{item}</li>
                ))}
              </ul>
            </div>
            <div className={styles.exclBox}>
              <p className={styles.inclExclTitle}>Not Included</p>
              <ul className={styles.exclList}>
                {pkg.exclusions.map((item) => (
                  <li key={item} className={styles.exclItem}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Details table */}
          <p className={styles.sectionLabel}>Package Details</p>
          <div className={styles.detailList}>
            {[
              { key: "Destinations", val: destinations },
              { key: "Hotel", val: `${pkg.hotel} (${"★".repeat(pkg.hotelRating)})` },
              { key: "Food", val: pkg.food.join(", ") },
              { key: "Transport", val: pkg.transport.join(", ") },
              { key: "Activities", val: pkg.activities.join(", ") },
              { key: "Hospitality", val: pkg.hospitality },
              { key: "Documents", val: pkg.documents.join(", ") },
            ].map(({ key, val }) => (
              <div key={key} className={styles.detailRow}>
                <span className={styles.detailKey}>{key}</span>
                <span className={styles.detailVal}>{val}</span>
              </div>
            ))}
          </div>

          {/* Guide card */}
          <p className={styles.sectionLabel}>Your Guide</p>
          <div className={styles.guideCard}>
            {pkg.guide.photo && !guideImgError ? (
              <img
                src={pkg.guide.photo}
                alt={pkg.guide.name}
                className={styles.guidePhoto}
                onError={() => setGuideImgError(true)}
              />
            ) : (
              <div className={styles.guidePhotoFallback}>
                {pkg.guide.name.charAt(0)}
              </div>
            )}
            <div className={styles.guideInfo}>
              <p className={styles.guideName}>{pkg.guide.name}</p>
              <p className={styles.guideSpeciality}>{pkg.guide.speciality}</p>
              <p className={styles.guideBio}>{pkg.guide.bio}</p>
              <div className={styles.guideMeta}>
                <span className={styles.guideMetaItem}>
                  <span className={styles.guideRating}>★ {pkg.guide.rating}</span>
                </span>
                <span className={styles.guideMetaItem}>
                  🕐 {pkg.guide.experience}
                </span>
                <span className={styles.guideMetaItem}>
                  🌐 {pkg.guide.languages.join(", ")}
                </span>
                <span className={styles.guideMetaItem}>
                  📞 {pkg.guide.contact}
                </span>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <p className={styles.sectionLabel}>Customer Reviews</p>
          {pkg.reviews.length === 0 ? (
            <p className={styles.noReviews}>No reviews yet.</p>
          ) : (
            <ul className={styles.reviewList}>
              {pkg.reviews.map((r, i) => (
                <li key={i} className={styles.reviewItem}>
                  <div className={styles.reviewTop}>
                    <div>
                      <span className={styles.reviewUser}>{r.user}</span>
                      <span className={styles.reviewDate}>
                        {" "}· {new Date(r.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <span className={styles.reviewStars}>
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </span>
                  </div>
                  <p className={styles.reviewText}>{r.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>

          {/* Booking card */}
          <div className={styles.sideCard}>
            <p className={styles.sideCardTitle}>Book This Package</p>
            <p className={styles.sideCardSubtitle}>Best price guaranteed</p>

            {pkg.originalPrice && (
              <>
                <p className={styles.sideOriginal}>
                  ₹{pkg.originalPrice.toLocaleString("en-IN")}
                </p>
                {discount && (
                  <span className={styles.sideDiscount}>{discount}% OFF</span>
                )}
              </>
            )}

            <p className={styles.sidePrice}>
              ₹{pkg.price.toLocaleString("en-IN")}
            </p>
            <p className={styles.sidePriceSub}>per person · all inclusive</p>

            <div className={styles.sideDivider} />

            {[
              { label: "Duration", val: pkg.duration },
              { label: "Best Season", val: pkg.bestSeason },
              { label: "Group Size", val: pkg.groupSize },
              { label: "Difficulty", val: pkg.difficulty },
              { label: "Hotel", val: pkg.hotel },
            ].map(({ label, val }) => (
              <div key={label} className={styles.sideInfoRow}>
                <span className={styles.sideInfoLabel}>{label}</span>
                <span className={styles.sideInfoVal}>{val}</span>
              </div>
            ))}

            <button className={styles.bookBtn} type="button">
              Enquire Now →
            </button>
          </div>

          {/* Quick info card */}
          <div className={styles.quickCard}>
            <p className={styles.quickCardTitle}>Need to Know</p>
            {[
              { label: "Documents", val: pkg.documents.join(", ") },
              { label: "Food", val: pkg.food.slice(0, 2).join(", ") },
              { label: "Transport", val: pkg.transport.slice(0, 2).join(", ") },
              { label: "Languages", val: pkg.guide.languages.join(", ") },
            ].map(({ label, val }) => (
              <div key={label} className={styles.quickRow}>
                <span className={styles.quickLabel}>{label}</span>
                <span className={styles.quickVal}>{val}</span>
              </div>
            ))}
          </div>

        </aside>
      </div>
    </div>
  );
}