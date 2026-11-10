import { useState, type ReactNode } from 'react';
import {
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  Content,
  Flex,
  FlexItem,
  Label,
  Pagination,
  PaginationVariant,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { SkeletonTable, WarningModal } from '@patternfly/react-component-groups';
import { Table, TableVariant, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { DownloadIcon, TrashIcon } from '@patternfly/react-icons';
import { capitalize } from 'lodash';
import { Link } from 'react-router-dom';

import Hide from 'components/Hide/Hide';
import useNotification from 'Hooks/useNotification';
import { formatDateDDMMMYYYY } from '../../../../helpers';
import { useAppContext } from 'middleware/AppContext';
import { isFeatureOn } from 'services/Features/FeatureApi';
import {
  downloadSubmissionArchive,
  type ClearinghouseSubmission,
  type SubmissionStatus,
} from 'services/Lightwell/ClearinghouseApi';
import {
  useDeleteSubmissionMutation,
  useSubmissionsListQuery,
} from 'services/Lightwell/ClearinghouseQueries';

import SubmissionDrawer from './SubmissionDrawer';
import { useSubmissionDrawerParams } from '../hooks/useSubmissionDrawerParams';
import { useCurrentUsername } from '../hooks/useCurrentUsername';

const SUBMISSION_MAIN_FILENAME = 'submission.json';

type SubmissionColumnKey =
  'name' | 'cid' | 'status' | 'created' | 'submitted' | 'processed' | 'actions';

type SubmissionColumn = {
  key: SubmissionColumnKey;
  title: string;
  requiresRead?: boolean;
};

// One catalog owns column order. `requiresRead` keeps CID off the table unless
// the clearinghouse read feature is on — the same gate the backend uses to fill `cid`.
const SUBMISSION_COLUMN_CATALOG: SubmissionColumn[] = [
  { key: 'name', title: 'Name' },
  { key: 'cid', title: 'CID', requiresRead: true },
  { key: 'status', title: 'Status' },
  { key: 'created', title: 'Created' },
  { key: 'submitted', title: 'Submitted' },
  { key: 'processed', title: 'Processed' },
];

const statusColor: Record<SubmissionStatus, 'blue' | 'green' | 'grey'> = {
  pending: 'blue',
  submitted: 'green',
  processed: 'grey',
};

/**
 * After deleting rows, clamp the current page to the last page that still holds
 * rows. Without this, deleting the only row on a later page leaves the list query
 * pinned to a now-empty offset: the response reads as an empty list and the
 * pagination that would get the user back is hidden. Mirrors
 * TemplateSystemsTab's calculatePageAfterSystemsDelete.
 */
export const calculatePageAfterDelete = (
  currentPage: number,
  perPage: number,
  totalItems: number,
  deletedItemsCount: number,
) => {
  if (deletedItemsCount <= 0) {
    return currentPage;
  }

  const nextTotalItems = Math.max(0, totalItems - deletedItemsCount);
  const maxPage = Math.max(1, Math.ceil(nextTotalItems / perPage));
  return Math.min(currentPage, maxPage);
};

const getFilename = (submission: ClearinghouseSubmission) => {
  if (submission.name) return submission.name;
  const files = submission.files ?? [];
  const main = files.find((file) => file.filename === SUBMISSION_MAIN_FILENAME) ?? files[0];
  return main?.filename ?? SUBMISSION_MAIN_FILENAME;
};

/**
 * A two-row date cell: the formatted date on top, "by <author>" beneath it.
 * The "by <author>" line is omitted when the author is the current user, to avoid
 * the odd "by me" phrasing.
 */
const DateAuthorCell = ({
  date,
  author,
  currentUsername,
}: {
  date?: string;
  author?: string;
  currentUsername?: string;
}) => {
  if (!date) return <>—</>;
  const showAuthor = !!author && author !== currentUsername;
  return (
    <Stack>
      <StackItem>{formatDateDDMMMYYYY(date)}</StackItem>
      {showAuthor ? (
        <StackItem>
          <Content component='small'>by {author}</Content>
        </StackItem>
      ) : null}
    </Stack>
  );
};

/**
 * Lists clearinghouse submissions in a repository-style table. Clicking a row's
 * filename opens that submission in a SubmissionDrawer (an overlay drawer, like
 * the Packages advisory details drawer); the open submission is tracked in the
 * `?submission=<uuid>` URL param. Each row's action column offers downloading the
 * whole submission as a zip and deleting it, each shown per the row's backend
 * `can_download` / `can_delete` flag; the column is hidden entirely when no
 * visible row supports either action.
 */
const SubmissionsTable = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [confirmDelete, setConfirmDelete] = useState<ClearinghouseSubmission | null>(null);

  const { notify } = useNotification();
  const { features } = useAppContext();
  const currentUsername = useCurrentUsername();
  const hasWrite = isFeatureOn(features?.lightwellclearinghouse);
  const hasRead = isFeatureOn(features?.lightwellclearinghouseread);

  const { getSubmissionSearch, replaceSubmissionLink } = useSubmissionDrawerParams();
  const { data, isLoading, isError } = useSubmissionsListQuery(page, perPage);
  const deleteMutation = useDeleteSubmissionMutation();

  const submissions = data?.data ?? [];
  const count = data?.meta?.count ?? 0;
  // Emptiness is derived from the total count, not the current page: a later page
  // can come back empty after its last row is deleted while earlier pages still
  // have rows, and that must not read as "no submissions".
  const isEmpty = !isLoading && !isError && count === 0;

  // Row actions follow the backend's per-caller permission flags.
  const showActions = submissions.some(
    (submission) => submission.can_delete || submission.can_download,
  );

  const handleDownload = (submission: ClearinghouseSubmission) =>
    downloadSubmissionArchive(submission.uuid).catch(() =>
      notify({
        variant: AlertVariant.danger,
        title: 'Could not download archive',
        description: 'Please try again.',
      }),
    );

  const handleDelete = (submission: ClearinghouseSubmission) =>
    deleteMutation.mutate(submission.uuid, {
      onSuccess: () => {
        // Clamp before the list refetches, so it never requests a now-empty offset.
        setPage((current) => calculatePageAfterDelete(current, perPage, count, 1));
        notify({ variant: AlertVariant.success, title: 'Submission deleted' });
      },
      onError: () =>
        notify({
          variant: AlertVariant.danger,
          title: 'Could not delete submission',
          description: 'Please try again.',
        }),
    });

  const columns: SubmissionColumn[] = [
    ...SUBMISSION_COLUMN_CATALOG.filter((column) => !column.requiresRead || hasRead),
    ...(showActions ? [{ key: 'actions' as const, title: 'Actions' }] : []),
  ];

  const renderCell = (key: SubmissionColumnKey, submission: ClearinghouseSubmission): ReactNode => {
    switch (key) {
      case 'name':
        return (
          <Button
            variant='link'
            isInline
            component={(props) => (
              <Link
                {...props}
                to={getSubmissionSearch(submission.uuid)}
                replace={replaceSubmissionLink}
              />
            )}
          >
            <code>{getFilename(submission)}</code>
          </Button>
        );
      case 'cid':
        return submission.cid || '—';
      case 'status':
        return (
          <Label isCompact color={statusColor[submission.status]}>
            {capitalize(submission.status)}
          </Label>
        );
      case 'created':
        return (
          <DateAuthorCell
            date={submission.created_at}
            author={submission.username}
            currentUsername={currentUsername}
          />
        );
      case 'submitted':
        return (
          <DateAuthorCell
            date={submission.submitted_at}
            author={submission.submitted_by}
            currentUsername={currentUsername}
          />
        );
      case 'processed':
        return (
          <DateAuthorCell
            date={submission.processed_at}
            author={submission.processed_by}
            currentUsername={currentUsername}
          />
        );
      case 'actions':
        return (
          <Flex spaceItems={{ default: 'spaceItemsNone' }} flexWrap={{ default: 'nowrap' }}>
            {submission.can_download ? (
              <FlexItem>
                <Button
                  variant='plain'
                  aria-label={`Download ${getFilename(submission)}`}
                  icon={<DownloadIcon />}
                  onClick={() => handleDownload(submission)}
                />
              </FlexItem>
            ) : null}
            {submission.can_delete ? (
              <FlexItem>
                <Button
                  variant='plain'
                  aria-label={`Delete ${getFilename(submission)}`}
                  icon={<TrashIcon />}
                  isDisabled={deleteMutation.isPending}
                  onClick={() => setConfirmDelete(submission)}
                />
              </FlexItem>
            ) : null}
          </Flex>
        );
    }
  };

  const paginationProps = {
    isDisabled: isLoading,
    itemCount: count,
    perPage,
    page,
    onSetPage: (_event: unknown, newPage: number) => setPage(newPage),
    onPerPageSelect: (_event: unknown, newPerPage: number, newPage: number) => {
      setPerPage(newPerPage);
      setPage(newPage);
    },
  };

  return (
    <SubmissionDrawer>
      <Stack hasGutter data-ouia-component-id='beacon-submissions' style={{ width: '100%' }}>
        <StackItem>
          <Content component='h3'>Submissions</Content>
        </StackItem>

        <Hide hide={!isError}>
          <Alert
            variant='danger'
            isInline
            isPlain
            title='Could not load submissions'
            data-ouia-component-id='beacon-submissions-error'
          />
        </Hide>

        <Hide hide={!isLoading || isError}>
          <div data-ouia-component-id='beacon-submissions-skeleton'>
            <SkeletonTable
              rows={perPage}
              columnsCount={columns.length}
              variant={TableVariant.compact}
            />
          </div>
        </Hide>

        <Hide hide={isLoading || isEmpty || isError}>
          <Table
            aria-label='Clearinghouse submissions table'
            ouiaId='beacon-submissions-table'
            variant={TableVariant.compact}
            isStriped
          >
            <Thead>
              <Tr>
                {columns.map((column) =>
                  column.key === 'actions' ? (
                    <Th key={column.key} screenReaderText={column.title} />
                  ) : (
                    <Th key={column.key}>{column.title}</Th>
                  ),
                )}
              </Tr>
            </Thead>
            <Tbody>
              {submissions.map((submission) => (
                <Tr key={submission.uuid}>
                  {columns.map((column) => (
                    <Td
                      key={column.key}
                      dataLabel={column.title}
                      isActionCell={column.key === 'actions'}
                    >
                      {renderCell(column.key, submission)}
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Hide>

        <Hide hide={isLoading || isEmpty || count < 10}>
          <Pagination
            id='beacon-submissions-bottom-pagination'
            widgetId='beaconSubmissionsBottomPagination'
            variant={PaginationVariant.bottom}
            isStatic
            {...paginationProps}
          />
        </Hide>

        <Hide hide={!isEmpty}>
          <Content component='small' data-ouia-component-id='beacon-submissions-empty'>
            {hasWrite
              ? 'No submissions yet. Submit a vulnerability findings JSON payload to see it listed here.'
              : "No submissions yet. Submissions from customers will appear here once they're received."}
          </Content>
        </Hide>
      </Stack>

      {confirmDelete ? (
        <WarningModal
          isOpen
          title='Delete submission?'
          withCheckbox={false}
          confirmButtonLabel='Delete all'
          confirmButtonVariant={ButtonVariant.danger}
          onConfirm={() => {
            handleDelete(confirmDelete);
            setConfirmDelete(null);
          }}
          onClose={() => setConfirmDelete(null)}
          ouiaId='submissions-delete-confirm'
        >
          {`This permanently deletes "${getFilename(confirmDelete)}" and all of its files. This cannot be undone.`}
        </WarningModal>
      ) : null}
    </SubmissionDrawer>
  );
};

export default SubmissionsTable;
