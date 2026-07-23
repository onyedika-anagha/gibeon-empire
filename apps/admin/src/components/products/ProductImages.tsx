"use client";

import { useState } from "react";
import { api, type AdminMedia } from "@/lib/api";
import ImageUploader from "@/components/ImageUploader";

// Manages the image gallery for a single existing product: shows thumbnails,
// removes on click, and appends freshly uploaded Cloudinary images.
export default function ProductImages({
  productId,
  media,
  onChanged,
}: {
  productId: string;
  media: AdminMedia[];
  onChanged: () => void;
}) {
  const [error, setError] = useState("");

  async function remove(mediaId: string) {
    setError("");
    try {
      await api.deleteProductMedia(mediaId);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove image");
    }
  }

  async function add(url: string) {
    await api.addProductMedia(productId, { url });
    onChanged();
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Images</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {media.map((m) => (
          <div key={m.id} className="group relative size-16 overflow-hidden rounded-lg border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt={m.alt ?? ""} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => void remove(m.id)}
              aria-label="Remove image"
              className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-background/90 text-danger opacity-0 shadow-sm transition group-hover:opacity-100"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <ImageUploader onUploaded={add} label={media.length ? "Add" : "Add image"} />
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}
