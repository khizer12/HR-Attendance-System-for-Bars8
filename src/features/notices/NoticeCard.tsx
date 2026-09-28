import { motion } from 'framer-motion';

import { KnifePin } from '@/features/notices/KnifePin';
import { formatDateShort, formatTime } from '@/lib/time';
import type { NoticeWithAuthor } from '@/types/notice';

interface NoticeCardProps {
  notice: NoticeWithAuthor;
  /** Index in the list — drives stagger + slight positional variation. */
  index: number;
  /** When true, the knife animation plays. */
  animate?: boolean;
  /** Super-admin actions. */
  canManage?: boolean;
  onTogglePin?: (id: string, pinned: boolean) => void;
  onDelete?: (id: string) => void;
}

/**
 * Parchment notice, pinned to the board with an ink-outline knife.
 * Slight per-index rotation makes cards feel hand-placed.
 */
export function NoticeCard({
  notice,
  index,
  animate = true,
  canManage = false,
  onTogglePin,
  onDelete,
}: NoticeCardProps) {
  // Hand-placed rotation: cycles through -1.2°, 0.8°, -0.6°, 1°.
  const rotations = [-1.2, 0.8, -0.6, 1];
  const rotation = rotations[index % rotations.length];

  return (
    <motion.article
      initial={animate ? { opacity: 0, y: 24, scale: 0.96 } : false}
      animate={animate ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.12, 0.6),
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ rotate: rotation }}
      whileHover={{ rotate: 0, scale: 1.01, y: -4 }}
      className="relative"
    >
      {/* Parchment body */}
      <div
        className="relative rounded-sm p-6 pt-12 pr-12"
        style={{
          background:
            'linear-gradient(135deg, #f5e9c9 0%, #ecdcb1 50%, #e6d29c 100%)',
          border: '2px solid #1a1210',
          boxShadow:
            '0 6px 0 rgba(0,0,0,0.35), 0 12px 24px rgba(0,0,0,0.35)',
          color: '#2c1e10',
          fontFamily: 'var(--font-body)',
        }}
      >
        {/* Aged stain — subtle radial */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none rounded-sm"
          style={{
            background:
              'radial-gradient(circle at 20% 30%, rgba(120, 80, 40, 0.08) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(120, 80, 40, 0.06) 0%, transparent 50%)',
          }}
        />

        {/* Title */}
        <h3
          className="font-heading text-lg"
          style={{
            color: '#2c1e10',
            textShadow: '0 1px 0 rgba(255,255,255,0.4)',
          }}
        >
          {notice.title}
        </h3>

        {/* Meta */}
        <p
          className="text-xs mt-1"
          style={{ color: '#6b4a2a', fontStyle: 'italic' }}
        >
          {notice.author_full_name} · {formatDateShort(notice.created_at)} ·{' '}
          {formatTime(notice.created_at)}
        </p>

        {/* Divider — ink line */}
        <div
          aria-hidden="true"
          className="my-3"
          style={{
            height: 1,
            background:
              'linear-gradient(to right, transparent 0%, #8a6a44 20%, #8a6a44 80%, transparent 100%)',
          }}
        />

        {/* Body */}
        <p
          className="text-sm whitespace-pre-wrap leading-relaxed"
          style={{ color: '#3a2a18' }}
        >
          {notice.body}
        </p>

        {/* Pinned badge */}
        {notice.pinned && (
          <span
            className="absolute bottom-3 right-3 text-[10px] uppercase tracking-wider"
            style={{
              color: '#8a2a2a',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
            }}
          >
            ★ Pinned
          </span>
        )}

        {/* Admin actions */}
        {canManage && (
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => onTogglePin?.(notice.id, !notice.pinned)}
              className="text-[11px] uppercase tracking-wider transition-opacity hover:opacity-70"
              style={{
                color: '#6b4a2a',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
              }}
            >
              {notice.pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(notice.id)}
              className="text-[11px] uppercase tracking-wider transition-opacity hover:opacity-70"
              style={{
                color: '#8a2a2a',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
              }}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Knife pin — absolutely positioned top-right, stabbing through the card */}
      <div
        className="absolute pointer-events-none"
        style={{ top: -28, right: 8 }}
      >
        <KnifePin
          animateOnMount={animate}
          delay={Math.min(index * 0.12, 0.6) + 0.35}
        />
      </div>
    </motion.article>
  );
}