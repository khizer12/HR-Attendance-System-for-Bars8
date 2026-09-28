import { motion } from 'framer-motion';

interface KnifePinProps {
  /** When true, the knife plays the stab-in animation on mount. */
  animateOnMount?: boolean;
  /** Optional delay before the animation starts (seconds). */
  delay?: number;
  className?: string;
}

/**
 * Hand-drawn ink-outline knife pin. Plays a stab-in animation:
 *   approach → embed with slight overshoot → small recoil → settle.
 *
 * Sized ~64×80. Parent is expected to absolutely position it.
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
      style={{ width: 64, height: 80, pointerEvents: 'none' }}
      initial={
        animateOnMount
          ? { opacity: 0, y: -100, rotate: -25, scale: 0.8 }
          : false
      }
      animate={
        animateOnMount
          ? {
              opacity: [0, 1, 1, 1],
              y: [-100, 8, -3, 0],
              rotate: [-25, 6, -2, 0],
              scale: [0.8, 1.05, 1, 1],
            }
          : undefined
      }
      transition={{
        duration: 0.75,
        delay,
        times: [0, 0.55, 0.8, 1],
        ease: [0.34, 1.56, 0.64, 1],
      }}
    >
      <svg viewBox="0 0 64 80" width="64" height="80">
        {/* Blade — cel-shaded steel */}
        <path
          d="M 28 8 L 36 8 L 34 44 L 30 44 Z"
          fill="#d9d9de"
          stroke="#1a1210"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Blade highlight */}
        <path
          d="M 30 12 L 32 12 L 31 40 L 30 40 Z"
          fill="#f4f4f6"
          opacity="0.7"
        />
        {/* Blade edge */}
        <path
          d="M 28 8 L 26 46 L 30 44"
          fill="none"
          stroke="#8a8a92"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Guard — brass */}
        <path
          d="M 18 46 L 46 46 L 44 52 L 20 52 Z"
          fill="#c9a227"
          stroke="#1a1210"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Handle — dark wood with grain */}
        <path
          d="M 20 52 L 44 52 L 42 74 C 42 76 40 78 36 78 L 28 78 C 24 78 22 76 22 74 Z"
          fill="#5b3418"
          stroke="#1a1210"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Wood grain lines */}
        <path
          d="M 26 56 L 26 74 M 32 56 L 32 76 M 38 56 L 38 74"
          stroke="#3d2210"
          strokeWidth="1"
          opacity="0.6"
          strokeLinecap="round"
        />
        {/* Handle highlight */}
        <path
          d="M 24 54 L 28 54 L 28 76 L 25 76 Z"
          fill="#7a4a25"
          opacity="0.5"
        />

        {/* Rivets — brass dots */}
        <circle cx="24" cy="56" r="1.5" fill="#f0d77a" stroke="#1a1210" strokeWidth="1" />
        <circle cx="40" cy="56" r="1.5" fill="#f0d77a" stroke="#1a1210" strokeWidth="1" />
        <circle cx="24" cy="72" r="1.5" fill="#f0d77a" stroke="#1a1210" strokeWidth="1" />
        <circle cx="40" cy="72" r="1.5" fill="#f0d77a" stroke="#1a1210" strokeWidth="1" />
      </svg>
    </motion.div>
  );
}