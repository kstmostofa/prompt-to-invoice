import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";

export type IconProps = HugeiconsIconProps;

/**
 * Renders a Hugeicons glyph: `<Icon icon={Search01Icon} className="size-4" />`.
 *
 * Import the glyph itself from `@hugeicons/core-free-icons` at the call site so
 * the icon you get is the one you named. Components that take an icon as a prop
 * should type it as `IconSvgElement` and pass it through to this component.
 */
export default function Icon({ strokeWidth = 2, ...props }: IconProps) {
  return <HugeiconsIcon {...props} strokeWidth={strokeWidth} />;
}
