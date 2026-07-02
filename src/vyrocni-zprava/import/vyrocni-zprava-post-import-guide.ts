import type { AnnualReportPublicationBlock } from "../vyrocni-zprava-types";
import type { AnnualReportImportPreviewSummary } from "./vyrocni-zprava-xlsx-import-preview";
import type { AnnualReportXlsxImportResult } from "./vyrocni-zprava-xlsx-import-types";
import type { VyrocniZpravaPostImportGuideData } from "./VyrocniZpravaPostImportGuide";

const SECTION_IDS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14"] as const;

function hasAnyText(value?: string): boolean {
  return (value ?? "").trim().length > 0;
}

function hasAnySectionData(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return hasAnyText(value);
  if (typeof value === "number") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).some((item) => hasAnySectionData(item));
  return false;
}

function hasAnyPublicationBlockData(block: AnnualReportPublicationBlock | undefined): boolean {
  if (!block) return false;
  return Object.values(block).some((value) => hasAnyText(value));
}

export function buildXlsxPostImportGuide(
  preview: AnnualReportImportPreviewSummary,
  result: AnnualReportXlsxImportResult,
): VyrocniZpravaPostImportGuideData {
  const setupItems: string[] = [];
  if (result.profilePatch && Object.keys(result.profilePatch).length > 0) {
    setupItems.push("školní rok a profil školy");
  }
  if (result.publicationBlockPatch && hasAnyPublicationBlockData(result.publicationBlockPatch)) {
    setupItems.push("Schválení a zveřejnění");
  }

  return {
    sourceLabel: "XLSX importu",
    setupItems,
    chapterIds: preview.sectionSummaries.filter((section) => section.detected).map((section) => section.id),
  };
}

type JsonBackupPayload = {
  schoolProfile?: unknown;
  publicationBlock?: AnnualReportPublicationBlock;
  section01Data?: unknown;
  section02Data?: unknown;
  section03Data?: unknown;
  section04Data?: unknown;
  section05Data?: unknown;
  section06Data?: unknown;
  section07Data?: unknown;
  section08Data?: unknown;
  section09Data?: unknown;
  section10Data?: unknown;
  section11Data?: unknown;
  section12Data?: unknown;
  section13Data?: unknown;
  section14Data?: unknown;
};

export function buildJsonPostImportGuide(payload: JsonBackupPayload): VyrocniZpravaPostImportGuideData {
  const setupItems: string[] = [];
  if (hasAnySectionData(payload.schoolProfile)) {
    setupItems.push("školní rok a profil školy");
  }
  if (hasAnyPublicationBlockData(payload.publicationBlock)) {
    setupItems.push("Schválení a zveřejnění");
  }

  const sectionTargets: Array<{ id: (typeof SECTION_IDS)[number]; data: unknown }> = [
    { id: "01", data: payload.section01Data },
    { id: "02", data: payload.section02Data },
    { id: "03", data: payload.section03Data },
    { id: "04", data: payload.section04Data },
    { id: "05", data: payload.section05Data },
    { id: "06", data: payload.section06Data },
    { id: "07", data: payload.section07Data },
    { id: "08", data: payload.section08Data },
    { id: "09", data: payload.section09Data },
    { id: "10", data: payload.section10Data },
    { id: "11", data: payload.section11Data },
    { id: "12", data: payload.section12Data },
    { id: "13", data: payload.section13Data },
    { id: "14", data: payload.section14Data },
  ];

  return {
    sourceLabel: "obnovy JSON zálohy",
    setupItems,
    chapterIds: sectionTargets.filter((item) => hasAnySectionData(item.data)).map((item) => item.id),
  };
}
