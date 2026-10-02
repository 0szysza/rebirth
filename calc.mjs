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

export function calculateInterval({ current, rebirths, minutes, durationMinutes, end, snapshot = new Date(), now = new Date() }) {
  // An explicit deadline stays fixed even when the page is opened again later.
  if (end !== undefined) {
    if (!Number.isFinite(end?.getTime()) || !Number.isFinite(snapshot?.getTime())) return { error: "Check the values." };
    durationMinutes = (end.getTime() - snapshot.getTime()) / 60000;
  }
  if (![current, rebirths, minutes, durationMinutes].every(Number.isFinite)
    || current < 0 || rebirths < 0 || minutes <= 0 || durationMinutes <= 0
    || !Number.isFinite(snapshot?.getTime()) || !Number.isFinite(now?.getTime())) {
    return { error: "Check the values." };
  }
  const duration = durationMinutes * 60000;
  const endTime = end === undefined ? snapshot.getTime() + duration : end.getTime();
  const totalGain = durationMinutes * rebirths / minutes;
  const finalCount = current + totalGain;
  if (![duration, endTime, totalGain, finalCount].every(Number.isFinite) || Math.abs(endTime) > 8640000000000000) {
    return { error: "The estimate is out of range." };
  }
  const elapsed = Math.min(duration, Math.max(0, now.getTime() - snapshot.getTime()));
  const gained = elapsed / duration * totalGain;
  return {
    totalGain, finalCount, gained, projected: current + gained,
    progress: elapsed / duration * 100,
    activeDuration: Math.max(0, endTime - now.getTime()),
    eta: new Date(endTime), reached: now.getTime() >= endTime,
  };
}
