"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

// Picks one or more images, uploads each to Cloudinary, and reports the
// resulting URLs. Stateless about where the URLs go — the parent decides.
export default function ImageUploader({
  onUploaded,
  label = "Upload image",
  className,
}: {
  onUploaded: (url: string) => void | Promise<void>;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      const sig = await api.signUpload(); // one signature is valid for the whole batch
      for (const file of Array.from(files)) {
        const url = await uploadToCloudinary(file, sig);
        await onUploaded(url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => void handle(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition",
          "hover:border-primary hover:text-foreground disabled:opacity-50",
        )}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {busy ? "Uploading…" : label}
      </button>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}
