import { describe, expect, it } from "vitest";
import {
  B11_B13,
  B13_MORE_THAN_2,
  B9_B10,
  PHA_TABLE,
  PHP_TABLE,
  n,
  pickBand,
  round2,
} from "./phmax-zs-logic";

describe("round2", () => {
  it("zaokrouhlí na dvě desetinná místa", () => {
    expect(round2(1.234)).toBe(1.23);
    expect(round2(1.235)).toBe(1.24);
    expect(round2(0)).toBe(0);
  });
});

describe("n", () => {
  it("převede platné číslo a nahradí neplatné nulou", () => {
    expect(n("12")).toBe(12);
    expect(n(3.5)).toBe(3.5);
    expect(n("x")).toBe(0);
    expect(n(NaN)).toBe(0);
    expect(n(undefined)).toBe(0);
  });
});

describe("pickBand", () => {
  it("vrátí pásmo pro průměr v tabulce B13 (1. stupeň)", () => {
    expect(pickBand(8, B13_MORE_THAN_2.first).value).toBe(10);
    expect(pickBand(8.01, B13_MORE_THAN_2.first).value).toBe(16);
    expect(pickBand(17, B13_MORE_THAN_2.first).value).toBe(25);
    expect(pickBand(27.5, B13_MORE_THAN_2.first).value).toBe(32);
    expect(pickBand(28, B13_MORE_THAN_2.first).value).toBe(32);
  });

  it("vrátí pásmo pro § 16/9 – B9/B10 1. stupeň (hranice 6 a 10)", () => {
    expect(pickBand(5.9, B9_B10.first).value).toBe(19);
    expect(pickBand(6, B9_B10.first).value).toBe(26);
    expect(pickBand(10, B9_B10.first).value).toBe(26);
    expect(pickBand(10.01, B9_B10.first).value).toBe(31);
  });

  it("PHP_TABLE – hranice 180 a 300", () => {
    expect(pickBand(179, PHP_TABLE).value).toBe(0);
    expect(pickBand(180, PHP_TABLE).value).toBe(12);
    expect(pickBand(299, PHP_TABLE).value).toBe(12);
    expect(pickBand(300, PHP_TABLE).value).toBe(19);
    expect(pickBand(999, PHP_TABLE).value).toBe(48);
    expect(pickBand(1000, PHP_TABLE).value).toBe(60);
  });

  it("B11 – ZŠ při zdrav. zař., 1. stupeň (hranice 3, 6, 10)", () => {
    expect(pickBand(3, B11_B13.health1).value).toBe(9);
    expect(pickBand(3.01, B11_B13.health1).value).toBe(15);
    expect(pickBand(5.99, B11_B13.health1).value).toBe(15);
    expect(pickBand(6, B11_B13.health1).value).toBe(19);
    expect(pickBand(9.99, B11_B13.health1).value).toBe(19);
    expect(pickBand(10, B11_B13.health1).value).toBe(22);
  });

  it("B12 – 2. stupeň (stejné intervaly, jiné hodnoty)", () => {
    expect(pickBand(3, B11_B13.health2).value).toBe(12);
    expect(pickBand(10, B11_B13.health2).value).toBe(28);
  });

  it("PHA B45 – přípravný stupeň ZŠS (zssPrep, hranice 4)", () => {
    expect(pickBand(3.99, PHA_TABLE.zssPrep).value).toBe(0);
    expect(pickBand(4, PHA_TABLE.zssPrep).value).toBe(20);
  });

  it("bez shody vrátí výchozí pásmo s hodnotou 0", () => {
    const empty: { label: string; test: (x: number) => boolean; value: number }[] = [];
    const r = pickBand(10, empty);
    expect(r.value).toBe(0);
    expect(r.label).toBe("–");
  });
});
