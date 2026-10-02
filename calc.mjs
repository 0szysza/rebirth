export function calculate({ current, target, rebirths, minutes, snapshot = new Date() }) {
  if (![current, target, rebirths, minutes].every(Number.isFinite)
    || current < 0 || target < 0 || rebirths < 0 || minutes <= 0
    || !Number.isFinite(snapshot?.getTime())) {
    return { error: "Check the values." };
  }

  const remaining = Math.max(0, target - current);
  const progress = target === 0 ? 100 : Math.min(100, current / target * 100);
  const activeDuration = rebirths > 0 ? remaining * minutes / rebirths * 60000 : null;
  const finishTime = activeDuration === null ? NaN : snapshot.getTime() + activeDuration;
  const eta = remaining === 0 ? new Date(snapshot)
    : Number.isFinite(finishTime) && finishTime <= 8640000000000000 ? new Date(finishTime) : null;
  return { remaining, progress, activeDuration, eta };
}
