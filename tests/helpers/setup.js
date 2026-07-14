import dayjs from "dayjs";

globalThis.dayjs = dayjs;

if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (callback) => callback();
}
