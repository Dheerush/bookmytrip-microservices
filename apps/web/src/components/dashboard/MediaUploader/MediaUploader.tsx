"use client";

import { useEffect, useState } from "react";
import { uploadMediaFile } from "@/services/media/api";
import styles from "./MediaUploader.module.scss";

interface MediaUploaderProps {
  defaultFolder?: string;
  onUploaded?: (url: string, publicId: string) => void;
}

export default function MediaUploader({ defaultFolder = "general", onUploaded }: MediaUploaderProps) {
  const [folder, setFolder] = useState(defaultFolder);
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; publicId: string } | null>(null);

  useEffect(() => {
    if (!file) {
      setLocalPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

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
    <div className={styles.uploader}>
      <h3 className={styles.title}>Media Upload</h3>
      <p className={styles.subtitle}>
        Use nested folders like hotels/grand-hyatt/lobby or users/avatars/admin.
      </p>

      <label className={styles.field}>
        <span>Folder</span>
        <input value={folder} onChange={(e) => setFolder(e.target.value)} />
      </label>

      <input className={styles.fileInput} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />

      <button type="button" onClick={upload} disabled={loading} className={styles.uploadBtn}>
        {loading ? "Uploading..." : "Upload"}
      </button>

      {(localPreview || result) && (
        <div className={styles.previewGrid}>
          {localPreview && (
            <article className={styles.previewCard}>
              <h4>Selected Preview</h4>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={localPreview} alt="Local preview" />
            </article>
          )}
          {result?.url && (
            <article className={styles.previewCard}>
              <h4>Uploaded Preview</h4>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.url} alt="Uploaded preview" />
            </article>
          )}
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
      {result && (
        <div className={styles.meta}>
          <div><strong>publicId:</strong> {result.publicId}</div>
          <div><strong>url:</strong> {result.url}</div>
        </div>
      )}
    </div>
  );
}
