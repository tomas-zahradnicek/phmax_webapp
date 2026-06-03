export type OpenPrintHtmlResult = { ok: true } | { ok: false; reason: "blocked" | "failed" };

/** Otevře HTML pro tisk přes blob URL (document.write na about:blank s noopener selhává). */
export function openPrintHtmlWindow(html: string): OpenPrintHtmlResult {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    return { ok: false, reason: "blocked" };
  }

  const cleanup = () => URL.revokeObjectURL(url);
  const triggerPrint = () => {
    try {
      win.focus();
      win.print();
    } catch {
      cleanup();
      return;
    }
    cleanup();
  };

  win.addEventListener("load", () => setTimeout(triggerPrint, 300), { once: true });
  return { ok: true };
}
