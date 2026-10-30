import { ClipboardCopy, type ClipboardCopyProps } from '@patternfly/react-core';

import {
  getLwClipboardCopyDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './clipboard-copy.css';

/**
 * Owned slots + PF `ClipboardCopy` passthrough — `className` / `style` / rest merge onto the host.
 * Omit HTML `ref` — PF host is a class component; DOM ref typing does not apply.
 * Lightwell-specific props land in the leading object as they are decided.
 */
export type LwClipboardCopyProps = {
  // Lightwell-specific props land here as they are decided.
} & Omit<ClipboardCopyProps, 'ref'>;

/**
 * Kit **primitive** — configured PF `ClipboardCopy`.
 * Logic harness, not a DOM wrap: root = `ClipboardCopy`.
 * Defaults live in `components.config.ts` → `componentsConfig.clipboardCopy`.
 */
export function LwClipboardCopy({ className, ...rest }: LwClipboardCopyProps) {
  const clipboardProps = mergeComponentProps<LwClipboardCopyProps>(getLwClipboardCopyDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-clipboard-copy', className),
  });
  return <ClipboardCopy {...clipboardProps} />;
}

export default LwClipboardCopy;
