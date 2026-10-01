const DAY_LIMIT = 365 * 20;

function atMinute(day, minute) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minute);
}

function dayStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function nextDay(day) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
}

function breakForDay(day, breakStart, breakEnd) {
  const start = atMinute(day, breakStart);
  const end = atMinute(day, breakEnd + (breakEnd <= breakStart ? 1440 : 0));
  return [start.getTime(), end.getTime()];
}

export function activeWindowsForDay(day, breakStart, breakEnd) {
  const start = dayStart(day).getTime();
  const end = nextDay(dayStart(day)).getTime();

  if (breakStart === breakEnd) return [[start, end]];

  const previousDay = new Date(day.getFullYear(), day.getMonth(), day.getDate() - 1);
  const breaks = [breakForDay(previousDay, breakStart, breakEnd), breakForDay(day, breakStart, breakEnd)]
    .filter(([pauseStart, pauseEnd]) => pauseEnd > start && pauseStart < end)
    .sort((a, b) => a[0] - b[0]);

  const windows = [];
  let cursor = start;
  for (const [pauseStart, pauseEnd] of breaks) {
    if (pauseStart > cursor) windows.push([cursor, Math.min(pauseStart, end)]);
    cursor = Math.max(cursor, Math.min(pauseEnd, end));
  }
  if (cursor < end) windows.push([cursor, end]);
  return windows;
}

export function activeMilliseconds(from, to, breakStart, breakEnd) {
  if (to <= from) return 0;
  let total = 0;
  let day = dayStart(from);
  for (let count = 0; count < DAY_LIMIT && day < to; count += 1) {
    for (const [start, end] of activeWindowsForDay(day, breakStart, breakEnd)) {
      total += Math.max(0, Math.min(end, to.getTime()) - Math.max(start, from.getTime()));
    }
    day = nextDay(day);
  }
  return total;
}

export function addActiveMilliseconds(from, duration, breakStart, breakEnd) {
  if (duration <= 0) return new Date(from);
  let remaining = duration;
  let day = dayStart(from);
  for (let count = 0; count < DAY_LIMIT; count += 1) {
    for (const [windowStart, windowEnd] of activeWindowsForDay(day, breakStart, breakEnd)) {
      const start = Math.max(windowStart, from.getTime());
      const available = windowEnd - start;
      if (available <= 0) continue;
      if (remaining <= available) return new Date(start + remaining);
      remaining -= available;
    }
    day = nextDay(day);
  }
  return null;
}

export function calculate({ current, target, ratePerTen, snapshot, forecast, breakStart, breakEnd }) {
  if (![current, target, ratePerTen, breakStart, breakEnd].every(Number.isFinite)
    || current < 0 || target < 0 || ratePerTen < 0
    || !Number.isFinite(snapshot?.getTime()) || !Number.isFinite(forecast?.getTime())) {
    return { error: "Check the values and dates." };
  }

  const remaining = Math.max(0, target - current);
  const progress = target === 0 ? 100 : Math.min(100, current / target * 100);
  const activeDuration = ratePerTen > 0 ? remaining * 10 / ratePerTen * 60000 : null;
  const eta = remaining === 0 ? new Date(snapshot)
    : activeDuration === null ? null
      : addActiveMilliseconds(snapshot, activeDuration, breakStart, breakEnd);
  const forecastActive = forecast >= snapshot
    ? activeMilliseconds(snapshot, forecast, breakStart, breakEnd) : null;
  const projected = forecastActive === null ? null
    : current + forecastActive / 60000 * ratePerTen / 10;

  return { remaining, progress, activeDuration, eta, projected, forecastActive };
}

