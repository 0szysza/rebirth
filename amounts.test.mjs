import test from "node:test";
import assert from "node:assert/strict";
import { parseAmount, formatAmount, stepAmount } from "./amounts.mjs";
import { calculate, calculateInterval } from "./calc.mjs";

test("bubble amounts accept suffixes, decimals and pasted totals", () => {
  for (const [text, expected] of [["2M", 2e6], ["1.5b", 1.5e9], ["0.25 T", 2.5e11], ["1,5B", 1.5e9], ["1,234,567", 1234567], ["12_000", 12000], ["0", 0]]) {
    assert.equal(parseAmount(text), expected, text);
  }
  for (const text of ["", "-2B", "1BB", "NaN", "1.2.3M", "1,2,3", "10Tabc", "999999T"]) assert.ok(Number.isNaN(parseAmount(text)), text);
});
test("bubble estimates cover duration, deadline and goal using the entered scale", () => {
  const snapshot = new Date("2026-10-04T12:00:00Z");
  const values = { current: parseAmount("1B"), rebirths: parseAmount("250M"), minutes: 10, snapshot, now: new Date("2026-10-04T13:00:00Z") };
  const interval = calculateInterval({ ...values, durationMinutes: 120 });
  assert.equal(interval.totalGain, 3e9);
  assert.equal(interval.finalCount, 4e9);
  assert.equal(interval.projected, 2.5e9);
  assert.equal(interval.progress, 50);
  const deadline = calculateInterval({ ...values, end: new Date("2026-10-04T18:00:00Z") });
  assert.equal(deadline.totalGain, 9e9);
  assert.equal(deadline.finalCount, 10e9);
  const goal = calculate({ ...values, target: parseAmount("4B") });
  assert.equal(goal.eta.toISOString(), "2026-10-04T14:00:00.000Z");
});
test("bubble amount stepping respects its unit and does not round away small changes", () => {
  assert.equal(stepAmount("1.5B", 1), "2.5B");
  assert.equal(stepAmount("0", -1), "0");
  assert.equal(stepAmount("1234567890", 1), "1234567891");
  assert.equal(formatAmount(2.5e12), "2.5T");
});
