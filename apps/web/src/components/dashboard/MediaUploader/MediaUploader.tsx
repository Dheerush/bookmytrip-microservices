"use client";

import { useState } from "react";
import { uploadMediaFile } from "@/services/media/api";

interface MediaUploaderProps {
  defaultFolder?: string;
  onUploaded?: (url: string, publicId: string) => void;
}

export default function MediaUploader({ defaultFolder = "general", onUploaded }: MediaUploaderProps) {
  const [folder, setFolder] = useState(defaultFolder);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; publicId: string } | null>(null);

  const upload = async () => {
    if (!file) {
      setError("Please choose a file first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const uploaded = await uploadMediaFile(file, folder || "general");
      const mediaResult = { url: uploaded.url, publicId: uploaded.publicId };
      setResult(mediaResult);
      onUploaded?.(mediaResult.url, mediaResult.publicId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 10, padding: 14, border: "1px solid var(--border-soft)", borderRadius: 12, background: "var(--paper)" }}>
      <h3 style={{ margin: 0, fontSize: "1rem" }}>Media Upload</h3>
      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
        Use nested folders like hotels/grand-hyatt/lobby or users/avatars/admin.
      </p>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13 }}>Folder</span>
        <input value={folder} onChange={(e) => setFolder(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-soft)" }} />
      </label>

      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />

      <button type="button" onClick={upload} disabled={loading} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-soft)", background: "var(--sky)", color: "white", cursor: "pointer" }}>
        {loading ? "Uploading..." : "Upload"}
      </button>

      {error && <div style={{ color: "crimson", fontSize: 13 }}>{error}</div>}
      {result && (
        <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
          <div><strong>publicId:</strong> {result.publicId}</div>
          <div style={{ wordBreak: "break-all" }}><strong>url:</strong> {result.url}</div>
        </div>
      )}
    </div>
  );
}
