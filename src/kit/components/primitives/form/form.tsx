import { Form, type FormProps } from '@patternfly/react-core';

import {
  getLwFormDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './form.css';

/** Owned slots + PF `Form` passthrough — `className` / `style` / rest merge onto the Form root. */
export type LwFormProps = FormProps;

/**
 * Kit **primitive** — configured PF `Form`.
 * Logic harness, not a DOM wrap: root = `Form`; call-site props win via mergeComponentProps.
 * Defaults live in `components.config.ts` → `componentsConfig.form`.
 *
 * PF `Form` renders a `<form>` element. Children are typically `FormGroup` +
 * form controls (inputs, checkboxes, selects). For filter-panel usage, the
 * form groups checkbox categories; no submit handler needed.
 */
export function LwForm({ className, children, ...rest }: LwFormProps) {
  const formProps = mergeComponentProps(getLwFormDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-form', className),
  });
  return <Form {...formProps}>{children}</Form>;
}

export default LwForm;
