/**
 * Path math for the race track. Two responsibilities:
 *   1. Sample an SVG path into N points once (avoids DOM calls in the rAF loop).
 *   2. Look up a point on the sampled curve at fraction t ∈ [0, 1].
 */

export interface SampledPoint {
  x: number;
  y: number;
}

export interface SampledPath {
  points: SampledPoint[];
}

/**
 * Sample an SVG <path> element into N points using the browser's
 * getPointAtLength. Must be called with a mounted DOM element.
 */
export function samplePath(path: SVGPathElement, n = 200): SampledPath {
  const total = path.getTotalLength();
  const points: SampledPoint[] = [];
  for (let i = 0; i < n; i++) {
    const len = (i / (n - 1)) * total;
    const pt = path.getPointAtLength(len);
    points.push({ x: pt.x, y: pt.y });
  }
  return { points };
}

/**
 * Return the point at fraction t along the sampled path, interpolating
 * between the two nearest samples. t is wrapped to [0, 1).
 */
export function pointAt(sample: SampledPath, t: number): SampledPoint {
  const N = sample.points.length;
  if (N === 0) return { x: 0, y: 0 };

  // Wrap t to [0, 1)
  const wrapped = ((t % 1) + 1) % 1;
  const scaled = wrapped * (N - 1);
  const i0 = Math.floor(scaled);
  const i1 = (i0 + 1) % N;
  const frac = scaled - i0;

  const a = sample.points[i0];
  const b = sample.points[i1];

  return {
    x: a.x + (b.x - a.x) * frac,
    y: a.y + (b.y - a.y) * frac,
  };
}

/**
 * Angle of travel at fraction t, in degrees. Used to rotate the car marker
 * so it points forward along the path.
 */
export function angleAt(sample: SampledPath, t: number): number {
  const N = sample.points.length;
  if (N < 2) return 0;

  const wrapped = ((t % 1) + 1) % 1;
  const scaled = wrapped * (N - 1);
  const i0 = Math.floor(scaled);
  const i1 = (i0 + 1) % N;

  const a = sample.points[i0];
  const b = sample.points[i1];

  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}