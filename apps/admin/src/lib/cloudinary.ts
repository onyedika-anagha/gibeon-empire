import type { UploadSignature } from "./api";

// Uploads a file straight to Cloudinary using a server-issued signature.
// The API secret never reaches the browser; only the signed params do.
export async function uploadToCloudinary(file: File, sig: UploadSignature): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(body.error?.message ?? `Upload failed (${res.status})`);
  }
  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}
