"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export default function InstallPrompt() {
  const { visible, ios, promptInstall, dismiss } = useInstallPrompt();
  if (!visible) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2.5 text-sm text-ink">
      {ios ? (
        <p>
          Install this app: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
        </p>
      ) : (
        <p>Install Gibeon POS for offline access and a faster till.</p>
      )}
      <div className="flex shrink-0 items-center gap-2">
        {!ios && (
          <button
            onClick={promptInstall}
            className="rounded-lg bg-gold px-3 py-1.5 text-xs font-medium text-gold-ink transition hover:opacity-90"
          >
            Install
          </button>
        )}
        <button onClick={dismiss} aria-label="Dismiss" className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:text-ink">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
