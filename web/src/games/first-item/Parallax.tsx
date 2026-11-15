import { useEffect, useState } from 'react';

const BASE = `${import.meta.env.BASE_URL}descent/city-top/`;

// Layers cut from gameplay footage (back to front). `speed` is how far each one
// scrolls relative to the front layer as the camera goes down.
const LAYERS = [
  { file: '0_sky.png', speed: 0 },
  { file: '1_far.png', speed: 0.12 },
  { file: '2_horizon.png', speed: 0.28 },
  { file: '3_mid.png', speed: 0.54 },
  { file: '4_front.png', speed: 1 },
];
const SRC_W = 1280;
const SRC_H = 720;
// Max scroll of the front layer, in source pixels. The source images only have
// this much spare height, so the visible window is SRC_H - TRAVEL tall.
const TRAVEL = 180;

/** Full-screen parallax background. `depth` goes from 0 (sky) to 1 (deepest). */
export function Parallax({ depth }: { depth: number }) {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Scale so the visible window (SRC_W x (SRC_H - TRAVEL)) covers the viewport.
  const scale = Math.max(size.w / SRC_W, size.h / (SRC_H - TRAVEL));
  const w = SRC_W * scale;
  const left = (size.w - w) / 2;
  const d = Math.min(1, Math.max(0, depth));

  return (
    <div className="parallax" aria-hidden="true">
      {LAYERS.map((l) => (
        <img
          key={l.file}
          src={BASE + l.file}
          alt=""
          className="parallax-layer"
          style={{
            width: w,
            left,
            transform: `translateY(${-l.speed * TRAVEL * scale * d}px)`,
          }}
        />
      ))}
      <div className="parallax-shade" style={{ opacity: 0.35 + 0.4 * d }} />
    </div>
  );
}
