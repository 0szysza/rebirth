import test from 'node:test';
import assert from 'node:assert/strict';
import { progressPercent, progressRange, estimatePoint, estimateRange } from './progress.mjs';

const data = { current: 2000, target: 10000, pace: { rebirths: 100, minutes: 10 }, snapshot: new Date('2026-10-02T12:00:00Z') };

test('selection works in either direction with clamped 0.1% precision', () => {
  assert.deepEqual(progressRange(45.04, 20.06), { start: 20.1, end: 45 });
  assert.deepEqual(progressRange(120, -10), { start: 0, end: 100 });
  assert.equal(progressPercent(NaN), 0);
});

test('selected counts, duration and both times use the recorded starting point', () => {
  const result = estimateRange(data, 20, 45);
  assert.equal(result.start.count, 2000);
  assert.equal(result.end.count, 4500);
  assert.equal(result.count, 2500);
  assert.equal(result.percent, 25);
  assert.equal(result.duration, 15000000);
  assert.equal(result.start.time.toISOString(), '2026-10-02T12:00:00.000Z');
  assert.equal(result.end.time.toISOString(), '2026-10-02T16:10:00.000Z');
  assert.deepEqual(estimateRange(data, 45, 20), result);
});

test('points before the recorded count are marked as historical estimates', () => {
  const point = estimatePoint(data, 10);
  assert.equal(point.historical, true);
  assert.equal(point.time.toISOString(), '2026-10-02T10:20:00.000Z');
});

test('zero pace retains counts without inventing times', () => {
  const paused = { ...data, pace: { rebirths: 0, minutes: 10 } };
  const result = estimateRange(paused, 20, 45);
  assert.equal(result.count, 2500);
  assert.equal(result.start.time.getTime(), data.snapshot.getTime());
  assert.equal(result.end.time, null);
  assert.equal(result.duration, null);
});

test('tiny targets and zero target do not produce negative or invented counts', () => {
  const tiny = estimateRange({ ...data, target: 3 }, 20, 30);
  assert.equal(tiny.count, 0);
  assert.equal(tiny.duration, 0);
  const zero = estimateRange({ ...data, target: 0 }, 0, 100);
  assert.equal(zero.count, 0);
});

test('out of range timestamps are unavailable rather than invalid dates', () => {
  const huge = { ...data, pace: { rebirths: 1e-300, minutes: 10 } };
  assert.equal(estimateRange(huge, 25, 100).end.time, null);
  assert.equal(estimatePoint(data, 100).count, data.target);
  assert.equal(estimatePoint({ ...data, target: 1e308 }, 100).count, 1e308);
});
