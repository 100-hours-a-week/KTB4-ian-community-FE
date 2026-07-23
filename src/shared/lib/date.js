const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(value, now = new Date()) {
  const parsed = new Date(value);
  const current = new Date(now);
  if (Number.isNaN(parsed.getTime()) || Number.isNaN(current.getTime()))
    return "알 수 없음";
  const difference = Math.max(0, current.getTime() - parsed.getTime());
  if (difference < MINUTE) return "방금 전";
  if (difference <= HOUR)
    return `${Math.max(1, Math.floor(difference / MINUTE))}분 전`;
  if (difference <= DAY)
    return `${Math.max(1, Math.floor(difference / HOUR))}시간 전`;
  const days = Math.floor(difference / DAY);
  if (difference <= 30 * DAY) return `${Math.max(1, days)}일 전`;
  return `${Math.max(1, Math.floor(days / 30))}달 전`;
}
