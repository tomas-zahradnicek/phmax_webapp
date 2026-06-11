import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const TOAST_MS = 4200;

export type UiToastOptions = {
  /** Důležité zprávy (import, export) – čtečky obrazovky oznámí ihned. */
  assertive?: boolean;
};

type ToastItem = {
  id: number;
  message: string;
  assertive: boolean;
};

let pushToast: ((message: string, options?: UiToastOptions) => void) | null = null;

/** Krátké potvrzení akce (uložení, export, …) – viditelné i mimo patičku stránky. */
export function showUiToast(message: string, options?: UiToastOptions): void {
  const text = message.trim();
  if (!text || !pushToast) return;
  pushToast(text, options);
}

export function UiToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    pushToast = (message: string, options?: UiToastOptions) => {
      const id = ++seq.current;
      setItems((prev) => [...prev.slice(-2), { id, message, assertive: Boolean(options?.assertive) }]);
      window.setTimeout(() => dismiss(id), TOAST_MS);
    };
    return () => {
      pushToast = null;
    };
  }, [dismiss]);

  if (items.length === 0 || typeof document === "undefined") return null;

  const stack = (
    <div className="ui-toast-stack">
      {items.map((item) => (
        <div
          key={item.id}
          className="ui-toast"
          role="status"
          aria-live={item.assertive ? "assertive" : "polite"}
          aria-atomic="true"
        >
          {item.message}
        </div>
      ))}
    </div>
  );

  return createPortal(stack, document.body);
}
