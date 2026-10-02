export function progressPercent(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value * 10) / 10)) : 0;
}

export function progressRange(from, to) {
  const a = progressPercent(from);
  const b = progressPercent(to);
  return { start: Math.min(a, b), end: Math.max(a, b) };
}

export function estimatePoint(data, percentage) {
  const percent = progressPercent(percentage);
  const count = Math.round(data.target * (percent / 100));
  const offset = count - data.current;
  const timestamp = offset === 0 ? data.snapshot.getTime()
    : data.pace.rebirths > 0 ? data.snapshot.getTime() + offset * data.pace.minutes / data.pace.rebirths * 60000 : NaN;
  const time = Number.isFinite(timestamp) && Math.abs(timestamp) <= 8640000000000000 ? new Date(timestamp) : null;
  return { percent, count, time, historical: offset < 0 };
}

export function estimateRange(data, from, to) {
  const range = progressRange(from, to);
  const start = estimatePoint(data, range.start);
  const end = estimatePoint(data, range.end);
  const count = end.count - start.count;
  const duration = count === 0 ? 0 : data.pace.rebirths > 0 ? count * data.pace.minutes / data.pace.rebirths * 60000 : null;
  return { start, end, count, duration, percent: progressPercent(range.end - range.start) };
}
