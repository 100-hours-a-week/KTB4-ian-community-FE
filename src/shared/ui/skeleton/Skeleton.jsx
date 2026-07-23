export function SkeletonBlock({ className = "", width, height, radius }) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-block ${className}`.trim()}
      style={{ width, height, borderRadius: radius }}
    />
  );
}

export function SkeletonAvatar({ width = 34, height = 34 }) {
  return <SkeletonBlock width={width} height={height} radius="50%" />;
}
