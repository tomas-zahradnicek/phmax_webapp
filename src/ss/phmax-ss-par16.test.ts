import { describe, expect, it } from "vitest";
import {
  inferPar16FromClassType,
  resolveIsPar16Class,
} from "./phmax-ss-par16";
import { createEmptyPhmaxSsUnitRow } from "./phmax-ss-types";

describe("phmax-ss-par16", () => {
  it("rozpozná § 16 v typu třídy", () => {
    expect(inferPar16FromClassType("třída zřízená podle § 16 odst. 9 školského zákona")).toBe(true);
    expect(inferPar16FromClassType("jednooborová třída")).toBe(false);
  });

  it("přepínač má přednost před typem třídy", () => {
    const row = {
      ...createEmptyPhmaxSsUnitRow(1),
      isPar16Class: true,
      classType: "",
    };
    expect(resolveIsPar16Class(row)).toBe(true);

    const row2 = {
      ...createEmptyPhmaxSsUnitRow(2),
      isPar16Class: false,
      classType: "třída podle § 16 odst. 9",
    };
    expect(resolveIsPar16Class(row2)).toBe(true);

    const row3 = {
      ...createEmptyPhmaxSsUnitRow(3),
      isPar16Class: false,
      classType: "jednooborová",
    };
    expect(resolveIsPar16Class(row3)).toBe(false);
  });
});
