"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ChevronDown,
  Send,
  ArrowLeft,
} from "lucide-react";
import styles from "./Issues.module.scss";

type IssueStatus = "open" | "in-progress" | "resolved" | "closed";
type ViewMode = "list" | "new";

interface Issue {
  id: string;
  subject: string;
  description: string;
  status: IssueStatus;
  bookingRef?: string;
  createdAt: string;
  lastUpdate: string;
  messages: number;
}

const SAMPLE_ISSUES: Issue[] = [
  {
    id: "ISS-1234",
    subject: "Refund not received for cancelled flight",
    description: "I cancelled flight BMT-FL-2026022801 on Feb 28 but haven't received the refund yet.",
    status: "resolved",
    bookingRef: "BMT-FL-2026022801",
    createdAt: "28 Feb 2026",
    lastUpdate: "5 Mar 2026",
    messages: 4,
  },
  {
    id: "ISS-1190",
    subject: "Hotel room did not match description",
    description: "The room at The Oberoi, Jaipur was not as described. The sea-view was actually a parking lot.",
    status: "in-progress",
    bookingRef: "BMT-HT-2025110101",
    createdAt: "04 Nov 2025",
    lastUpdate: "18 Mar 2026",
    messages: 6,
  },
  {
    id: "ISS-1080",
    subject: "Incorrect charges on train booking",
    description: "I was charged twice for the same Rajdhani Express booking.",
    status: "closed",
    bookingRef: "BMT-TR-2026012001",
    createdAt: "22 Jan 2026",
    lastUpdate: "30 Jan 2026",
    messages: 3,
  },
];

const statusIcon = (status: IssueStatus) => {
  switch (status) {
    case "open": return <AlertTriangle size={14} strokeWidth={1.6} />;
    case "in-progress": return <Clock size={14} strokeWidth={1.6} />;
    case "resolved": return <CheckCircle2 size={14} strokeWidth={1.6} />;
    case "closed": return <XCircle size={14} strokeWidth={1.6} />;
  }
};

const statusLabel = (status: IssueStatus) => {
  switch (status) {
    case "open": return "Open";
    case "in-progress": return "In Progress";
    case "resolved": return "Resolved";
    case "closed": return "Closed";
  }
};

export default function IssuesPage() {
  const [view, setView] = useState<ViewMode>("list");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would call an API
    setSubmitted(true);
    setTimeout(() => {
      setView("list");
      setSubject("");
      setDescription("");
      setBookingRef("");
      setSubmitted(false);
    }, 2000);
  };

  return (
    <div className={styles.page}>
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={styles.header}>
              <div>
                <h1 className={styles.title}>Issues & Complaints</h1>
                <p className={styles.subtitle}>Track your complaints or raise a new one</p>
              </div>
              <motion.button
                className={styles.newBtn}
                onClick={() => setView("new")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus size={14} strokeWidth={1.8} />
                Raise New Complaint
              </motion.button>
            </div>

            <div className={styles.issueList}>
              {SAMPLE_ISSUES.map((issue, i) => (
                <motion.div
                  key={issue.id}
                  className={styles.issueCard}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <div className={styles.issueTop}>
                    <span className={styles.issueId}>{issue.id}</span>
                    <span className={`${styles.statusBadge} ${styles[issue.status.replace("-", "")]}`}>
                      {statusIcon(issue.status)}
                      {statusLabel(issue.status)}
                    </span>
                  </div>
                  <h3 className={styles.issueSubject}>{issue.subject}</h3>
                  <p className={styles.issueDesc}>{issue.description}</p>
                  <div className={styles.issueMeta}>
                    {issue.bookingRef && (
                      <span className={styles.metaItem}>Ref: {issue.bookingRef}</span>
                    )}
                    <span className={styles.metaItem}>Created: {issue.createdAt}</span>
                    <span className={styles.metaItem}>Updated: {issue.lastUpdate}</span>
                    <span className={styles.metaItem}>
                      <MessageSquare size={12} strokeWidth={1.4} />
                      {issue.messages} messages
                    </span>
                  </div>
                  <motion.button
                    className={styles.viewBtn}
                    whileHover={{ x: 2 }}
                  >
                    View Details
                    <ChevronDown size={12} strokeWidth={1.6} style={{ transform: "rotate(-90deg)" }} />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="new"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className={styles.header}>
              <div>
                <motion.button
                  className={styles.backBtn}
                  onClick={() => setView("list")}
                  whileHover={{ x: -2 }}
                >
                  <ArrowLeft size={16} strokeWidth={1.6} />
                  Back to Issues
                </motion.button>
                <h1 className={styles.title} style={{ marginTop: 8 }}>Raise New Complaint</h1>
                <p className={styles.subtitle}>Describe your issue and we&apos;ll get back to you</p>
              </div>
            </div>

            {submitted ? (
              <motion.div
                className={styles.successCard}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle2 size={40} strokeWidth={1.2} />
                <h3>Complaint Submitted!</h3>
                <p>We&apos;ll review your issue and respond within 24–48 hours.</p>
              </motion.div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <label className={styles.label}>Subject</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    required
                    maxLength={150}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Booking Reference (optional)</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={bookingRef}
                    onChange={(e) => setBookingRef(e.target.value)}
                    placeholder="e.g. BMT-FL-2026031501"
                    maxLength={30}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Description</label>
                  <textarea
                    className={styles.textarea}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed information about your complaint..."
                    required
                    rows={5}
                    maxLength={2000}
                  />
                </div>
                <motion.button
                  type="submit"
                  className={styles.submitBtn}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Send size={14} strokeWidth={1.6} />
                  Submit Complaint
                </motion.button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
