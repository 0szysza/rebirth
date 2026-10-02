import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, calculateInterval, restoreSnapshot } from './calc.mjs';

const snapshot = new Date('2026-10-02T12:00:00Z');
const values = { current: 100, target: 300, rebirths: 100, minutes: 60, snapshot };

test('returning an hour later advances the count without postponing the goal', () => {
  const first = calculate({ ...values, now: snapshot });
  const later = calculate({ ...values, now: new Date('2026-10-02T13:00:00Z') });
  assert.equal(first.eta.toISOString(), '2026-10-02T14:00:00.000Z');
  assert.equal(later.eta.getTime(), first.eta.getTime());
  assert.equal(first.projected, 100);
  assert.equal(later.projected, 200);
  assert.equal(later.remaining, 100);
  assert.equal(later.activeDuration, 3600000);
});

test('saved timestamp survives reopening and does not reset when modes change', () => {
  const persisted = JSON.parse(JSON.stringify({ snapshot: snapshot.toISOString() }));
  const restored = restoreSnapshot(persisted.snapshot, new Date('2026-10-03T00:00:00Z'));
  assert.equal(restored.getTime(), snapshot.getTime());
  const result = calculate({ ...values, snapshot: restored, now: new Date('2026-10-02T14:00:00Z') });
  assert.equal(result.projected, 300);
  assert.equal(result.reached, true);
  assert.equal(result.activeDuration, 0);
});

test('estimate continues after the goal while preserving its original finish time', () => {
  const result = calculate({ ...values, now: new Date('2026-10-02T15:00:00Z') });
  assert.equal(result.projected, 400);
  assert.equal(result.eta.toISOString(), '2026-10-02T14:00:00.000Z');
  assert.equal(result.progress, 100);
  assert.equal(result.remaining, 0);
});

test('zero pace and future start do not invent earned rebirths', () => {
  const paused = calculate({ ...values, rebirths: 0, now: new Date('2026-10-02T15:00:00Z') });
  assert.equal(paused.projected, 100);
  assert.equal(paused.eta, null);
  const future = calculate({ ...values, now: new Date('2026-10-02T11:00:00Z') });
  assert.equal(future.projected, 100);
  assert.equal(future.activeDuration, 3 * 3600000);
});

test('older or malformed saved timestamps migrate once to a valid starting time', () => {
  for (const value of [undefined, null, '', 'not a date']) {
    assert.equal(restoreSnapshot(value, snapshot).getTime(), snapshot.getTime());
  }
  assert.equal(calculate({ ...values, now: new Date(NaN) }).error, 'Check the values.');
});

const interval = { current: 1000, rebirths: 150, minutes: 10, durationMinutes: 120, snapshot };

test('two-hour interval reports both gained rebirths and the final count', () => {
  const result = calculateInterval({ ...interval, now: snapshot });
  assert.equal(result.totalGain, 1800);
  assert.equal(result.finalCount, 2800);
  assert.equal(result.projected, 1000);
  assert.equal(result.progress, 0);
  assert.equal(result.eta.toISOString(), '2026-10-02T14:00:00.000Z');
});

test('returning later advances interval progress without moving its end', () => {
  const result = calculateInterval({ ...interval, snapshot: restoreSnapshot(snapshot.toISOString()), now: new Date('2026-10-02T13:00:00Z') });
  assert.equal(result.projected, 1900);
  assert.equal(result.gained, 900);
  assert.equal(result.progress, 50);
  assert.equal(result.activeDuration, 3600000);
  assert.equal(result.finalCount, 2800);
  assert.equal(result.eta.toISOString(), '2026-10-02T14:00:00.000Z');
});

test('a finished interval stops counting at its fixed end', () => {
  const result = calculateInterval({ ...interval, now: new Date('2026-10-02T17:00:00Z') });
  assert.equal(result.projected, 2800);
  assert.equal(result.gained, 1800);
  assert.equal(result.progress, 100);
  assert.equal(result.activeDuration, 0);
  assert.equal(result.reached, true);
});

test('custom duration, zero pace and a future starting time remain meaningful', () => {
  const custom = calculateInterval({ ...interval, durationMinutes: 375, now: snapshot });
  assert.equal(custom.totalGain, 5625);
  const paused = calculateInterval({ ...interval, rebirths: 0, now: new Date('2026-10-02T13:00:00Z') });
  assert.equal(paused.finalCount, 1000);
  assert.equal(paused.progress, 50);
  const future = calculateInterval({ ...interval, now: new Date('2026-10-02T11:00:00Z') });
  assert.equal(future.projected, 1000);
  assert.equal(future.progress, 0);
  assert.equal(future.activeDuration, 3 * 3600000);
});

test('invalid and unrepresentable intervals do not produce a forecast', () => {
  for (const durationMinutes of [0, -1, NaN, Infinity, Number.MAX_VALUE]) {
    assert.ok(calculateInterval({ ...interval, durationMinutes, now: snapshot }).error);
  }
  assert.ok(calculateInterval({ ...interval, snapshot: new Date(NaN) }).error);
});

test('an explicit end time determines the gain and stays fixed on return', () => {
  const end = new Date('2026-10-02T15:15:00Z');
  const first = calculateInterval({ ...interval, end, now: snapshot });
  const later = calculateInterval({ ...interval, end: new Date(end.toISOString()), now: new Date('2026-10-02T13:00:00Z') });
  assert.equal(first.totalGain, 2925);
  assert.equal(first.finalCount, 3925);
  assert.equal(later.projected, 1900);
  assert.equal(later.eta.getTime(), end.getTime());
  assert.equal(later.activeDuration, 135 * 60000);
  const finished = calculateInterval({ ...interval, end, now: new Date('2026-10-03T12:00:00Z') });
  assert.equal(finished.projected, first.finalCount);
  assert.equal(finished.progress, 100);
});

test('a deadline across midnight and zero pace preserve time progress', () => {
  const snapshot = new Date('2026-10-02T23:30:00Z');
  const end = new Date('2026-10-03T01:00:00Z');
  const now = new Date('2026-10-03T00:15:00Z');
  const result = calculateInterval({ ...interval, snapshot, end, now });
  assert.equal(result.totalGain, 1350);
  assert.equal(result.progress, 50);
  assert.equal(result.eta.getTime(), end.getTime());
  const paused = calculateInterval({ ...interval, snapshot, end, now, rebirths: 0 });
  assert.equal(paused.projected, interval.current);
  assert.equal(paused.progress, 50);
});

test('deadlines must be valid and strictly after the saved starting point', () => {
  for (const end of [null, new Date(NaN), snapshot, new Date('2026-10-02T11:59:00Z')]) {
    assert.ok(calculateInterval({ ...interval, end, now: snapshot }).error);
  }
});
