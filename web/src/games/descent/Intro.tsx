import type { GameIntroProps } from '../registry';
import { DESCENT } from '../first-item/config';
import { FirstItemIntro } from '../first-item/Intro';

export default function DescentIntro({ onClose }: GameIntroProps) {
  return <FirstItemIntro config={DESCENT} onClose={onClose} />;
}
