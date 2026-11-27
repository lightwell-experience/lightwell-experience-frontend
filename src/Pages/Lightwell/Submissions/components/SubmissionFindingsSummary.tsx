import { ShieldAltIcon } from '@patternfly/react-icons';
import { createUseStyles } from 'react-jss';

import { LwButton, LwIcon, LwPopover } from 'kit/components/primitives';
import type { ClearinghouseFindingsSummary } from 'services/Lightwell/ClearinghouseApi';

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

/**
 * Human-readable breakdown of the non-zero finding kinds, e.g.
 * "2 email addresses, 1 credential".
 */
export const describeFindings = (summary: ClearinghouseFindingsSummary) =>
  [
    summary.emails ? pluralize(summary.emails, 'email address', 'email addresses') : null,
    summary.home_usernames
      ? pluralize(summary.home_usernames, 'username in file paths', 'usernames in file paths')
      : null,
    summary.credentials ? pluralize(summary.credentials, 'credential', 'credentials') : null,
    summary.ip_addresses ? pluralize(summary.ip_addresses, 'IP address', 'IP addresses') : null,
  ]
    .filter(Boolean)
    .join(', ');

export type SubmissionFindingsSummaryProps = {
  summary: ClearinghouseFindingsSummary;
};

const useStyles = createUseStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 'var(--pf-t--global--spacer--sm)',
    // Same small subtle text as SubmissionPackageSummary.
    fontSize: 'var(--pf-t--global--font--size--body--sm)',
    lineHeight: 'var(--pf-t--global--font--line-height--body)',
    color: 'var(--pf-t--global--text--color--subtle)',
  },
  message: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--pf-t--global--spacer--xs)',
  },
});

/**
 * One-line feedback on the automatic scan the backend ran on the report. The
 * report is stored unchanged and the counts are possible findings (they can
 * include false positives), so the line invites the customer to review the
 * report. It is kept to one short line; the "Learn more" popover holds the
 * per-kind breakdown, the STAM review note and the limits of automatic
 * detection. Callers render this only when `summary.total > 0`.
 */
const SubmissionFindingsSummary = ({ summary }: SubmissionFindingsSummaryProps) => {
  const classes = useStyles();

  return (
    <div className={classes.root} data-ouia-component-id='submission-findings-summary'>
      <span className={classes.message}>
        <LwIcon size='sm'>
          <ShieldAltIcon />
        </LwIcon>
        {`${pluralize(summary.total, 'possible sensitive item', 'possible sensitive items')} found — review before submitting`}
      </span>
      <span aria-hidden>·</span>
      <LwPopover
        aria-label='About the automatic scan'
        hasHeader='Automatic scan'
        hasBody={
          <>
            <p>Found: {describeFindings(summary)}.</p>
            <p>
              You can review your report before submitting it. Either way, your STAM reviews it
              first and scrubs any sensitive data.
            </p>
            <p>
              We scan reports for email addresses, usernames in file paths, credentials and IP
              addresses. Your report is not changed. The scan can flag values that are not sensitive
              and cannot find everything (e.g. customer names, internal hostnames).
            </p>
          </>
        }
        hasTrigger={
          <LwButton variant='link' isInline size='sm' ouiaId='submission-findings-info'>
            Learn more
          </LwButton>
        }
      />
    </div>
  );
};

export default SubmissionFindingsSummary;
