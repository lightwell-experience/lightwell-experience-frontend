import { Popover, type PopoverProps } from '@patternfly/react-core';
import type { ReactElement, ReactNode } from 'react';

import {
  getLwPopoverDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './popover.css';

type LwPopoverOwnedProps = {
  /**
   * Trigger element — maps to PF Popover `children`.
   * Optional when using `triggerRef` for external trigger control.
   */
  hasTrigger?: ReactElement;
  /** Maps to PF `headerContent`. */
  hasHeader?: ReactNode;
  /** Maps to PF `bodyContent`. Required. */
  hasBody: ReactNode | ((hide: () => void) => ReactNode);
  /** Maps to PF `footerContent`. */
  hasFooter?: ReactNode | ((hide: () => void) => ReactNode);
};

/** Lightwell-owned props + PF `Popover` passthrough.
 * PF `children` / header / body / footer content props are owned by `has*`. */
export type LwPopoverProps = LwPopoverOwnedProps &
  Omit<PopoverProps, 'children' | 'headerContent' | 'bodyContent' | 'footerContent'>;

/**
 * Kit **primitive** — configured PF `Popover`.
 *
 * One base unit: host = `Popover`. Lightwell `has*` props map onto PF content slots;
 * they do not promote this to an assembly.
 * Defaults live in `components.config.ts` → `componentsConfig.popover`.
 */
export function LwPopover({
  hasTrigger,
  hasHeader,
  hasBody,
  hasFooter,
  className,
  ...rest
}: LwPopoverProps) {
  // `headerContent` / `bodyContent` / `footerContent` are excluded from
  // LwPopoverPassthroughProps (they are owned by `has*`). Merge only what the
  // config type allows, then spread the content slots directly onto the host.
  const popoverProps = mergeComponentProps(getLwPopoverDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-popover', className),
  });

  return (
    <Popover
      {...popoverProps}
      headerContent={hasHeader}
      bodyContent={hasBody}
      footerContent={hasFooter}
    >
      {hasTrigger}
    </Popover>
  );
}

export default LwPopover;
