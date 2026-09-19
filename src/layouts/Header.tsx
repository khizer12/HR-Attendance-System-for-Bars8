interface HeaderProps {
  onOpenMobileNav?: () => void;
  title?: string;
}

export function Header({ onOpenMobileNav, title }: HeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-charcoal border-b border-charcoal-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-off-white hover:bg-charcoal-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ☰
          </span>
        </button>

        <h1 className="font-heading text-base font-semibold">
          {title ?? 'Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-charcoal-3 flex items-center justify-center text-xs font-medium text-muted-gray">
          ?
        </div>
      </div>
    </header>
  );
}   