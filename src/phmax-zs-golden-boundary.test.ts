import { describe, expect, it } from "vitest";
import {
  B9_B10,
  B11_B13,
  B13_MORE_THAN_2,
  PHA_TABLE,
  PHP_TABLE,
  pickBand,
  round2,
} from "./phmax-zs-logic";

describe("ZŠ golden matrix", () => {
  it("počítá referenční scénáře přesně z tabulek metodiky", () => {
    const cases = [
      {
        label: "B13 (1. stupeň), avg 17, 3 třídy",
        value: pickBand(17, B13_MORE_THAN_2.first).value,
        classes: 3,
        expectedPerClass: 25,
        expectedTotal: 75,
      },
      {
        label: "B13 (2. stupeň), avg 17, 2 třídy",
        value: pickBand(17, B13_MORE_THAN_2.second).value,
        classes: 2,
        expectedPerClass: 33,
        expectedTotal: 66,
      },
      {
        label: "B10/B9 §16/9 (1. stupeň), avg 10, 2 třídy",
        value: pickBand(10, B9_B10.first).value,
        classes: 2,
        expectedPerClass: 26,
        expectedTotal: 52,
      },
      {
        label: "B11 zdravotnické zařízení (1. stupeň), avg 6, 1 třída",
        value: pickBand(6, B11_B13.health1).value,
        classes: 1,
        expectedPerClass: 19,
        expectedTotal: 19,
      },
      {
        label: "PHA B45 přípravný stupeň ZŠS, avg 4, 1 třída",
        value: pickBand(4, PHA_TABLE.zssPrep).value,
        classes: 1,
        expectedPerClass: 20,
        expectedTotal: 20,
      },
      {
        label: "PHP B46, avg 300",
        value: pickBand(300, PHP_TABLE).value,
        classes: 1,
        expectedPerClass: 19,
        expectedTotal: 19,
      },
    ];

    for (const c of cases) {
      expect(c.value, c.label).toBe(c.expectedPerClass);
      expect(round2(c.value * c.classes), c.label).toBe(c.expectedTotal);
    }
  });
});

describe("ZŠ hraniční pásma", () => {
  it("drží hranice B13 (více než 2 třídy) bez posunu", () => {
    expect(pickBand(8, B13_MORE_THAN_2.first).value).toBe(10);
    expect(pickBand(8.01, B13_MORE_THAN_2.first).value).toBe(16);
    expect(pickBand(16.99, B13_MORE_THAN_2.first).value).toBe(22);
    expect(pickBand(17, B13_MORE_THAN_2.first).value).toBe(25);
    expect(pickBand(27, B13_MORE_THAN_2.first).value).toBe(30);
    expect(pickBand(27.01, B13_MORE_THAN_2.first).value).toBe(32);
  });

  it("drží hranice B11 (zdravotnické zařízení) a PHP", () => {
    expect(pickBand(3, B11_B13.health1).value).toBe(9);
    expect(pickBand(3.01, B11_B13.health1).value).toBe(15);
    expect(pickBand(6, B11_B13.health1).value).toBe(19);
    expect(pickBand(10, B11_B13.health1).value).toBe(22);

    expect(pickBand(179, PHP_TABLE).value).toBe(0);
    expect(pickBand(180, PHP_TABLE).value).toBe(12);
    expect(pickBand(299, PHP_TABLE).value).toBe(12);
    expect(pickBand(300, PHP_TABLE).value).toBe(19);
  });
});
