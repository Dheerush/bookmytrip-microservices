"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MediaUploader from "@/components/dashboard/MediaUploader/MediaUploader";
import { useAuth } from "@/services/auth/context";
import {
  InventoryEntity,
  createInventory,
  deactivateInventory,
  listInventory,
  updateInventory,
} from "@/services/inventory/api";

const ENTITIES: Array<{ id: InventoryEntity; label: string; defaultCreatePayload: string; defaultUpdatePayload: string }> = [
  {
    id: "flights",
    label: "Flights",
    defaultCreatePayload: JSON.stringify({ flightCode: "BT-999", airline: "BookMyTrip Air" }, null, 2),
    defaultUpdatePayload: JSON.stringify({ rating: 4.6 }, null, 2),
  },
  {
    id: "trains",
    label: "Trains",
    defaultCreatePayload: JSON.stringify({ trainNumber: "12999", name: "Sample Train" }, null, 2),
    defaultUpdatePayload: JSON.stringify({ rating: 4.4 }, null, 2),
  },
  {
    id: "hotels",
    label: "Hotels",
    defaultCreatePayload: JSON.stringify({ name: "Sample Hotel", city: "Goa" }, null, 2),
    defaultUpdatePayload: JSON.stringify({ rating: 4.5 }, null, 2),
  },
  {
    id: "cabs",
    label: "Cabs",
    defaultCreatePayload: JSON.stringify({ carModel: "Swift Dzire", city: "Mumbai" }, null, 2),
    defaultUpdatePayload: JSON.stringify({ available: true }, null, 2),
  },
  {
    id: "tours",
    label: "Tours",
    defaultCreatePayload: JSON.stringify({ title: "Sample Goa Tour", city: "Goa" }, null, 2),
    defaultUpdatePayload: JSON.stringify({ basePrice: 15999 }, null, 2),
  },
];

const extractId = (row: any): string => row?._id || row?.id || "";

export default function AdminInventoryPage() {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  const [entity, setEntity] = useState<InventoryEntity>("flights");
  const [items, setItems] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedEntity = useMemo(() => ENTITIES.find((entry) => entry.id === entity)!, [entity]);
  const [createPayloadText, setCreatePayloadText] = useState(selectedEntity.defaultCreatePayload);
  const [updatePayloadText, setUpdatePayloadText] = useState(selectedEntity.defaultUpdatePayload);
  const [targetId, setTargetId] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (user?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [hydrated, user?.role, router]);

  useEffect(() => {
    setCreatePayloadText(selectedEntity.defaultCreatePayload);
    setUpdatePayloadText(selectedEntity.defaultUpdatePayload);
    setTargetId("");
    setItems([]);
  }, [selectedEntity]);

  if (!hydrated || user?.role !== "admin") return null;

  const refreshList = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const result = await listInventory(entity, { page: 1, limit: 20 });
      setItems(result.items);
      setMessage(`Fetched ${result.items.length} ${entity}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to fetch ${entity}.`);
    } finally {
      setLoading(false);
    }
  };

  const createItem = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const payload = JSON.parse(createPayloadText);
      await createInventory(entity, payload);
      setMessage(`${selectedEntity.label.slice(0, -1)} created successfully.`);
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to create ${entity}.`);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async () => {
    if (!targetId) {
      setError("Enter a valid item ID to update.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const payload = JSON.parse(updatePayloadText);
      await updateInventory(entity, targetId, payload);
      setMessage(`${selectedEntity.label.slice(0, -1)} updated successfully.`);
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to update ${entity}.`);
    } finally {
      setLoading(false);
    }
  };

  const deactivateItem = async () => {
    if (!targetId) {
      setError("Enter a valid item ID to deactivate.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      await deactivateInventory(entity, targetId);
      setMessage(`${selectedEntity.label.slice(0, -1)} deactivated successfully.`);
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to deactivate ${entity}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <h1 style={{ margin: 0, fontSize: "1.65rem" }}>Inventory Management</h1>
      <p style={{ margin: 0, color: "var(--text-muted)" }}>
        Live backend operations for flights, trains, hotels, cabs and tours. Use media uploader for image URLs.
      </p>

      <MediaUploader defaultFolder="hotels/general" />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {ENTITIES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setEntity(entry.id)}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid var(--border-soft)",
              background: entry.id === entity ? "var(--sky)" : "var(--paper)",
              color: entry.id === entity ? "white" : "inherit",
              cursor: "pointer",
            }}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <div style={{ display: "grid", gap: 8, padding: 14, border: "1px solid var(--border-soft)", borderRadius: 12, background: "var(--paper)" }}>
          <h3 style={{ margin: 0 }}>Fetch/List</h3>
          <button type="button" onClick={refreshList} disabled={loading} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-soft)", cursor: "pointer" }}>
            {loading ? "Loading..." : `Fetch ${selectedEntity.label}`}
          </button>
        </div>

        <div style={{ display: "grid", gap: 8, padding: 14, border: "1px solid var(--border-soft)", borderRadius: 12, background: "var(--paper)" }}>
          <h3 style={{ margin: 0 }}>Target Item</h3>
          <input
            placeholder="Enter item ID for update/deactivate"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-soft)" }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <div style={{ display: "grid", gap: 8, padding: 14, border: "1px solid var(--border-soft)", borderRadius: 12, background: "var(--paper)" }}>
          <h3 style={{ margin: 0 }}>Create {selectedEntity.label.slice(0, -1)}</h3>
          <textarea value={createPayloadText} onChange={(e) => setCreatePayloadText(e.target.value)} rows={10} style={{ width: "100%", resize: "vertical", borderRadius: 8, border: "1px solid var(--border-soft)", padding: 10, fontFamily: "monospace", fontSize: 12 }} />
          <button type="button" onClick={createItem} disabled={loading} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-soft)", cursor: "pointer" }}>
            Create
          </button>
        </div>

        <div style={{ display: "grid", gap: 8, padding: 14, border: "1px solid var(--border-soft)", borderRadius: 12, background: "var(--paper)" }}>
          <h3 style={{ margin: 0 }}>Update {selectedEntity.label.slice(0, -1)}</h3>
          <textarea value={updatePayloadText} onChange={(e) => setUpdatePayloadText(e.target.value)} rows={10} style={{ width: "100%", resize: "vertical", borderRadius: 8, border: "1px solid var(--border-soft)", padding: 10, fontFamily: "monospace", fontSize: 12 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={updateItem} disabled={loading} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-soft)", cursor: "pointer" }}>
              Update
            </button>
            <button type="button" onClick={deactivateItem} disabled={loading} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-soft)", cursor: "pointer", color: "crimson" }}>
              Deactivate
            </button>
          </div>
        </div>
      </div>

      {message && <div style={{ color: "green" }}>{message}</div>}
      {error && <div style={{ color: "crimson" }}>{error}</div>}

      <div style={{ display: "grid", gap: 8 }}>
        <h3 style={{ margin: 0 }}>Latest {selectedEntity.label}</h3>
        {items.length === 0 ? (
          <div style={{ color: "var(--text-muted)" }}>No records loaded yet. Click fetch.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {items.map((item) => {
              const id = extractId(item);
              return (
                <article key={id || JSON.stringify(item).slice(0, 40)} style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border-soft)", background: "var(--paper)" }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>ID: {id || "N/A"}</div>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12 }}>{JSON.stringify(item, null, 2)}</pre>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
