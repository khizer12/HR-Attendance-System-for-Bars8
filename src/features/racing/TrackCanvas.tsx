import { useEffect, useRef, useState } from 'react';

import { angleAt, pointAt, samplePath, type SampledPath } from '@/features/racing/geometry';
import { WeatherOverlay } from '@/features/racing/WeatherOverlay';
import type { WeatherCondition } from '@/features/racing/weather';
import type { RaceParticipant, RacingTrack } from '@/types/racing';

interface TrackCanvasProps {
  track: RacingTrack;
  participants: RaceParticipant[];
  /** Minutes-worked for each participant INCLUDING live time (from parent). */
  liveMinutes: Map<string, number>;
  /** The current user's id — used to draw their car on top. */
  selfId: string | null;
  /** Whether the camera should follow the user's car. */
  cameraFollow: boolean;
    /** 1 = fit whole track, 2 = zoom 2x, 3 = zoom 3x. */
  zoomLevel: number;
  /** Optional weather condition; if provided, renders an overlay. */
  weatherCondition?: WeatherCondition;
  /** Whether it's daytime in Dubai. */
  weatherIsDay?: boolean;
}

const VIEWBOX_W = 1000;
const VIEWBOX_H = 600;

export function TrackCanvas({
  track,
  participants,
  liveMinutes,
  selfId,
  cameraFollow,
  zoomLevel,
  weatherCondition,
  weatherIsDay = true,
}: TrackCanvasProps) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [sample, setSample] = useState<SampledPath | null>(null);

  // Sample the path once after mount (and when the track changes).
  useEffect(() => {
    if (!pathRef.current) return;
    setSample(samplePath(pathRef.current, 240));
  }, [track.id, track.path_data]);

  const w = VIEWBOX_W / zoomLevel;
  const h = VIEWBOX_H / zoomLevel;

  // Determine camera center — user's car if following, else track center.
  let cx = VIEWBOX_W / 2;
  let cy = VIEWBOX_H / 2;

  if (sample && cameraFollow && selfId) {
    const self = participants.find((p) => p.user_id === selfId);
    if (self) {
      const mins = liveMinutes.get(self.user_id) ?? 0;
      const t = ((mins % 60) / 60);
      const pt = pointAt(sample, t);
      cx = pt.x;
      cy = pt.y;
    }
  }

  const viewBoxX = Math.max(0, Math.min(VIEWBOX_W - w, cx - w / 2));
  const viewBoxY = Math.max(0, Math.min(VIEWBOX_H - h, cy - h / 2));

    return (
    <div className="relative rounded-lg overflow-hidden border border-charcoal-3 bg-near-black">
      {weatherCondition && (
        <WeatherOverlay
          condition={weatherCondition}
          isDay={weatherIsDay}
        />
      )}
      <svg
        viewBox={`${viewBoxX} ${viewBoxY} ${w} ${h}`}
        className="w-full h-auto"
        style={{ aspectRatio: `${VIEWBOX_W} / ${VIEWBOX_H}` }}
        role="img"
        aria-label={`${track.name} circuit`}
      >
        {/* Track fill (subtle) */}
        <path
          d={track.path_data}
          fill="none"
          stroke="rgba(220, 38, 38, 0.10)"
          strokeWidth={60}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Track surface (visible) */}
        <path
          d={track.path_data}
          fill="none"
          stroke="#3a3a3a"
          strokeWidth={24}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Reference path — this is the one we sample. Invisible. */}
        <path
          ref={pathRef}
          d={track.path_data}
          fill="none"
          stroke="none"
          strokeWidth={0}
        />

        {/* Start/finish line */}
        {sample && (
          <line
            x1={pointAt(sample, 0).x}
            y1={pointAt(sample, 0).y - 14}
            x2={pointAt(sample, 0).x}
            y2={pointAt(sample, 0).y + 14}
            stroke="#dc2626"
            strokeWidth={3}
          />
        )}

        {/* Cars */}
        {sample &&
          participants.map((p) => {
            const mins = liveMinutes.get(p.user_id) ?? 0;
            const t = ((mins % 60) / 60);
            const pt = pointAt(sample, t);
            const angle = angleAt(sample, t);

            const isSelf = p.user_id === selfId;
            const color = p.car?.accent_color ?? '#888888';

            return (
              <g
                key={p.user_id}
                transform={`translate(${pt.x}, ${pt.y}) rotate(${angle})`}
                opacity={p.on_track ? 1 : 0.35}
              >
                {/* Car body — a rotated capsule */}
                <ellipse
                  rx={10}
                  ry={5}
                  fill={color}
                  stroke={isSelf ? '#f0e6d6' : 'rgba(0,0,0,0.4)'}
                  strokeWidth={isSelf ? 2 : 1}
                />
                {/* Windshield */}
                <ellipse
                  cx={3}
                  cy={0}
                  rx={3}
                  ry={3}
                  fill="rgba(0,0,0,0.5)"
                />
                {/* Pit-stop indicator */}
                {p.on_pit && (
                  <circle
                    cx={0}
                    cy={0}
                    r={14}
                    fill="none"
                    stroke="#e0b350"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                  />
                )}
              </g>
            );
          })}
      </svg>
    </div>
  );
}