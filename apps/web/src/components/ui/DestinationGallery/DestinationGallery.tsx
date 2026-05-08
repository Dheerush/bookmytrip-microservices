"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import styles from "./DestinationGallery.module.scss";

interface Props {
  images: string[];
  title: string;
}

export default function DestinationGallery({ images, title }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const open = (index: number) => setActiveIndex(index);
  const close = () => setActiveIndex(null);
  const showPrev = () => setActiveIndex((prev) => (prev == null ? prev : (prev - 1 + images.length) % images.length));
  const showNext = () => setActiveIndex((prev) => (prev == null ? prev : (prev + 1) % images.length));

  return (
    <>
      <div className={styles.grid}>
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            className={`${styles.thumbCard} ${index === 0 ? styles.featured : ""}`}
            onClick={() => open(index)}
            aria-label={`Open ${title} image ${index + 1}`}
          >
            <Image
              src={image}
              alt={`${title} image ${index + 1}`}
              fill
              sizes={index === 0 ? "(max-width: 900px) 100vw, 40vw" : "(max-width: 900px) 50vw, 20vw"}
              className={styles.thumbImage}
            />
            <span className={styles.zoomHint}>View</span>
          </button>
        ))}
      </div>

      {activeIndex != null ? (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${title} gallery`}>
          <button type="button" className={styles.closeBtn} onClick={close} aria-label="Close gallery">
            <X size={20} />
          </button>
          <button type="button" className={`${styles.navBtn} ${styles.prevBtn}`} onClick={showPrev} aria-label="Previous image">
            <ChevronLeft size={24} />
          </button>
          <div className={styles.lightboxFrame}>
            <Image
              src={images[activeIndex]}
              alt={`${title} large image ${activeIndex + 1}`}
              fill
              sizes="100vw"
              className={styles.lightboxImage}
            />
          </div>
          <button type="button" className={`${styles.navBtn} ${styles.nextBtn}`} onClick={showNext} aria-label="Next image">
            <ChevronRight size={24} />
          </button>
        </div>
      ) : null}
    </>
  );
}
