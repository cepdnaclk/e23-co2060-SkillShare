interface SkeletonCardProps {
  lines?: number;
  showAvatar?: boolean;
  className?: string;
}

const SkeletonCard = ({ lines = 3, showAvatar = false, className = "" }: SkeletonCardProps) => (
  <div className={`p-5 rounded-2xl bg-card border border-border ${className}`}>
    {showAvatar && (
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl skeleton-shimmer flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton-shimmer rounded-lg w-1/2" />
          <div className="h-3 skeleton-shimmer rounded-lg w-1/3" />
        </div>
      </div>
    )}
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 skeleton-shimmer rounded-lg"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  </div>
);

export const SkeletonList = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} showAvatar lines={2} />
    ))}
  </div>
);

export const SkeletonStats = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="p-4 rounded-xl bg-card border border-border">
        <div className="w-10 h-10 rounded-lg skeleton-shimmer mb-3" />
        <div className="h-6 skeleton-shimmer rounded-lg w-12 mb-1" />
        <div className="h-3 skeleton-shimmer rounded-lg w-16" />
      </div>
    ))}
  </div>
);

export default SkeletonCard;
