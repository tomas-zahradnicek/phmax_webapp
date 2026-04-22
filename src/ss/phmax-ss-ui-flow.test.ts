import { describe, expect, it } from "vitest";
import { phmaxSsDataset } from "./phmax-ss-dataset";
import { calculatePhmaxRow } from "./phmax-ss-service";
import { ssHeroExampleSnapshot } from "./phmax-ss-hero-examples";
import { revivePhmaxSsUnitRow } from "./phmax-ss-types";
import { buildSsAuditProtocolInput } from "./phmax-ss-units-derive";
import { createSsProductAuditProtocol } from "../phmax-product-audit";

describe("SŠ UI flow integration (example-like flows)", () => {
  it("srovnání denní vs večerní formy drží dopad koeficientu", () => {
    const daily = calculatePhmaxRow(phmaxSsDataset, {
      code: "39-41-L/01",
      averageStudents: 22,
      classCount: 1,
      mode: "oneObor",
      form: "denni",
    }).row;
    const evening = calculatePhmaxRow(phmaxSsDataset, {
      code: "39-41-L/01",
      averageStudents: 22,
      classCount: 1,
      mode: "oneObor",
      form: "vecerni",
    }).row;

    expect(daily.totalPhmax).toBeGreaterThan(evening.totalPhmax);
    expect(evening.coefficient).toBe(0.3);
  });

  it("PrŠ example lze převést do auditního protokolu s kladným PHmax", () => {
    const rows = ssHeroExampleSnapshot("ill_ss_prakticka_skola").rows.map((row, i) =>
      revivePhmaxSsUnitRow((row ?? {}) as Record<string, unknown>, i + 1),
    );
    const input = buildSsAuditProtocolInput(rows);
    expect(input).not.toBeNull();

    const protocol = createSsProductAuditProtocol(phmaxSsDataset, input!);
    expect(protocol.meta.product).toBe("ss");
    expect(protocol.calculation.ok).toBe(true);
    if (protocol.calculation.ok) {
      expect((protocol.calculation.totalPrimary ?? 0) > 0).toBe(true);
    }
  });
});
