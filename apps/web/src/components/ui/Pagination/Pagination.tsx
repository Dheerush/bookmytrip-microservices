"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import styles from "./Pagination.module.scss";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav className={styles.pagination} aria-label="Search results pagination">
      <button
        className={styles.arrow}
        disabled={currentPage === 1}
        onClick={() => goToPage(currentPage - 1)}
        type="button"
      >
        ‹ Prev
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className={styles.dots}>…</span>
        ) : (
          <button
            key={p}
            className={`${styles.page} ${p === currentPage ? styles.active : ""}`}
            onClick={() => goToPage(p)}
            type="button"
          >
            {p}
          </button>
        ),
      )}

      <button
        className={styles.arrow}
        disabled={currentPage === totalPages}
        onClick={() => goToPage(currentPage + 1)}
        type="button"
      >
        Next ›
      </button>
    </nav>
  );
}
