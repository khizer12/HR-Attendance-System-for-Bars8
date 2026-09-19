import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral: 'bg-charcoal-3 text-off-white',
        muted: 'bg-charcoal-2 text-muted-gray',
        success: 'bg-success/15 text-success',
        warning: 'bg-warning/15 text-warning',
        danger: 'bg-danger/15 text-danger',
        info: 'bg-info/15 text-info',
        lime: 'bg-lime/15 text-lime',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);