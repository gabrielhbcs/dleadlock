import type { GameIntroProps } from '../registry';
import { ASCENT } from '../first-item/config';
import { FirstItemIntro } from '../first-item/Intro';

export default function AscentIntro({ onClose }: GameIntroProps) {
  return <FirstItemIntro config={ASCENT} onClose={onClose} />;
}
