import { ICONS, type IconName } from './icons.generated';

export function Icon({ name, size = 24, style }: { name: IconName; size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: 'block', flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
