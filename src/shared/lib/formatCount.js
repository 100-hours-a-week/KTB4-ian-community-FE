export function formatCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count)) return "0";

  const normalized = Math.max(0, Math.trunc(count));
  if (normalized >= 10_000) {
    const compact = Math.floor(normalized / 1_000) / 10;
    return `${Number.isInteger(compact) ? compact.toFixed(0) : compact.toFixed(1)}만`;
  }

  return normalized.toLocaleString("ko-KR");
}
