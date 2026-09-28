import { motion } from 'framer-motion';

interface KnifePinProps {
  animateOnMount?: boolean;
  delay?: number;
  className?: string;
}

/**
 * Ink-outline knife. Blade points DOWN so the tip stabs into the
 * parchment. Plays a stab-in animation: approach → embed with slight
 * overshoot → small recoil → settle.
 */
export function KnifePin({
  animateOnMount = true,
  delay = 0,
  className,
}: KnifePinProps) {
  return (
    <motion.div
      aria-hidden="true"
      className={className}
      style={{ width: 72, height: 100, pointerEvents: 'none' }}
      initial={
        animateOnMount
          ? { opacity: 0, y: -80, rotate: -18, scale: 0.85 }
          : false
      }
      animate={
        animateOnMount
          ? {
              opacity: [0, 1, 1, 1, 1],
              y: [-80, 10, -4, 2, 0],
              rotate: [-18, 6, -2, 1, 0],
              scale: [0.85, 1.05, 0.99, 1, 1],
            }
          : undefined
      }
      transition={{
        duration: 0.85,
        delay,
        times: [0, 0.5, 0.72, 0.88, 1],
        ease: [0.34, 1.56, 0.64, 1],
      }}
    >
      <svg viewBox="0 0 72 100" width="72" height="100">
        {/* ===== HANDLE (top) — dark wood ===== */}
        <path
          d="M 22 4 L 50 4 L 48 34 L 24 34 Z"
          fill="#5b3418"
          stroke="#1a1210"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Wood grain */}
        <path
          d="M 28 8 L 28 32 M 36 8 L 36 32 M 44 8 L 44 32"
          stroke="#3d2210"
          strokeWidth="1"
          opacity="0.6"
          strokeLinecap="round"
        />
        {/* Handle highlight */}
        <path
          d="M 26 6 L 30 6 L 30 32 L 26 32 Z"
          fill="#7a4a25"
          opacity="0.5"
        />
        {/* Rivets */}
        <circle cx="28" cy="12" r="1.5" fill="#f0d77a" stroke="#1a1210" strokeWidth="1" />
        <circle cx="44" cy="12" r="1.5" fill="#f0d77a" stroke="#1a1210" strokeWidth="1" />
        <circle cx="28" cy="28" r="1.5" fill="#f0d77a" stroke="#1a1210" strokeWidth="1" />
        <circle cx="44" cy="28" r="1.5" fill="#f0d77a" stroke="#1a1210" strokeWidth="1" />

        {/* ===== GUARD — brass, below the handle ===== */}
        <path
          d="M 16 34 L 56 34 L 54 42 L 18 42 Z"
          fill="#c9a227"
          stroke="#1a1210"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M 18 36 L 54 36 L 53 38 L 19 38 Z"
          fill="#f0d77a"
          opacity="0.75"
        />

        {/* ===== BLADE (bottom) — tapering to a point ===== */}
        <path
          d="M 24 42
             L 48 42
             L 46 68
             L 42 84
             L 36 96
             L 30 84
             L 26 68
             Z"
          fill="#d9d9de"
          stroke="#1a1210"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Blade highlight — left edge */}
        <path
          d="M 28 46 L 34 46 L 32 82 L 30 86 Z"
          fill="#f4f4f6"
          opacity="0.75"
        />
        {/* Blade edge — right, darker */}
        <path
          d="M 44 46 L 46 68 L 42 84 L 38 78"
          fill="none"
          stroke="#7a7a82"
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Fuller (center groove) */}
        <path
          d="M 36 46 L 36 82"
          stroke="#8a8a92"
          strokeWidth="1"
          opacity="0.55"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}