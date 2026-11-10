import { Modal, type ModalProps } from '@patternfly/react-core';
import type { ReactNode } from 'react';

import {
  getLwModalDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './modal.css';

type LwModalOwnedProps = {
  /**
   * Modal interior. Root-only harness: `ModalHeader` / `ModalBody` / `ModalFooter`
   * stay call-site composition until a second surface earns kit slots.
   */
  children?: ReactNode;
};

/** Owned `children` + PF `Modal` passthrough — `className` / `style` / rest merge onto the host. */
export type LwModalProps = LwModalOwnedProps & Omit<ModalProps, 'children'>;

/**
 * Kit **primitive** — configured PF `Modal`.
 *
 * Logic harness, not a DOM wrap: root = `Modal`. One base unit, root only —
 * header / body / footer remain call-site children.
 * Defaults live in `components.config.ts` → `componentsConfig.modal`.
 * Presentational overrides → `modal.css`.
 */
export function LwModal({ className, children, ...rest }: LwModalProps) {
  const modalProps = mergeComponentProps(getLwModalDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-modal', className),
  });

  return <Modal {...modalProps}>{children}</Modal>;
}

export default LwModal;
