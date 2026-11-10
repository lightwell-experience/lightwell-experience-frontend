import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { createUseStyles } from 'react-jss';

import { LwButton, LwIcon } from 'kit/components/primitives';
import type { ClearinghousePackageSummary } from 'services/Lightwell/ClearinghouseApi';

export const pluralizePackages = (count: number) =>
  `${count} ${count === 1 ? 'package' : 'packages'}`;

export type SubmissionPackageSummaryProps = {
  summary: ClearinghousePackageSummary;
  /** Optional suffix after the total, e.g. "found". */
  totalSuffix?: string;
  /** When set, renders an inline "Details" link. */
  onDetailsClick?: () => void;
};

const useStyles = createUseStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 'var(--pf-t--global--spacer--sm)',
    // Small subtle text, same tokens as PF Content `small` — without Content's
    // block margins, which misalign an inline row.
    fontSize: 'var(--pf-t--global--font--size--body--sm)',
    lineHeight: 'var(--pf-t--global--font--line-height--body)',
    color: 'var(--pf-t--global--text--color--subtle)',
  },
  invalid: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--pf-t--global--spacer--xs)',
  },
});

/**
 * One-line package summary for a submission: the unique package total, a warning
 * with the invalid packageurl count (only when there are invalid ones), and an
 * optional inline "Details" link.
 */
const SubmissionPackageSummary = ({
  summary,
  totalSuffix,
  onDetailsClick,
}: SubmissionPackageSummaryProps) => {
  const classes = useStyles();

  return (
    <div className={classes.root} data-ouia-component-id='submission-package-summary'>
      <span>
        {pluralizePackages(summary.total)}
        {totalSuffix ? ` ${totalSuffix}` : ''}
      </span>
      {summary.invalid_purls > 0 ? (
        <>
          <span aria-hidden>·</span>
          <span className={classes.invalid}>
            <LwIcon status='warning' size='sm'>
              <ExclamationTriangleIcon />
            </LwIcon>
            {summary.invalid_purls} invalid
          </span>
        </>
      ) : null}
      {onDetailsClick ? (
        <>
          <span aria-hidden>·</span>
          <LwButton
            variant='link'
            isInline
            size='sm'
            onClick={onDetailsClick}
            ouiaId='submission-package-details'
          >
            Details
          </LwButton>
        </>
      ) : null}
    </div>
  );
};

export default SubmissionPackageSummary;
