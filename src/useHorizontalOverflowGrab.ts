import { type RefCallback, useCallback, useRef } from "react";

const OVERFLOW_CLASS = "scroll-x--overflow";

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest("input, select, textarea, button, a, [role='button'], label");
}

function attachScrollGrabRegion(el: HTMLElement): () => void {
  const updateOverflow = () => {
    const overflow = el.scrollWidth > el.clientWidth + 1;
    el.classList.toggle(OVERFLOW_CLASS, overflow);
    el.tabIndex = overflow ? 0 : -1;
  };

  updateOverflow();

  const ro = new ResizeObserver(() => updateOverflow());
  ro.observe(el);

  let raf = 0;
  const scheduleUpdate = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(updateOverflow);
  };
  const mo = new MutationObserver(scheduleUpdate);
  mo.observe(el, { subtree: true, childList: true, characterData: true, attributes: true });

  const win = el.ownerDocument.defaultView;
  win?.addEventListener("resize", updateOverflow);

  let dragPointerId: number | null = null;
  let dragStartX = 0;
  let dragStartScroll = 0;

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    if (isInteractiveTarget(e.target)) return;
    if (el.scrollWidth <= el.clientWidth + 1) return;
    dragPointerId = e.pointerId;
    dragStartX = e.clientX;
    dragStartScroll = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
    el.style.userSelect = "none";
  };

  const onPointerMove = (e: PointerEvent) => {
    if (dragPointerId == null || e.pointerId !== dragPointerId) return;
    el.scrollLeft = dragStartScroll - (e.clientX - dragStartX);
  };

  const endDrag = (e: PointerEvent) => {
    if (dragPointerId == null || e.pointerId !== dragPointerId) return;
    try {
      el.releasePointerCapture(dragPointerId);
    } catch {
      /* ignore */
    }
    dragPointerId = null;
    el.style.userSelect = "";
  };

  const onWheel = (e: WheelEvent) => {
    if (el.scrollWidth <= el.clientWidth + 1) return;
    if (!e.shiftKey) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (delta !== 0) {
      e.preventDefault();
      el.scrollLeft += delta;
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (el.scrollWidth <= el.clientWidth + 1) return;
    if (document.activeElement !== el) return;
    const step = Math.min(120, Math.max(40, Math.round(el.clientWidth * 0.2)));
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      el.scrollLeft -= step;
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      el.scrollLeft += step;
    }
  };

  el.addEventListener("pointerdown", onPointerDown);
  el.addEventListener("pointermove", onPointerMove);
  el.addEventListener("pointerup", endDrag);
  el.addEventListener("pointercancel", endDrag);
  el.addEventListener("wheel", onWheel, { passive: false });
  el.addEventListener("keydown", onKeyDown);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    mo.disconnect();
    win?.removeEventListener("resize", updateOverflow);
    el.removeEventListener("pointerdown", onPointerDown);
    el.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("pointerup", endDrag);
    el.removeEventListener("pointercancel", endDrag);
    el.removeEventListener("wheel", onWheel);
    el.removeEventListener("keydown", onKeyDown);
    el.classList.remove(OVERFLOW_CLASS);
    el.style.userSelect = "";
    el.removeAttribute("tabindex");
    if (dragPointerId != null) {
      try {
        el.releasePointerCapture(dragPointerId);
      } catch {
        /* ignore */
      }
    }
  };
}

/**
 * Ref callback: při přetečení přidá třídu pro kurzor grab, tabindex pro šipky,
 * tažení myší, Shift+kolečko a šipky vlevo/vpravo.
 */
export function useHorizontalOverflowGrabRef<T extends HTMLElement>(): RefCallback<T> {
  const detachRef = useRef<(() => void) | null>(null);

  return useCallback((node: T | null) => {
    detachRef.current?.();
    detachRef.current = null;
    if (node) {
      detachRef.current = attachScrollGrabRegion(node);
    }
  }, []);
}
