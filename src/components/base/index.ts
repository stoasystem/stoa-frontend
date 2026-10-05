/*
 * The base components of the STOA design language (#18), drawn from the
 * canvas boards Sizes and Components. New screens build from these; the
 * shadcn-style primitives in `@/components/ui` serve the pages that predate
 * the redesign until their slices restyle them.
 */
export { Avatar, initialsOf, type AvatarSize, type AvatarTone } from '@/components/base/Avatar'
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from '@/components/base/Button'
export { Composer, type ComposerProps, type ComposerVariant } from '@/components/base/Composer'
export { Group, Row, rowHeight, type RowLeading, type RowProps } from '@/components/base/Group'
export { IconButton, type IconButtonProps, type IconButtonSize, type IconButtonVariant } from '@/components/base/IconButton'
export { Pill, PresenceDot, type PillTone } from '@/components/base/Pill'
export { Progress } from '@/components/base/Progress'
export { SearchField, type SearchFieldProps, type SearchFieldSize } from '@/components/base/SearchField'
export {
  SegmentedFilter,
  SegmentedNav,
  type SegmentedNavItem,
  type SegmentedOption,
} from '@/components/base/Segmented'
export { Stats, type Stat } from '@/components/base/Stats'
export { TextField, type TextFieldProps } from '@/components/base/TextField'
export { Toggle, type ToggleProps } from '@/components/base/Toggle'
