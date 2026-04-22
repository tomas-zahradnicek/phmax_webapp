import { describe, expect, it } from "vitest";
import {
  createPvProductAuditProtocol,
  createSdProductAuditProtocol,
  createSsProductAuditProtocol,
  createZsProductAuditProtocol,
} from "./phmax-product-audit";
import { PHMAX_PRODUCT_AUDIT_PROTOCOL_VERSION, type PhmaxProductAuditProtocol } from "./phmax-product-audit-types";
import { phmaxSsDataset } from "./ss/phmax-ss-dataset";
import { ssHeroExampleSnapshot } from "./ss/phmax-ss-hero-examples";
import { buildSsAuditProtocolInput } from "./ss/phmax-ss-units-derive";
import { revivePhmaxSsUnitRow } from "./ss/phmax-ss-types";

function expectAuditSchema(protocol: PhmaxProductAuditProtocol, expectedProduct: "pv" | "sd" | "zs" | "ss") {
  expect(protocol).toHaveProperty("meta");
  expect(protocol).toHaveProperty("input");
  expect(protocol).toHaveProperty("validation");
  expect(protocol).toHaveProperty("calculation");
  expect(protocol).toHaveProperty("explanation");
  expect(protocol).toHaveProperty("legal");
  expect(protocol).toHaveProperty("errors");

  expect(protocol.meta.product).toBe(expectedProduct);
  expect(protocol.meta.protocolVersion).toBe(PHMAX_PRODUCT_AUDIT_PROTOCOL_VERSION);
  expect(protocol.meta.createdAtIso).toMatch(/^\d{4}-\d{2}-\d{2}T/);

  expect(typeof protocol.validation.ok).toBe("boolean");
  expect(typeof protocol.validation.source).toBe("string");
  expect(Array.isArray(protocol.validation.issues)).toBe(true);

  if (protocol.calculation.ok) {
    expect("totalPrimary" in protocol.calculation).toBe(true);
  } else {
    expect(typeof protocol.calculation.error).toBe("string");
  }

  if (protocol.explanation.ok) {
    expect(typeof protocol.explanation.narrative).toBe("string");
  } else {
    expect(typeof protocol.explanation.error).toBe("string");
  }

  expect(Array.isArray(protocol.legal.consolidated)).toBe(true);
  expect(Array.isArray(protocol.errors)).toBe(true);
}

describe("Audit JSON schema contract", () => {
  it("PV protokol drží povinnou schema strukturu", () => {
    const protocol = createPvProductAuditProtocol([
      {
        label: "Pracoviště A",
        provoz: "celodenni",
        classCount: 2,
        avgHoursPerDay: 10,
        sec16ClassCount: 0,
        languageGroupCount: 0,
      },
    ]);
    expectAuditSchema(protocol, "pv");
  });

  it("ŠD protokol drží povinnou schema strukturu", () => {
    const protocol = createSdProductAuditProtocol({
      pupilsFirstGrade: 80,
      manualDepts: true,
      departments: 4,
    });
    expectAuditSchema(protocol, "sd");
  });

  it("ZŠ protokol drží povinnou schema strukturu", () => {
    const protocol = createZsProductAuditProtocol({
      formSnapshot: { mode: "full_more_than_2", tab: "phmax" },
      totals: { totalPhmax: 628, breakdown: { totalPha: 0, totalPhp: 12 } },
      narrative: "Schema contract",
    });
    expectAuditSchema(protocol, "zs");
  });

  it("SŠ protokol drží povinnou schema strukturu", () => {
    const rows = ssHeroExampleSnapshot("ill_ss_prakticka_skola").rows.map((row, i) =>
      revivePhmaxSsUnitRow((row ?? {}) as Record<string, unknown>, i + 1),
    );
    const input = buildSsAuditProtocolInput(rows);
    expect(input).not.toBeNull();
    const protocol = createSsProductAuditProtocol(phmaxSsDataset, input!);
    expectAuditSchema(protocol, "ss");
  });
});
