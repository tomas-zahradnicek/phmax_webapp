import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const TOAST_MS = 4200;

type ToastItem = {
  id: number;
  message: string;
};

let pushToast: ((message: string) => void) | null = null;

/** Krátké potvrzení akce (uložení, export, …) – viditelné i mimo patičku stránky. */
export function showUiToast(message: string): void {
  const text = message.trim();
  if (!text || !pushToast) return;
  pushToast(text);
}

export function UiToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    pushToast = (message: string) => {
      const id = ++seq.current;
      setItems((prev) => [...prev.slice(-2), { id, message }]);
      window.setTimeout(() => dismiss(id), TOAST_MS);
    };
    return () => {
      pushToast = null;
    };
  }, [dismiss]);

  if (items.length === 0 || typeof document === "undefined") return null;

  const stack = (
    <div className="ui-toast-stack" aria-live="polite" aria-atomic="true">
      {items.map((item) => (
        <div key={item.id} className="ui-toast" role="status">
          {item.message}
        </div>
      ))}
    </div>
  );

  return createPortal(stack, document.body);
}
