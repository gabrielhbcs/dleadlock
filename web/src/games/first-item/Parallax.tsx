import { useEffect, useState } from 'react';

const SRC = `${import.meta.env.BASE_URL}backgrounds/city-vertical.webp`;
const SRC_W = 2560;
const SRC_H = 3840;
// The image is always drawn at least this many viewport heights tall, so there
// is room to travel even on tall phone screens (the sides get cropped instead).
const MIN_SCREENS = 1.8;

/**
 * Full-screen background: one tall painting that scrolls from the sky (depth 0)
 * down to the street (depth 1).
 */
export function Parallax({ depth }: { depth: number }) {
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

  return (
    <div className="parallax" aria-hidden="true">
      <img
        src={SRC}
        alt=""
        className="parallax-layer"
        style={{ width: w, left: (size.w - w) / 2, transform: `translateY(${-travel * d}px)` }}
      />
      <div className="parallax-shade" />
    </div>
  );
}
