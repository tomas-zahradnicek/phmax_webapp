import { downloadTextFile, exportFilenameStamped } from "./export-utils";
import type { PhmaxProductAuditProtocol } from "./phmax-product-audit-types";
import type { CompareProductVariantsResult } from "./phmax-product-compare";

export function downloadPhmaxProductAuditJson(protocol: PhmaxProductAuditProtocol, productSlug: string) {
  const body = JSON.stringify(protocol, null, 2);
  downloadTextFile(
    exportFilenameStamped(`phmax-${productSlug}-audit`, "json"),
    body,
    "application/json;charset=utf-8",
  );
}

export function downloadPhmaxProductCompareJson(result: CompareProductVariantsResult, productSlug: string) {
  const body = JSON.stringify(result, null, 2);
  downloadTextFile(
    exportFilenameStamped(`phmax-${productSlug}-compare`, "json"),
    body,
    "application/json;charset=utf-8",
  );
}
