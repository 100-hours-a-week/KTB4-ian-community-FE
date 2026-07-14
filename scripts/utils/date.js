const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(value, now = new Date()) {
  const parsed = globalThis.dayjs?.(value);
  const current = globalThis.dayjs?.(now);
  if (!parsed?.isValid() || !current?.isValid()) return "알 수 없음";

  const difference = Math.max(0, current.diff(parsed));
  if (difference < MINUTE) return "방금 전";
  const minutes = Math.floor(difference / MINUTE);
  if (difference <= 60 * MINUTE) return `${Math.max(1, minutes)}분 전`;
  const hours = Math.floor(difference / HOUR);
  if (difference <= 24 * HOUR) return `${Math.max(1, hours)}시간 전`;
  const days = Math.floor(difference / DAY);
  if (difference <= 30 * DAY) return `${Math.max(1, days)}일 전`;
  return `${Math.max(1, Math.floor(days / 30))}달 전`;
}
