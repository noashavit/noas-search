import { describe, it, expect } from "vitest";
import { planSlices } from "@/lib/exportPdf";

describe("planSlices", () => {
  it("returns one page when content fits on the first page", () => {
    const slices = planSlices([0, 100, 200], 400, 1000, 1100);
    expect(slices).toEqual([{ start: 0, end: 400, isFirst: true }]);
  });

  it("breaks at the last card boundary that fits", () => {
    // Cards at 0, 300, 700, 1200. Total 1500. Page 1 fits 800px, pages N fit 1000.
    const slices = planSlices([0, 300, 700, 1200], 1500, 800, 1000);
    // Page 1: can fit up to 800. Edges 300, 700, 1200, 1500. Largest <= 800 is 700.
    // Page 2: cursor 700, +1000 = 1700. Largest edge in (700, 1700] is 1500.
    expect(slices).toEqual([
      { start: 0, end: 700, isFirst: true },
      { start: 700, end: 1500, isFirst: false },
    ]);
  });

  it("never splits a card if a boundary fits within the budget", () => {
    // Page 1 budget 500, cards at 0, 400, 800. Total 1000.
    const slices = planSlices([0, 400, 800], 1000, 500, 800);
    // Page 1 can fit up to 500. Edge 400 fits, 800 does not. End at 400.
    expect(slices[0]).toEqual({ start: 0, end: 400, isFirst: true });
    // Page 2 budget 800. Cursor 400. Edge 800 fits, 1000 fits. Pick 1000.
    expect(slices[1]).toEqual({ start: 400, end: 1000, isFirst: false });
  });

  it("forces a slice when a single card is taller than a page", () => {
    // Card 0 spans 0 to 1500. Page 1 budget 800.
    const slices = planSlices([0], 1500, 800, 1000);
    // No edge fits in (0, 800] except 1500 which doesn't fit. Force slice at 800.
    expect(slices[0]).toEqual({ start: 0, end: 800, isFirst: true });
    // Cursor 800, budget 1000. Edge 1500 fits.
    expect(slices[1]).toEqual({ start: 800, end: 1500, isFirst: false });
  });

  it("only marks the first slice as isFirst", () => {
    const slices = planSlices([0, 500], 1500, 600, 700);
    expect(slices[0].isFirst).toBe(true);
    for (let i = 1; i < slices.length; i++) {
      expect(slices[i].isFirst).toBe(false);
    }
  });

  it("handles empty content", () => {
    expect(planSlices([0], 0, 800, 1000)).toEqual([]);
  });
});
