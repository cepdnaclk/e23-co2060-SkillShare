import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Badge — pill-shaped for semantic tags per border-radius hierarchy:
//   - skills, categories, status, availability → rounded-pill (9999px)
//   - use className override for container-style badges if needed
const badgeVariants = cva(
  // Base: pill-shaped, compact, readable
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        // Solid primary — default tag
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        // Muted secondary — lower visual weight
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Destructive — errors, blocked states
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        // Outline — neutral, bordered tag
        outline:
          "text-foreground border-border",
        // Subtle — very light fill for skill tags (use with skill-badge-teach/learn utilities)
        subtle:
          "border-transparent bg-primary/10 text-primary hover:bg-primary/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
