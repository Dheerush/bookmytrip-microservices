"use client";

import { FormEvent, useState } from "react";
import Logo from "@/components/ui/Logo/Logo";
import { showToast } from "@/lib/toast";
import styles from "./Footer.module.scss";

const policyLinks = [
  "Privacy Policy",
  "Terms of Use",
  "Cancellation & Refund",
  "Travel Safety",
];

const developerNotes = [
  "Platform Status",
  "API Changelog",
  "Feature Rollout Notes",
  "Security Baseline",
];

const offerLinks = [
  "Weekend Flight Deals",
  "Hotel Flash Sale",
  "Cab Cashback",
  "Train Early Bird Pass",
];

const destinationHighlights = ["Goa", "Dubai", "Bali", "Singapore", "Kashmir", "Istanbul"];

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleNewsletter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      showToast.error("Please add an email to subscribe.");
      return;
    }
    showToast.success("Subscribed successfully. You will receive offers and coupons.");
    setEmail("");
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.brandShell}>
        <Logo variant="light" />
        <p>
          Curated travel with precision booking, transparent pricing, and concierge-grade support across flights,
          trains, hotels, cabs and handcrafted tours.
        </p>
        <div className={styles.badges}>
          <span>24/7 Concierge</span>
          <span>Verified Partners</span>
          <span>Secure Payments</span>
        </div>
      </div>

      <div className={styles.grid}>
        <section>
          <h3>BMT Policies</h3>
          <ul>
            {policyLinks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3>Developer Notes</h3>
          <ul>
            {developerNotes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3>Coupons and Offers</h3>
          <ul>
            {offerLinks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3>Subscribe to Newsletter</h3>
          <p>Get premium offers, smart fare alerts and travel inspiration directly in your inbox.</p>
          <form onSubmit={handleNewsletter} className={styles.form}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              aria-label="Newsletter email"
            />
            <button type="submit">Subscribe</button>
          </form>
        </section>
      </div>

      <div className={styles.destinationsRow}>
        <h4>Curated Destinations</h4>
        <div>
          {destinationHighlights.map((place) => (
            <span key={place}>{place}</span>
          ))}
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} BookMyTrip. Crafted for elevated travel experiences.</span>
        <span>Made with modern platform architecture and trust-first design.</span>
      </div>
    </footer>
  );
};

export default Footer;