// ============================================================
// ChatAvatar – Reusable avatar circle with fallback initials
// ============================================================

import React from "react";

interface ChatAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const ChatAvatar: React.FC<ChatAvatarProps> = ({
  name,
  avatarUrl,
  size = "md",
  className = "",
}) => {
  const base = `${sizeClasses[size]} rounded-full flex-shrink-0 flex items-center justify-center font-semibold ${className}`;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${base} object-cover`}
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.currentTarget as HTMLImageElement;
          target.style.display = "none";
          const sibling = target.nextElementSibling as HTMLElement | null;
          if (sibling) sibling.style.display = "flex";
        }}
      />
    );
  }

  return (
    <div
      className={`${base} bg-gradient-to-br from-violet-500 to-orange-500 text-white`}
      aria-label={`Avatar for ${name}`}
    >
      {getInitials(name)}
    </div>
  );
};
