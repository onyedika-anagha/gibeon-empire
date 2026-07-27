"use client";

import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "gibeon.pos.installDismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Android/desktop Chrome fire `beforeinstallprompt`, which this captures and
 * replays on demand. Safari on iOS never fires it, so there's no native
 * prompt to trigger — those users just get "Add to Home Screen" instructions.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIos());
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");

    // layout.tsx's inline script may have already captured the event before
    // this effect ran (see installBoot) — pick it up if so.
    const stashed = (window as unknown as { __gibeonInstallPrompt?: BeforeInstallPromptEvent }).__gibeonInstallPrompt;
    if (stashed) setDeferred(stashed);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }, [deferred]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }, []);

  return {
    visible: !installed && !dismissed && (Boolean(deferred) || ios),
    ios,
    promptInstall,
    dismiss,
  };
}
