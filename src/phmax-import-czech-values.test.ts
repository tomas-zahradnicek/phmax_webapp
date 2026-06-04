import { describe, expect, it } from "vitest";
import { IMPORT_BASIC_TYPE_LABELS } from "./phmax-import-czech-values";
import { normalizeImportRows } from "./phmax-import-columns";

describe("phmax-import-czech-values", () => {
  it("mapuje český typ ZŠ na interní kód", () => {
    const zs = normalizeImportRows(
      [{ basic_type: IMPORT_BASIC_TYPE_LABELS.full_more_than_2 }],
      "zs",
    );
    expect(zs[0]?.basic_type).toBe("full_more_than_2");
  });

  it("normalizeImportRows přijme český provoz a psych stupeň", () => {
    const pv = normalizeImportRows([{ provoz: "Celodenní provoz (tabulka 2)" }], "pv");
    expect(pv[0]?.provoz).toBe("celodenni");

    const psych = normalizeImportRows([{ kind: "1. stupeň", mode: "Jen aktuální rok" }], "zsPsych");
    expect(psych[0]?.kind).toBe("psych1");
    expect(psych[0]?.mode).toBe("current_only");
  });
});
