import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, restoreSnapshot } from './calc.mjs';

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
