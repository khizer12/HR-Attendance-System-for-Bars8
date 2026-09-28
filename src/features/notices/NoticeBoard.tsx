import type { ReactNode } from 'react';

interface NoticeBoardProps {
  children: ReactNode;
}

/**
 * Wooden notice board, Wonderlands style. Layered gradients fake
 * wood grain; SVG overlays add planks and iron corner brackets.
 * Only the /notices page uses this. The rest of the app stays BARS 8.
 */
export function NoticeBoard({ children }: NoticeBoardProps) {
  return (
    <div
      className="relative rounded-md p-8 lg:p-12"
      style={{
        background: `
          repeating-linear-gradient(
            87deg,
            #4a2e1a 0px,
            #4a2e1a 3px,
            #3d2413 3px,
            #3d2413 6px
          ),
          linear-gradient(180deg, #5b3418 0%, #452a14 100%)
        `,
        backgroundBlendMode: 'overlay',
        border: '3px solid #1a1210',
        boxShadow:
          'inset 0 0 60px rgba(0,0,0,0.5), 0 8px 0 rgba(0,0,0,0.4), 0 16px 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* Horizontal plank separators */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none rounded-md"
        style={{
          background: `
            repeating-linear-gradient(
              180deg,
              transparent 0px,
              transparent 178px,
              rgba(0,0,0,0.4) 178px,
              rgba(0,0,0,0.4) 180px
            )
          `,
        }}
      />

      {/* Iron corner brackets */}
      <CornerBracket position="top-left" />
      <CornerBracket position="top-right" />
      <CornerBracket position="bottom-left" />
      <CornerBracket position="bottom-right" />

      {/* Inner shadow ring */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none rounded-md"
        style={{
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.45)',
        }}
      />

      {/* Content grid */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
        {children}
      </div>
    </div>
  );
}

function CornerBracket({
  position,
}: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  const size = 40;
  const positions: Record<typeof position, string> = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2 rotate-90',
    'bottom-right': 'bottom-2 right-2 rotate-180',
    'bottom-left': 'bottom-2 left-2 -rotate-90',
  };

  return (
    <div
      aria-hidden="true"
      className={`absolute pointer-events-none ${positions[position]}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 40 40" width={size} height={size}>
        {/* Iron plate */}
        <path
          d="M 2 2 L 26 2 L 26 8 L 8 8 L 8 26 L 2 26 Z"
          fill="#2a2a2e"
          stroke="#0e0e10"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Highlight */}
        <path
          d="M 4 4 L 24 4 L 24 6 L 6 6 L 6 24 L 4 24 Z"
          fill="#4a4a50"
          opacity="0.6"
        />
        {/* Rivets */}
        <circle cx="10" cy="10" r="1.5" fill="#8a8a92" stroke="#0e0e10" strokeWidth="0.8" />
        <circle cx="10" cy="20" r="1.5" fill="#8a8a92" stroke="#0e0e10" strokeWidth="0.8" />
        <circle cx="20" cy="10" r="1.5" fill="#8a8a92" stroke="#0e0e10" strokeWidth="0.8" />
      </svg>
    </div>
  );
}