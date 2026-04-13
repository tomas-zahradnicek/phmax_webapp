import { type RefCallback, useCallback, useRef } from "react";

const OVERFLOW_CLASS = "scroll-x--overflow";

function subscribeHorizontalOverflow(el: HTMLElement): () => void {
  const update = () => {
    el.classList.toggle(OVERFLOW_CLASS, el.scrollWidth > el.clientWidth + 1);
  };

  update();

  const ro = new ResizeObserver(update);
  ro.observe(el);

  const mo = new MutationObserver(() => {
    requestAnimationFrame(update);
  });
  mo.observe(el, { subtree: true, childList: true, characterData: true, attributes: true });

  const win = el.ownerDocument.defaultView;
  win?.addEventListener("resize", update);

  return () => {
    ro.disconnect();
    mo.disconnect();
    win?.removeEventListener("resize", update);
    el.classList.remove(OVERFLOW_CLASS);
  };
}

/**
 * Ref callback: při horizontálním přetečení obsahu přidá třídu pro kurzor grab/grabbing (styly v CSS).
 */
export function useHorizontalOverflowGrabRef<T extends HTMLElement>(): RefCallback<T> {
  const detachRef = useRef<(() => void) | null>(null);

  return useCallback((node: T | null) => {
    detachRef.current?.();
    detachRef.current = null;
    if (node) {
      detachRef.current = subscribeHorizontalOverflow(node);
    }
  }, []);
}
