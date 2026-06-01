import type { PhmaxIsHandoffPayload } from "./phmax-is-export-adapter";

export const PHMAX_IS_ENDPOINT_LS_KEY = "phmax-is-handoff-endpoint";

export function readPhmaxIsEndpoint(): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(PHMAX_IS_ENDPOINT_LS_KEY)?.trim() ?? "";
}

export function writePhmaxIsEndpoint(url: string): void {
  if (typeof localStorage === "undefined") return;
  const trimmed = url.trim();
  if (trimmed) localStorage.setItem(PHMAX_IS_ENDPOINT_LS_KEY, trimmed);
  else localStorage.removeItem(PHMAX_IS_ENDPOINT_LS_KEY);
}

export type PhmaxIsHandoffPostResult =
  | { ok: true; status: number }
  | { ok: false; message: string };

/**
 * Volitelné odeslání handoff JSON na endpoint školy (integrátor nastaví URL v dashboardu).
 * Bez platné URL pouze stáhněte JSON tlačítkem v UI.
 */
export async function postPhmaxIsHandoff(
  endpoint: string,
  payload: PhmaxIsHandoffPayload,
): Promise<PhmaxIsHandoffPostResult> {
  const url = endpoint.trim();
  if (!url) return { ok: false, message: "Chybí URL endpointu IS." };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, message: `Server odpověděl HTTP ${res.status}.` };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Síťová chyba při odeslání." };
  }
}
