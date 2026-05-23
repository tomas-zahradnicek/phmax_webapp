import { useCallback, useState } from "react";
import { showUiToast } from "./ui-toast";

/** Stav hlášky + toast při každé neprázdné zprávě. */
export function useUiNotice(initial = ""): readonly [string, (message: string) => void] {
  const [notice, setNotice] = useState(initial);
  const publish = useCallback((message: string) => {
    setNotice(message);
    if (message.trim()) showUiToast(message);
  }, []);
  return [notice, publish] as const;
}
