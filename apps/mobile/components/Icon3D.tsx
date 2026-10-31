/* eslint-disable @typescript-eslint/no-require-imports */
import { Image, ImageSourcePropType, StyleProp, ImageStyle } from 'react-native';

const ICONS: Record<string, ImageSourcePropType> = {
  abacus: require('../assets/icons/abacus.png'),
  bell: require('../assets/icons/bell.png'),
  books: require('../assets/icons/books.png'),
  bookshelf: require('../assets/icons/bookshelf.png'),
  brain: require('../assets/icons/brain.png'),
  calendar: require('../assets/icons/calendar.png'),
  chart: require('../assets/icons/chart.png'),
  check: require('../assets/icons/check.png'),
  clipboard: require('../assets/icons/clipboard.png'),
  crayon: require('../assets/icons/crayon.png'),
  cross: require('../assets/icons/cross.png'),
  fire: require('../assets/icons/fire.png'),
  'glowing-star': require('../assets/icons/glowing-star.png'),
  'graduation-cap': require('../assets/icons/graduation-cap.png'),
  hourglass: require('../assets/icons/hourglass.png'),
  'light-bulb': require('../assets/icons/light-bulb.png'),
  magnifier: require('../assets/icons/magnifier.png'),
  'medal-1st': require('../assets/icons/medal-1st.png'),
  medal: require('../assets/icons/medal.png'),
  microscope: require('../assets/icons/microscope.png'),
  'open-book': require('../assets/icons/open-book.png'),
  palette: require('../assets/icons/palette.png'),
  'party-popper': require('../assets/icons/party-popper.png'),
  pencil: require('../assets/icons/pencil.png'),
  puzzle: require('../assets/icons/puzzle.png'),
  rocket: require('../assets/icons/rocket.png'),
  ruler: require('../assets/icons/ruler.png'),
  sparkles: require('../assets/icons/sparkles.png'),
  'speech-balloon': require('../assets/icons/speech-balloon.png'),
  star: require('../assets/icons/star.png'),
  target: require('../assets/icons/target.png'),
  'test-tube': require('../assets/icons/test-tube.png'),
  trophy: require('../assets/icons/trophy.png'),
  'waving-hand': require('../assets/icons/waving-hand.png'),
};

export type Icon3DName = keyof typeof ICONS;

export const ICON3D_NAMES = Object.keys(ICONS) as Icon3DName[];

interface Props {
  name: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function Icon3D({ name, size = 32, style }: Props) {
  const src = ICONS[name];
  if (!src) return null;
  return <Image source={src} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
}

export function hasIcon3D(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(ICONS, name);
}
