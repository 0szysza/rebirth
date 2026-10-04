const multipliers = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 };

// English short scale: M = million, B = billion, T = trillion.
export function parseAmount(value) {
  let text = String(value).trim().replace(/[\s_]/g, "");
  if (!text) return NaN;
  const suffix = text.slice(-1).toUpperCase();
  const multiplier = multipliers[suffix] || 1;
  if (multiplier !== 1) text = text.slice(0, -1);
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) text = text.replaceAll(",", "");
  else if (text.includes(",") && !text.includes(".")) text = text.replace(",", ".");
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return NaN;
  const amount = Number(text) * multiplier;
  return Number.isFinite(amount) && amount <= Number.MAX_SAFE_INTEGER ? amount : NaN;
}

export function formatAmount(value) {
  const units = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
  const unit = units.find(([size]) => Math.abs(value) >= size);
  if (!unit) return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value / unit[0]) + unit[1];
}

export function stepAmount(value, direction) {
  const amount = parseAmount(value);
  const multiplier = multipliers[String(value).trim().slice(-1).toUpperCase()] || 1;
  const next = Math.max(0, (Number.isFinite(amount) ? amount : 0) + direction * multiplier);
  if (next > Number.MAX_SAFE_INTEGER) return value;
  const suffix = String(value).trim().slice(-1).toUpperCase();
  return multipliers[suffix] ? `${Number((next / multiplier).toPrecision(15))}${suffix}` : String(next);
}
