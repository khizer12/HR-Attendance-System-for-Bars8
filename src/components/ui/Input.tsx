import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Error message — when present, the input is styled as invalid and marked aria-invalid. */
  error?: string;
  /** Optional helper text shown below the input when there is no error. */
  hint?: string;
  /** Optional leading icon rendered inside the input. */
  leadingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, hint, leadingIcon, id, type = 'text', ...props },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const describedBy = error ? errorId : hint ? hintId : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-off-white mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leadingIcon && (
            <div
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-gray pointer-events-none"
            >
              {leadingIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              'w-full h-10 rounded-md bg-charcoal-2 text-off-white text-sm',
              'border transition-colors',
              'placeholder:text-muted-gray/70',
              'focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/60',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leadingIcon ? 'pl-10 pr-3' : 'px-3',
              error
                ? 'border-danger focus:ring-danger/40 focus:border-danger'
                : 'border-charcoal-3',
              className,
            )}
            {...props}
          />
        </div>

        {error ? (
          <p id={errorId} className="mt-1.5 text-xs text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="mt-1.5 text-xs text-muted-gray">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';