import { useCallback, useEffect, useRef, useState } from "react";

export const SKELETON_DELAY_MS = 120;
export const SKELETON_MIN_VISIBLE_MS = 200;

export function useSkeletonReveal() {
  const [isSkeletonVisible, setSkeletonVisible] = useState(false);
  const [isSkeletonExiting, setSkeletonExiting] = useState(false);
  const [isContentVisible, setContentVisible] = useState(false);
  const timers = useRef([]);
  const frames = useRef([]);
  const shownAt = useRef(0);
  const visible = useRef(false);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    frames.current.forEach(cancelAnimationFrame);
    timers.current = [];
    frames.current = [];
  }, []);
  useEffect(() => clear, [clear]);

  const startLoading = useCallback(() => {
    clear();
    visible.current = false;
    setContentVisible(false);
    setSkeletonExiting(false);
    setSkeletonVisible(false);
    timers.current.push(
      setTimeout(() => {
        shownAt.current = performance.now();
        visible.current = true;
        setSkeletonVisible(true);
      }, SKELETON_DELAY_MS),
    );
  }, [clear]);

  const revealContent = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setContentVisible(true);
    const wait = visible.current
      ? Math.max(
          0,
          SKELETON_MIN_VISIBLE_MS - (performance.now() - shownAt.current),
        )
      : 0;
    timers.current.push(
      setTimeout(() => {
        frames.current.push(
          requestAnimationFrame(() =>
            frames.current.push(
              requestAnimationFrame(() => {
                setSkeletonExiting(true);
                timers.current.push(
                  setTimeout(() => {
                    visible.current = false;
                    setSkeletonVisible(false);
                  }, 180),
                );
              }),
            ),
          ),
        );
      }, wait),
    );
  }, []);

  return {
    isSkeletonVisible,
    isSkeletonExiting,
    isContentVisible,
    startLoading,
    revealContent,
  };
}
