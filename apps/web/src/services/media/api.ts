import { parseApiResponse } from "@/lib/http";
import { getAccessToken } from "@/lib/auth-session";

export interface UploadedMedia {
  provider: string;
  publicId: string;
  url: string;
  bytes: number;
  mimeType: string;
  uploadedBy?: string;
}

export const uploadMediaFile = async (file: File, folder: string): Promise<UploadedMedia> => {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  const token = getAccessToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch("/api/media/upload", {
    method: "POST",
    headers,
    body: form,
  });

  const parsed = await parseApiResponse<UploadedMedia>(response, "Unable to upload media.");
  if (!parsed.ok || !parsed.payload?.data) {
    throw new Error(parsed.payload?.message || "Unable to upload media.");
  }

  return parsed.payload.data;
};
