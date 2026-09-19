import type { HTMLAttributes } from 'react';
import type { VariantProps } from 'class-variance-authority';

import { badgeVariants } from '@/components/ui/badge.variants';
import { cn } from '@/utils/cn';

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}