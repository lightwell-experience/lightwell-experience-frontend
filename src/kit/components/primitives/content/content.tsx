import { Content, type ContentProps } from '@patternfly/react-core';

import {
  getLwContentDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './content.css';

/** Owned slots + PF `Content` passthrough — `className` / `style` / rest merge onto the Content root. */
export type LwContentProps = ContentProps;

/**
 * Kit **primitive** — configured PF `Content`.
 * Logic harness, not a DOM wrap: root = `Content`; call-site props win via mergeComponentProps.
 * Defaults live in `components.config.ts` → `componentsConfig.content`.
 */
export function LwContent({ className, ...rest }: LwContentProps) {
  const contentProps = mergeComponentProps(getLwContentDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-content', className),
  });
  return <Content {...contentProps} />;
}

export default LwContent;
