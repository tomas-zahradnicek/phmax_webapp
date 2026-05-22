import { useCallback, useState } from "react";

type UseQuickOnboardingOptions = {
  /** Po otevření posune stránku na panel nápovědy. */
  scrollAnchorId?: string;
};

/** Nápověda je výchozí zavřená; otevře se jen přes tlačítko (toggleGuide / openGuide). */
export function useQuickOnboarding(_storageKey: string, options?: UseQuickOnboardingOptions) {
  const [guideOpen, setGuideOpen] = useState(false);

  const dismissGuide = useCallback(() => {
    setGuideOpen(false);
  }, []);

  const openGuide = useCallback(() => {
    setGuideOpen(true);
    const anchorId = options?.scrollAnchorId;
    if (!anchorId) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, [options?.scrollAnchorId]);

  const toggleGuide = useCallback(() => {
    if (guideOpen) dismissGuide();
    else openGuide();
  }, [dismissGuide, guideOpen, openGuide]);

  return { guideOpen, dismissGuide, openGuide, toggleGuide };
}
