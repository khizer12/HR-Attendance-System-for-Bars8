import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

export type CardProps = HTMLAttributes<HTMLDivElement>;

/**
 * Surface container. Uses charcoal over near-black.
 * Optional padding via className: <Card className="p-6">.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg bg-charcoal border border-charcoal-3',
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = 'Card';

export type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('px-5 py-4 border-b border-charcoal-3', className)}
      {...props}
    />
  );
}

export type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn('font-heading text-base font-semibold', className)}
      {...props}
    />
  );
}

export type CardBodyProps = HTMLAttributes<HTMLDivElement>;

export function CardBody({ className, ...props }: CardBodyProps) {
  return <div className={cn('p-5', className)} {...props} />;
}