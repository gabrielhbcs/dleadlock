import { useEffect, useState } from 'react';

const SRC = `${import.meta.env.BASE_URL}backgrounds/city-vertical.webp`;
const SRC_W = 2560;
const SRC_H = 3840;
// The image is always drawn at least this many viewport heights tall, so there
// is room to travel even on tall phone screens (the sides get cropped instead).
const MIN_SCREENS = 1.8;

export interface DepthMarker {
  /** Background depth where the line sits (0 = sky, 1 = street). */
  at: number;
  label: string;
  /** Zone lines are bigger and carry a name; the others are plain distance ticks. */
  zone?: string;
  /** The player already got past this line. */
  reached: boolean;
}

/**
 * Full-screen background: one tall painting that scrolls from the sky (depth 0)
 * down to the street (depth 1), with depth lines that pass by as it moves.
 * A line sits in the middle of the screen when the depth matches its `at`, so
 * the middle of the screen is where the player is (the `here` marker).
 */
export function Parallax({ depth, markers = [], here }: { depth: number; markers?: DepthMarker[]; here?: string }) {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const scale = Math.max(size.w / SRC_W, (size.h * MIN_SCREENS) / SRC_H);
  const w = SRC_W * scale;
  const h = SRC_H * scale;
  const travel = h - size.h;
  const d = Math.min(1, Math.max(0, depth));
  const transform = `translateY(${-travel * d}px)`;

  return (
    <div className="parallax" aria-hidden="true">
      <img src={SRC} alt="" className="parallax-layer" style={{ width: w, left: (size.w - w) / 2, transform }} />
      <div className="parallax-shade" />
      <div className="depth-lines" style={{ height: h, transform }}>
        {markers.map((m) => (
          <div
            key={`${m.at}:${m.label}`}
            className={`depth-line${m.zone ? ' zone' : ''}${m.reached ? ' reached' : ''}`}
            style={{ top: size.h / 2 + travel * m.at }}
          >
            <span className="depth-label">
              {m.zone && <strong>{m.zone}</strong>}
              <span>{m.label}</span>
            </span>
          </div>
        ))}
      </div>
      {here && (
        <div className="depth-here">
          <span className="depth-here-label">{here}</span>
        </div>
      )}
    </div>
  );
}
