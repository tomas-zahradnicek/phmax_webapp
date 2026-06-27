import { useEffect, useRef } from "react";
import { useSchoolProfile } from "./use-school-profile";

/** Jednorázové předvyplnění prázdného exportního označení názvem školy z profilu. */
export function usePrefillExportLabelFromSchoolProfile(
  exportLabel: string,
  setExportLabel: (value: string) => void,
): void {
  const { profile } = useSchoolProfile();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current || exportLabel.trim()) return;
    const name = profile.name.trim();
    if (!name) return;
    setExportLabel(name);
    applied.current = true;
  }, [exportLabel, profile.name, setExportLabel]);
}
