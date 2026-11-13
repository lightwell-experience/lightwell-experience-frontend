import type { CSSProperties, ReactNode } from 'react';

import { Content } from '@patternfly/react-core';

import { mergeClassNames } from 'kit/components/components.config';
import { LwIcon } from 'kit/components/primitives/icon/icon';
import { LwTitle } from 'kit/components/primitives/title/title';
import './page-chrome-slots.css';

/** Page-title companion icon size — owned here, not on the `LwIcon` primitive. */
const PAGE_TITLE_ICON_SIZE = '2xl' as const;

export type PageTitleStackProps = {
  title?: ReactNode;
  description?: ReactNode;
  /**
   * Icon content for the title row — wrapped in `LwIcon` (`size` from page assembly)
   * when `title` is a string. Ignored when `title` is a custom node.
   */
  icon?: ReactNode;
  /**
   * Labels appended after the heading in the title row (e.g. `LwLabel` status),
   * vertically centered on the heading. The heading never wraps to make room.
   * Ignored when `title` is a custom node.
   */
  labels?: ReactNode;
  ouiaId?: string;
  className?: string;
};

/**
 * Shared title + description stack for LwPageHeader.
 * Page-family internal — also exported from the assemblies barrel for composition.
 *
 * String title → `LwTitle` (config-sized h1); optional `icon` → `LwIcon` beside it;
 * optional `labels` → appended after the heading.
 * String description → `Content` paragraph.
 * Non-string nodes render as-is (caller owns heading / copy structure).
 */
export function PageTitleStack({
  title,
  description,
  icon,
  labels,
  ouiaId,
  className,
}: PageTitleStackProps) {
  let titleNode: ReactNode = null;
  if (title != null) {
    if (typeof title === 'string') {
      const heading = (
        <LwTitle headingLevel='h1' ouiaId={ouiaId}>
          {title}
        </LwTitle>
      );
      titleNode =
        icon != null || labels != null ? (
          <div
            className={mergeClassNames(
              'lw-c-page-title-stack__title',
              labels != null ? 'lw-m-has-labels' : undefined,
            )}
          >
            {icon != null ? <LwIcon size={PAGE_TITLE_ICON_SIZE}>{icon}</LwIcon> : null}
            {heading}
            {labels != null ? (
              <span className='lw-c-page-title-stack__labels'>{labels}</span>
            ) : null}
          </div>
        ) : (
          heading
        );
    } else {
      titleNode = title;
    }
  }

  return (
    <div className={mergeClassNames('lw-c-page-title-stack', className)}>
      {titleNode}
      {description != null ? (
        typeof description === 'string' ? (
          <Content component='p' ouiaId={ouiaId}>
            {description}
          </Content>
        ) : (
          description
        )
      ) : null}
    </div>
  );
}

export type PageChromeSlotProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * One chrome column inside `PageChromeSlots`.
 * Owns `.lw-c-page-header-chrome-slot` — callers compose N of these as children.
 */
export function PageChromeSlot({ children, className, style }: PageChromeSlotProps) {
  return (
    <div className={mergeClassNames('lw-c-page-header-chrome-slot', className)} style={style}>
      {children}
    </div>
  );
}

export type PageChromeSlotFooterProps = {
  children?: ReactNode;
  className?: string;
};

/**
 * Bottom band inside `PageChromeSlot`.
 * Owns `.lw-c-page-header-chrome-slot__footer` — `margin-block-start: auto` pins it
 * to the slot floor. No extra padding / width / margin. Callers put stepper,
 * metrics, actions, etc. here.
 */
export function PageChromeSlotFooter({ children, className }: PageChromeSlotFooterProps) {
  return (
    <div className={mergeClassNames('lw-c-page-header-chrome-slot__footer', className)}>
      {children}
    </div>
  );
}

export type PageChromeSlotsProps = {
  children?: ReactNode;
  className?: string;
};

/**
 * Shared chrome-slot row for LwPageHeader (plain or hero surface).
 * One row = one `.lw-c-page-header-chrome-slots` with N `PageChromeSlot` children.
 * Callers stack multiple rows when the host needs more than one chrome band.
 */
export function PageChromeSlots({ children, className }: PageChromeSlotsProps) {
  if (children == null || children === false) {
    return null;
  }

  return (
    <div className={mergeClassNames('lw-c-page-header-chrome-slots', className)}>{children}</div>
  );
}
