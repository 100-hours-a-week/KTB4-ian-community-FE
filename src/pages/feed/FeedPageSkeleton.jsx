import {
  SkeletonAvatar,
  SkeletonBlock,
} from "../../shared/ui/skeleton/Skeleton.jsx";

export function FeedPageSkeleton() {
  return (
    <div data-testid="feed-skeleton" aria-hidden="true">
      <header className="feed-page__intro">
        <SkeletonBlock width={34} height={28} radius={6} />
        <div className="create-trigger">
          <span>
            <SkeletonAvatar />
            <SkeletonBlock width={150} height={18} radius={6} />
          </span>
          <SkeletonBlock width={99} height={34} radius={8} />
        </div>
      </header>
      {[0, 1].map((item) => (
        <div className="post-card skeleton-card" key={item}>
          <div className="identity">
            <SkeletonAvatar />
            <SkeletonBlock width={100} height={18} radius={6} />
          </div>
          <SkeletonBlock width="100%" height={216} radius={12} />
          <SkeletonBlock width="90%" height={18} radius={6} />
        </div>
      ))}
    </div>
  );
}
