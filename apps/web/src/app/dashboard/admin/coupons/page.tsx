"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, ToggleLeft, ToggleRight, X, Tag, Percent, DollarSign } from "lucide-react";
import { useAuth } from "@/services/auth/context";
import { showToast } from "@/lib/toast";
import { getAuthHeaders } from "@/lib/http";
import styles from "./page.module.scss";

interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  startsAt: string;
  endsAt: string;
  usageLimit: number;
  usedCount: number;
  oneTimePerUser?: boolean;
  active: boolean;
  applicableOn: string[];
}

const APPLICABLE_OPTIONS = ["flight", "train", "hotel", "cab", "tour"];

const EMPTY_FORM = {
  code: "",
  description: "",
  discountType: "percent" as "percent" | "fixed",
  discountValue: "",
  minOrderValue: "0",
  maxDiscount: "",
  startsAt: "",
  endsAt: "",
  usageLimit: "1000",
  oneTimePerUser: false,
  active: true,
  applicableOn: [] as string[],
};

export default function AdminCouponsPage() {
  const { user, hydrated } = useAuth();
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filterType, setFilterType] = useState<"all" | string>("all");

  useEffect(() => {
    if (!hydrated) return;
    if (user?.role !== "admin") router.replace("/dashboard");
  }, [hydrated, user?.role, router]);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/coupons", { headers: getAuthHeaders() });
      const data = await res.json() as { data?: { items?: Coupon[] } };
      setCoupons(data?.data?.items || []);
    } catch {
      showToast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hydrated && user?.role === "admin") fetchCoupons();
  }, [hydrated, user?.role, fetchCoupons]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c._id);
    setForm({
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minOrderValue: String(c.minOrderValue),
      maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : "",
      startsAt: c.startsAt.slice(0, 16),
      endsAt: c.endsAt.slice(0, 16),
      usageLimit: String(c.usageLimit),
      oneTimePerUser: Boolean(c.oneTimePerUser),
      active: c.active,
      applicableOn: [...c.applicableOn],
    });
    setShowModal(true);
  };

  const toggleActive = async (c: Coupon) => {
    try {
      await fetch(`/api/admin/coupons/${c._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ active: !c.active }),
      });
      setCoupons((prev) => prev.map((x) => x._id === c._id ? { ...x, active: !x.active } : x));
      showToast.success(`Coupon ${!c.active ? "activated" : "deactivated"}`);
    } catch {
      showToast.error("Failed to update coupon");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.description || !form.discountValue || !form.startsAt || !form.endsAt) {
      showToast.error("Please fill all required fields");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        code: form.code.toUpperCase().trim(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue) || 0,
        ...(form.maxDiscount ? { maxDiscount: Number(form.maxDiscount) } : {}),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        usageLimit: Number(form.usageLimit) || 1000,
        oneTimePerUser: form.oneTimePerUser,
        active: form.active,
        applicableOn: form.applicableOn,
      };

      const url = editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");

      showToast.success(editingId ? "Coupon updated" : "Coupon created");
      setShowModal(false);
      fetchCoupons();
    } catch {
      showToast.error("Failed to save coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleApplicable = (val: string) => {
    setForm((prev) => ({
      ...prev,
      applicableOn: prev.applicableOn.includes(val)
        ? prev.applicableOn.filter((x) => x !== val)
        : [...prev.applicableOn, val],
    }));
  };

  const isExpired = (endsAt: string) => new Date(endsAt) < new Date();
  const isActive = (c: Coupon) => c.active && !isExpired(c.endsAt);

  const visibleCoupons = filterType === "all"
    ? coupons
    : coupons.filter((c) => c.applicableOn.includes(filterType));

  if (!hydrated || user?.role !== "admin") return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Coupons & Deals</h1>
          <p className={styles.subtitle}>Create and manage discount coupons for customers</p>
        </div>
        <button className={styles.createBtn} onClick={openCreate}>
          <Plus size={14} strokeWidth={2} /> New Coupon
        </button>
      </div>
      <div className={styles.filterTabs}>
        {["all", ...APPLICABLE_OPTIONS].map((type) => (
          <button
            key={type}
            className={`${styles.filterTab} ${filterType === type ? styles.filterTabActive : ""}`}
            onClick={() => setFilterType(type)}
          >
            {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1) + "s"}
            {type !== "all" && (
              <span className={styles.filterCount}>
                {coupons.filter((c) => c.applicableOn.includes(type)).length}
              </span>
            )}
            {type === "all" && (
              <span className={styles.filterCount}>{coupons.length}</span>
            )}
          </button>
        ))}
      </div>
      {loading ? (
        <p className={styles.emptyMsg}>Loading coupons...</p>
      ) : visibleCoupons.length === 0 ? (
        <div className={styles.emptyState}>
          <Tag size={32} strokeWidth={1.4} />
          <p>{filterType === "all" ? "No coupons yet. Create your first coupon above." : `No ${filterType} coupons found.`}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {visibleCoupons.map((c) => (
            <motion.div
              key={c._id}
              className={`${styles.card} ${!isActive(c) ? styles.inactive : ""}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.cardTop}>
                <span className={styles.code}>{c.code}</span>
                <span className={`${styles.statusBadge} ${isActive(c) ? styles.active : styles.expired}`}>
                  {isExpired(c.endsAt) ? "Expired" : c.active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className={styles.description}>{c.description}</p>
              <div className={styles.cardMeta}>
                <span className={styles.metaChip}>
                  {c.discountType === "percent"
                    ? <><Percent size={11} /> {c.discountValue}% off</>
                    : <><DollarSign size={11} /> ₹{c.discountValue} off</>}
                </span>
                {c.minOrderValue > 0 && <span className={styles.metaChip}>Min ₹{c.minOrderValue.toLocaleString("en-IN")}</span>}
                {c.maxDiscount != null && <span className={styles.metaChip}>Max ₹{c.maxDiscount.toLocaleString("en-IN")}</span>}
              </div>
              <div className={styles.cardDates}>
                <span>{new Date(c.startsAt).toLocaleDateString("en-IN")} – {new Date(c.endsAt).toLocaleDateString("en-IN")}</span>
                <span className={styles.usage}>{c.usedCount}/{c.usageLimit} used</span>
              </div>
              {c.oneTimePerUser && (
                <div className={styles.applicable}>
                  <span className={styles.serviceTag}>One-time per user</span>
                </div>
              )}
              {c.applicableOn.length > 0 && (
                <div className={styles.applicable}>
                  {c.applicableOn.map((s) => <span key={s} className={styles.serviceTag}>{s}</span>)}
                </div>
              )}
              <div className={styles.cardActions}>
                <button className={styles.actionBtn} onClick={() => openEdit(c)} title="Edit"><Pencil size={13} /></button>
                <button className={styles.actionBtn} onClick={() => toggleActive(c)} title={c.active ? "Deactivate" : "Activate"}>
                  {c.active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>{editingId ? "Edit Coupon" : "New Coupon"}</h2>
                <button className={styles.modalClose} onClick={() => setShowModal(false)}><X size={15} /></button>
              </div>

              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label>Code *</label>
                    <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE200" required />
                  </div>
                  <div className={styles.field}>
                    <label>Discount Type *</label>
                    <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as "percent" | "fixed" }))}>
                      <option value="percent">Percent (%)</option>
                      <option value="fixed">Fixed (₹)</option>
                    </select>
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Description *</label>
                  <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Get 20% off on all flights" required />
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label>Discount Value * {form.discountType === "percent" ? "(%)" : "(₹)"}</label>
                    <input type="number" min="0" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} placeholder={form.discountType === "percent" ? "20" : "200"} required />
                  </div>
                  <div className={styles.field}>
                    <label>Max Discount (₹)</label>
                    <input type="number" min="0" value={form.maxDiscount} onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))} placeholder="1000" />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label>Min Order Value (₹)</label>
                    <input type="number" min="0" value={form.minOrderValue} onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))} placeholder="0" />
                  </div>
                  <div className={styles.field}>
                    <label>Usage Limit</label>
                    <input type="number" min="1" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} placeholder="1000" />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label>Starts At *</label>
                    <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} required />
                  </div>
                  <div className={styles.field}>
                    <label>Ends At *</label>
                    <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} required />
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Applicable On (leave empty for all)</label>
                  <div className={styles.chipGroup}>
                    {APPLICABLE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`${styles.chip} ${form.applicableOn.includes(opt) ? styles.chipSelected : ""}`}
                        onClick={() => toggleApplicable(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                    Active
                  </label>
                </div>

                <div className={styles.field}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.oneTimePerUser}
                      onChange={(e) => setForm((f) => ({ ...f, oneTimePerUser: e.target.checked }))}
                    />
                    Allow only one redemption per user
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className={styles.submitBtn} disabled={submitting}>
                    {submitting ? "Saving..." : editingId ? "Update Coupon" : "Create Coupon"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
