import { useEffect, useRef, type ReactNode } from 'react';

import { cn } from '@/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // Click on backdrop area (not on inner content) closes.
        if (e.target === dialogRef.current) onClose();
      }}
      className={cn(
        'w-[calc(100vw-2rem)] max-w-lg rounded-lg bg-charcoal text-off-white',
        'border border-charcoal-3 p-0 m-auto',
        'backdrop:bg-black/60',
        'open:animate-dropdown-in',
        className,
      )}
    >
      <div className="px-5 py-4 border-b border-charcoal-3">
        <h2 className="font-heading text-lg">{title}</h2>
        {description && (
          <p className="text-xs text-muted-gray mt-1">{description}</p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}