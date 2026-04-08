"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo/Logo";
import { showToast } from "@/lib/toast";
import styles from "./Footer.module.scss";

const policyLinks = [
  { key: "privacy", label: "Privacy Policy" },
  { key: "terms", label: "Terms of Use" },
  { key: "cancel", label: "Cancellation & Refund" },
  { key: "safety", label: "Travel Safety" },
];

const developerNotes = [
  { key: "status", label: "Platform Status" },
  { key: "api", label: "API Changelog" },
  { key: "rollout", label: "Feature Rollout Notes" },
  { key: "security", label: "Security Baseline" },
];

const offerLinks = [
  { label: "Weekend Flight Deals", href: "/deals" },
  { label: "Hotel Flash Sale", href: "/deals" },
  { label: "Cab Cashback", href: "/deals" },
  { label: "Train Early Bird Pass", href: "/deals" },
];

const destinationHighlights = ["Goa", "Dubai", "Bali", "Singapore", "Kashmir", "Istanbul"];

const Footer = () => {
  const [email, setEmail] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleNewsletter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      showToast.error("Please add an email to subscribe.");
      return;
    }
    try {
      const res = await fetch("/api/users/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (data.success) {
        showToast.success("Subscribed! We'll send upcoming deals and offers to your email.");
        setEmail("");
      } else {
        showToast.error(data.message || "Subscription failed. Please try again.");
      }
    } catch {
      showToast.error("Subscription failed. Please try again.");
    }
  };

  const renderModalBody = () => {
    if (activeModal === "privacy") {
      return "This learning project stores only basic account and booking details needed for app flows. We do not sell personal data. By using this app, you agree that data may be used for demo analytics and debugging in development environments.";
    }
    if (activeModal === "terms") {
      return "BookMyTrip is a learning/demo platform and not a production booking provider. Prices, inventory, and third-party integrations may be simulated. Please do not use this app for real financial or travel decisions.";
    }
    if (activeModal === "cancel") {
      return "Cancellation and refund eligibility depends on booking type, timing, and provider rules. Refund timelines shown in the app are indicative and part of learning workflows.";
    }
    if (activeModal === "safety") {
      return "Always verify destination advisories, local regulations, and provider legitimacy before travel. Keep IDs and emergency contacts available.";
    }
    if (activeModal === "status") {
      return "Current platform status: development mode. Some modules may use fallback data when corresponding backend services are unavailable.";
    }
    if (activeModal === "api") {
      return "Recent updates include coupon validation, live complaint workflows, and real-time notifications via socket channels.";
    }
    if (activeModal === "rollout") {
      return "Feature rollout follows phased integration: APIs first, dashboard wiring second, and UX polish in final pass.";
    }
    if (activeModal === "security") {
      return "Security baseline includes JWT auth, role-based access controls, API gateway checks, and event audit patterns for key actions.";
    }
    return "";
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
              <li key={item.key}><button type="button" onClick={() => setActiveModal(item.key)}>{item.label}</button></li>
            ))}
          </ul>
        </section>

        <section>
          <h3>Developer Notes</h3>
          <ul>
            {developerNotes.map((item) => (
              <li key={item.key}><button type="button" onClick={() => setActiveModal(item.key)}>{item.label}</button></li>
            ))}
          </ul>
        </section>

        <section>
          <h3>Coupons and Offers</h3>
          <ul>
            {offerLinks.map((item) => (
              <li key={item.label}><Link href={item.href}>{item.label}</Link></li>
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
            <Link key={place} href={`/flights?to=${encodeURIComponent(place)}`}>{place}</Link>
          ))}
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} BookMyTrip. This app is for learning and demo workflows only.</span>
        <span>Created by Dheeraj Sharma · sharmadheeraj1996@gmail.com</span>
      </div>

      {activeModal && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h4>{[...policyLinks, ...developerNotes].find((x) => x.key === activeModal)?.label}</h4>
            <p>{renderModalBody()}</p>
            <button type="button" onClick={() => setActiveModal(null)}>Close</button>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;