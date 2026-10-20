"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type DeferredPrompt = {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaContextType = {
  canInstall: boolean;
  install: () => Promise<void>;
  dismiss: () => void;
  showPrompt: boolean;
};

const PwaContext = createContext<PwaContextType>({
  canInstall: false,
  install: async () => {},
  dismiss: () => {},
  showPrompt: false,
});

const DISMISSED_KEY = "sts_pwa_prompt_dismissed";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferred, setDeferred] = useState<DeferredPrompt | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone
    ) {
      return;
    }
    const dismissed = localStorage.getItem(DISMISSED_KEY) === "1";
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const evt = e as any;
      setDeferred({
        prompt: () => evt.prompt(),
        userChoice: evt.userChoice,
      });
      if (!dismissed) setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferred(null);
  }, [deferred]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShowPrompt(false);
  }, []);

  return (
    <PwaContext.Provider
      value={{ canInstall: !!deferred, install, dismiss, showPrompt }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function usePwaInstall() {
  return useContext(PwaContext);
}
