/**
 * Skip-to-content link. Invisible until focused via keyboard, then
 * appears in the top-left corner. Standard WCAG 2.4.1 affordance.
 *
 * The `href` must match the `id` of the `<main>` element.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className={
        'sr-only focus:not-sr-only ' +
        'focus:fixed focus:top-4 focus:left-4 focus:z-50 ' +
        'focus:inline-block focus:rounded-md ' +
        'focus:bg-lime focus:text-ink focus:px-4 focus:py-2 ' +
        'focus:text-sm focus:font-medium ' +
        'focus:outline-none focus:ring-2 focus:ring-offset-2 ' +
        'focus:ring-lime focus:ring-offset-near-black'
      }
    >
      Skip to main content
    </a>
  );
}