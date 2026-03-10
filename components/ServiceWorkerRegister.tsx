'use client';

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const registerSW = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch {
        // ignore registration errors; app stays functional
      }
    };

    const timeout = setTimeout(registerSW, 1500);
    return () => clearTimeout(timeout);
  }, []);

  return null;
}

