import { useCallback, useState } from "react";

type UseQuickOnboardingOptions = {
  /** Po otevření posune stránku na panel nápovědy. */
  scrollAnchorId?: string;
};

export function useQuickOnboarding(storageKey: string, options?: UseQuickOnboardingOptions) {
  const [guideOpen, setGuideOpen] = useState(() => {
    try {
      return localStorage.getItem(storageKey) !== "1";
    } catch {
      return true;
    }
  });

  const dismissGuide = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setGuideOpen(false);
  }, [storageKey]);

  const openGuide = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setGuideOpen(true);
    const anchorId = options?.scrollAnchorId;
    if (!anchorId) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, [options?.scrollAnchorId, storageKey]);

  const toggleGuide = useCallback(() => {
    if (guideOpen) dismissGuide();
    else openGuide();
  }, [dismissGuide, guideOpen, openGuide]);

  return { guideOpen, dismissGuide, openGuide, toggleGuide };
}
