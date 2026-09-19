import clsx, { type ClassValue } from 'clsx';

/**
 * Join conditional class names.
 * Usage:
 *   cn('px-4', isActive && 'bg-lime', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}