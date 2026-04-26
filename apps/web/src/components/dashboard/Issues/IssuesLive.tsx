"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, MessageSquare, Plus, RefreshCw, Send, XCircle } from "lucide-react";
import { useAuth } from "@/services/auth/context";
import { getApiErrorMessage, getAuthHeaders, parseApiResponse } from "@/lib/http";
import { showToast } from "@/lib/toast";
import styles from "./Issues.module.scss";

type IssueStatus = "open" | "in-progress" | "resolved" | "closed";
type ViewMode = "list" | "new" | "detail";

interface IssueMessage {
  by: "user" | "admin";
  text: string;
  createdAt: string;
}

interface Issue {
  _id: string;
  issueRef: string;
  subject: string;
  description: string;
  status: IssueStatus;
  bookingRef?: string;
  createdAt: string;
  updatedAt: string;
  adminNote?: string;
  messages: IssueMessage[];
}

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

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
};

export default function IssuesLivePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [view, setView] = useState<ViewMode>("list");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [reopenComment, setReopenComment] = useState("");

  const [adminStatus, setAdminStatus] = useState<IssueStatus>("open");
  const [adminNote, setAdminNote] = useState("");

  const title = isAdmin ? "Complaints (All Users)" : "Issues & Complaints";

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const url = isAdmin ? "/api/users/issues/admin" : "/api/users/me/issues";
      const res = await fetch(url, { headers: getAuthHeaders() });
      const parsed = await parseApiResponse<{ items: Issue[] }>(res, "Unable to load complaints.");
      if (!parsed.ok) throw new Error(getApiErrorMessage(parsed));
      setIssues(parsed.payload?.data?.items || []);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unable to load complaints.";
      showToast.error(msg);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Auto-refresh for both user and admin views so status changes reflect without manual refresh.
  useEffect(() => {
    const id = setInterval(() => { void fetchIssues(); }, 12_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedIssue) return;
    const latest = issues.find((entry) => entry._id === selectedIssue._id);
    if (!latest) return;

    setSelectedIssue(latest);
    if (isAdmin) {
      setAdminStatus(latest.status);
      setAdminNote(latest.adminNote || "");
    }
  }, [isAdmin, issues, selectedIssue]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users/me/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ subject, description, bookingRef }),
      });
      const parsed = await parseApiResponse<Issue>(res, "Unable to submit complaint.");
      if (!parsed.ok) throw new Error(getApiErrorMessage(parsed));
      showToast.success("Complaint submitted.");
      setSubject("");
      setDescription("");
      setBookingRef("");
      setView("list");
      await fetchIssues();
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Unable to submit complaint.");
    }
  };

  const openDetails = (issue: Issue) => {
    setSelectedIssue(issue);
    setAdminStatus(issue.status);
    setAdminNote(issue.adminNote || "");
    setReopenComment("");
    setView("detail");
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    try {
      const res = await fetch(`/api/users/me/issues/${selectedIssue._id}/reopen`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ comment: reopenComment }),
      });
      const parsed = await parseApiResponse<Issue>(res, "Unable to reopen issue.");
      if (!parsed.ok) throw new Error(getApiErrorMessage(parsed));
      showToast.success("Issue reopened.");
      await fetchIssues();
      setView("list");
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Unable to reopen issue.");
    }
  };

  const handleAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    try {
      const res = await fetch(`/api/users/issues/admin/${selectedIssue._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status: adminStatus, adminNote }),
      });
      const parsed = await parseApiResponse<Issue>(res, "Unable to update issue.");
      if (!parsed.ok) throw new Error(getApiErrorMessage(parsed));
      showToast.success("Complaint updated.");
      await fetchIssues();
      setView("list");
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "Unable to update issue.");
    }
  };

  const sortedIssues = useMemo(() => {
    return [...issues].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [issues]);

  return (
    <div className={styles.page}>
      {view === "list" && (
        <>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.subtitle}>{isAdmin ? "View and manage user complaints" : "Track your complaints or raise a new one"}</p>
            </div>
            {!isAdmin && (
              <button className={styles.newBtn} onClick={() => setView("new")}>
                <Plus size={14} strokeWidth={1.8} /> Raise New Complaint
              </button>
            )}
          </div>

          {loading ? (
            <div className={styles.empty}>Loading complaints...</div>
          ) : sortedIssues.length === 0 ? (
            <div className={styles.empty}>No complaints found.</div>
          ) : (
            <div className={styles.issueList}>
              {sortedIssues.map((issue) => (
                <div key={issue._id} className={styles.issueCard}>
                  <div className={styles.issueTop}>
                    <span className={styles.issueId}>{issue.issueRef}</span>
                    <span className={`${styles.statusBadge} ${styles[issue.status.replace("-", "")]}`}>
                      {statusIcon(issue.status)}
                      {statusLabel(issue.status)}
                    </span>
                  </div>
                  <h3 className={styles.issueSubject}>{issue.subject}</h3>
                  <p className={styles.issueDesc}>{issue.description}</p>
                  <div className={styles.issueMeta}>
                    {issue.bookingRef && <span className={styles.metaItem}>Ref: {issue.bookingRef}</span>}
                    <span className={styles.metaItem}>Created: {fmtDate(issue.createdAt)}</span>
                    <span className={styles.metaItem}>Updated: {fmtDate(issue.updatedAt)}</span>
                    <span className={styles.metaItem}><MessageSquare size={12} strokeWidth={1.4} />{issue.messages.length} messages</span>
                  </div>
                  <button className={styles.viewBtn} onClick={() => openDetails(issue)}>
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === "new" && !isAdmin && (
        <>
          <div className={styles.header}>
            <div>
              <button className={styles.backBtn} onClick={() => setView("list")}>
                <ArrowLeft size={16} strokeWidth={1.6} /> Back to Issues
              </button>
              <h1 className={styles.title} style={{ marginTop: 8 }}>Raise New Complaint</h1>
            </div>
          </div>
          <form className={styles.form} onSubmit={handleCreate}>
            <div className={styles.field}>
              <label className={styles.label}>Subject</label>
              <input className={styles.input} value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Booking Reference (optional)</label>
              <input className={styles.input} value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required />
            </div>
            <button type="submit" className={styles.submitBtn}>
              <Send size={14} strokeWidth={1.6} /> Submit Complaint
            </button>
          </form>
        </>
      )}

      {view === "detail" && selectedIssue && (
        <>
          <div className={styles.header}>
            <div>
              <button className={styles.backBtn} onClick={() => setView("list")}>
                <ArrowLeft size={16} strokeWidth={1.6} /> Back to Issues
              </button>
              <h1 className={styles.title} style={{ marginTop: 8 }}>Issue Details</h1>
            </div>
          </div>

          <div className={styles.detailCard}>
            <div className={styles.detailHeader}>
              <span className={styles.issueId}>{selectedIssue.issueRef}</span>
              <span className={`${styles.statusBadge} ${styles[selectedIssue.status.replace("-", "")]}`}>
                {statusIcon(selectedIssue.status)}
                {statusLabel(selectedIssue.status)}
              </span>
            </div>
            <h2 className={styles.detailSubject}>{selectedIssue.subject}</h2>
            <div className={styles.detailSection}>
              <p className={styles.detailSectionLabel}>Complaint</p>
              <p className={styles.detailBody}>{selectedIssue.description}</p>
            </div>
            {selectedIssue.adminNote && (
              <div className={styles.adminNoteBox}>
                <p className={styles.detailSectionLabel}>Admin Response</p>
                <p className={styles.detailBody}>{selectedIssue.adminNote}</p>
              </div>
            )}

            {isAdmin ? (
              <form className={styles.reopenForm} onSubmit={handleAdminUpdate}>
                <p className={styles.label}>Update Status</p>
                <select className={styles.input} value={adminStatus} onChange={(e) => setAdminStatus(e.target.value as IssueStatus)}>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <p className={styles.label}>Admin Note</p>
                <textarea className={styles.textarea} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={4} />
                <button type="submit" className={styles.submitBtn}>
                  <CheckCircle2 size={14} strokeWidth={1.6} /> Save Update
                </button>
              </form>
            ) : (selectedIssue.status === "resolved" || selectedIssue.status === "closed") ? (
              <form className={styles.reopenForm} onSubmit={handleReopen}>
                <p className={styles.label}>Not satisfied? Reopen with comments</p>
                <textarea className={styles.textarea} value={reopenComment} onChange={(e) => setReopenComment(e.target.value)} rows={4} required />
                <button type="submit" className={styles.reopenBtn}>
                  <RefreshCw size={14} strokeWidth={1.6} /> Reopen Issue
                </button>
              </form>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
