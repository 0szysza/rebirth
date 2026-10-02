export function calculate({ current, target, rebirths, minutes, snapshot = new Date(), now = new Date() }) {
  if (![current, target, rebirths, minutes].every(Number.isFinite)
    || current < 0 || target < 0 || rebirths < 0 || minutes <= 0
    || !Number.isFinite(snapshot?.getTime()) || !Number.isFinite(now?.getTime())) {
    return { error: "Check the values." };
  }

  // Keep the recorded count and timestamp as the source of truth on every visit.
  const initialRemaining = Math.max(0, target - current);
  const goalDuration = rebirths > 0 ? initialRemaining * minutes / rebirths * 60000 : null;
  const finishTime = goalDuration === null ? NaN : snapshot.getTime() + goalDuration;
  const eta = initialRemaining === 0 ? new Date(snapshot)
    : Number.isFinite(finishTime) && Math.abs(finishTime) <= 8640000000000000 ? new Date(finishTime) : null;
  const elapsed = Math.max(0, now.getTime() - snapshot.getTime());
  const projected = current + elapsed / 60000 * rebirths / minutes;
  if (!Number.isFinite(projected)) return { error: "The estimated count is out of range." };
  const remaining = Math.max(0, target - projected);
  const progress = target === 0 ? 100 : Math.min(100, projected / target * 100);
  const activeDuration = eta ? Math.max(0, eta.getTime() - now.getTime()) : null;
  const reached = projected >= target && now >= snapshot;
  return { projected, remaining, progress, activeDuration, eta, reached };
}

export function restoreSnapshot(value, fallback = new Date()) {
  const saved = typeof value === "string" ? new Date(value) : null;
  const date = saved && Number.isFinite(saved.getTime()) ? saved : new Date(fallback);
  date.setSeconds(0, 0);
  return date;
}
