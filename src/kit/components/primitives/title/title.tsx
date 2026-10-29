import { Title, type TitleProps } from '@patternfly/react-core';

import {
  getLwTitleDefaults,
  getLwTitleSizeForLevel,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './title.css';

/** Owned slots + PF `Title` passthrough — `className` / `style` / rest merge onto the Title root. */
export type LwTitleProps = {
  // Lightwell-specific props land here as they are decided.
} & TitleProps;

/**
 * Kit **primitive** — configured PF `Title`.
 * Logic harness, not a DOM wrap: root = `Title`.
 * `headingLevel` selects the configured size from `componentsConfig.title.sizes`
 * unless the call site passes `size` explicitly.
 */
export function LwTitle({ className, headingLevel, size, ...rest }: LwTitleProps) {
  const titleProps = mergeComponentProps(getLwTitleDefaults(), {
    ...rest,
    headingLevel,
    size: size ?? getLwTitleSizeForLevel(headingLevel),
    className: mergeClassNames('lw-c-title', className),
  });
  return <Title {...titleProps} />;
}

export default LwTitle;
