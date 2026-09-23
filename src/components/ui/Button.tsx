import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils/cn';

const buttonVariants = cva(
  // Base styles — always applied
  'inline-flex items-center justify-center gap-2 rounded-md font-medium ' +
    'transition-all duration-150 ease-out ' +
    'hover:-translate-y-px ' +
    'active:scale-[0.97] active:translate-y-0 ' +
    'disabled:cursor-not-allowed disabled:opacity-50 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 ' +
    'focus-visible:ring-offset-near-black',
  {
    variants: {
      variant: {
        // Cream-on-red fails WCAG AA (3.5:1). Ink-on-red passes (5.0:1).
        primary: 'bg-lime text-ink hover:bg-lime-dim',
        secondary:
          'bg-charcoal-2 text-off-white border border-charcoal-3 hover:bg-charcoal-3',
        ghost: 'text-off-white hover:bg-charcoal-2',
        // Coral danger is bright; ink reads fine on it too.
        danger: 'bg-danger text-ink hover:opacity-90',
        outline:
          'bg-transparent text-lime border border-lime hover:bg-lime hover:text-ink',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Show a loading state — disables the button and shows a spinner.
   * Useful for async operations like clock-in or submit.
   */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading = false, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';