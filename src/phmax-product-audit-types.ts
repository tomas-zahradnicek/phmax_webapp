/**
 * Společný tvar auditního protokolu pro všechny produkty PHmax (PV, ŠD, ZŠ, SŠ).
 * Oddělené výpočty v doménách; jednotná struktura pro export, API a porovnání variant.
 */

export const PHMAX_PRODUCT_AUDIT_PROTOCOL_VERSION = "1.0.0";

export type PhmaxProductId = "pv" | "sd" | "zs" | "ss";

export type PhmaxProductAuditMeta = {
  product: PhmaxProductId;
  protocolVersion: string;
  createdAtIso: string;
  contextMeta?: Record<string, unknown>;
};

export type PhmaxProductValidationIssue = {
  severity: "error" | "warning" | "info";
  code?: string;
  message: string;
};

export type PhmaxProductAuditValidation = {
  ok: boolean;
  source: string;
  issues: PhmaxProductValidationIssue[];
  raw?: unknown;
};

export type PhmaxProductAuditCalculation =
  | {
      ok: true;
      /** Hlavní metrika: součet PHmax (nebo ekvivalent u produktu). */
      totalPrimary: number | null;
      totalSecondary?: number | null;
      breakdown?: Record<string, unknown>;
      raw?: unknown;
    }
  | { ok: false; error: string };

export type PhmaxProductAuditExplanation =
  | {
      ok: true;
      narrative: string;
      steps?: string[];
      messages?: Array<{ title: string; body: string; severity?: string }>;
      raw?: unknown;
    }
  | { ok: false; error: string };

export type PhmaxProductAuditLegal = {
  consolidated: string[];
  references?: string[];
};

export type PhmaxProductAuditProtocol = {
  meta: PhmaxProductAuditMeta;
  input: unknown;
  validation: PhmaxProductAuditValidation;
  calculation: PhmaxProductAuditCalculation;
  explanation: PhmaxProductAuditExplanation;
  legal: PhmaxProductAuditLegal;
  errors: string[];
};
