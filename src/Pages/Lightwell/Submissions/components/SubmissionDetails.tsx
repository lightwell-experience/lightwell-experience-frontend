import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Bullseye,
  ButtonVariant,
  Content,
  Divider,
  Flex,
  FlexItem,
  Icon,
  Label,
  Skeleton,
  Spinner,
  Stack,
  StackItem,
  Tab,
  Tabs,
  TabTitleText,
} from '@patternfly/react-core';
import { WarningModal } from '@patternfly/react-component-groups';
import { CheckCircleIcon, DownloadIcon, PlusCircleIcon, TrashIcon } from '@patternfly/react-icons';
import { createUseStyles } from 'react-jss';
import { capitalize } from 'lodash';

import { LwButton } from 'kit/components/primitives';
import type {
  ClearinghouseSubmissionFile,
  SubmissionStatus,
} from 'services/Lightwell/ClearinghouseApi';

import { formatDateDDMMMYYYY } from '../../../../helpers';
import { useSubmissionDetail } from '../hooks/useSubmissionDetail';
import { useCurrentUsername } from '../hooks/useCurrentUsername';
import type { SubmissionDrawerTab } from '../hooks/useSubmissionDrawerParams';
import { usePendingReproducers } from './PendingReproducersContext';
import SubmissionEcosystemChart from './SubmissionEcosystemChart';
import SubmissionPackageSummary from './SubmissionPackageSummary';
import SubmissionPackagesTable from './SubmissionPackagesTable';

export type SubmissionDetailsProps = {
  /** The submission to render; the component fetches it itself. */
  uuid: string;
  /** Fired after the whole submission is deleted (collapse / close the drawer). */
  onDeleted?: () => void;
  /** Fired after the submission is submitted for validation (close the drawer). */
  onSubmitted?: () => void;
  /** Controlled active tab (the drawer keeps it in the URL); falls back to local state. */
  activeTab?: SubmissionDrawerTab;
  onTabChange?: (tab: SubmissionDrawerTab) => void;
};

type ConfirmState = {
  title: string;
  body: string;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  action: () => void;
};

const statusColor: Record<SubmissionStatus, 'blue' | 'green' | 'grey'> = {
  pending: 'blue',
  submitted: 'green',
  processed: 'grey',
};

const useStyles = createUseStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    minHeight: 0,
    height: '100%',
  },
  list: {
    flex: '1 1 auto',
    minHeight: 0,
    overflowY: 'auto',
    padding: 'var(--pf-t--global--spacer--md)',
  },
  footer: {
    flex: '0 0 auto',
    borderTop:
      'var(--pf-t--global--border--width--divider--default) solid var(--pf-t--global--border--color--default)',
    padding: 'var(--pf-t--global--spacer--md)',
    background: 'var(--pf-t--global--background--color--primary--default)',
  },
  tabBody: {
    paddingTop: 'var(--pf-t--global--spacer--md)',
  },
  packagesTabBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--pf-t--global--spacer--md)',
    paddingTop: 'var(--pf-t--global--spacer--md)',
  },
});

/**
 * Drawer body for a single clearinghouse submission. The drawer's own head holds
 * the static "Submission details" title; this fills the rest of the panel: a
 * header block (filename — downloadable on its own — status and a one-line
 * package summary, plus a "Download all" archive action), then two tabs:
 * Reproducers (default; the reproducer files with an "Add more reproducers"
 * control) and Packages (a per-ecosystem chart and a filterable package table),
 * above a sticky footer. Submissions created before package parsing have no
 * package summary, so they show the reproducers without tabs. The footer offers
 * delete-all / submit / download-all / "Mark as processed", each shown only when
 * the backend's permission flag for it is set, and is hidden entirely when no
 * action is available. Per-file controls follow each file's own
 * `can_download` / `can_delete` flags.
 *
 * On mount it also consumes any reproducer files handed over from the Submissions hero
 * (via PendingReproducersContext) and uploads them, showing skeleton rows.
 */
const SubmissionDetails = ({
  uuid,
  onDeleted,
  onSubmitted,
  activeTab,
  onTabChange,
}: SubmissionDetailsProps) => {
  const {
    submission,
    isLoading,
    isError,
    canAddReproducers,
    canDelete,
    canSubmit,
    canProcess,
    canDownload,
    mainFile,
    reproducerFiles,
    addFiles,
    deleteFile,
    deleteWholeSubmission,
    submit,
    process,
    download,
    downloadArchive,
    isAddingFiles,
    addingCount,
    isMutating,
    isSubmitting,
    isProcessing,
    isDownloadingArchive,
  } = useSubmissionDetail({ uuid, onDeleted, onSubmitted });

  const { takePending } = usePendingReproducers();
  const currentUsername = useCurrentUsername();
  const classes = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [localTab, setLocalTab] = useState<SubmissionDrawerTab>('reproducers');
  const currentTab = activeTab ?? localTab;
  const handleTabSelect = (tab: SubmissionDrawerTab) => {
    setLocalTab(tab);
    onTabChange?.(tab);
  };

  // Upload any reproducer files handed over from the hero when this drawer opens.
  // `takePending` consumes (clears) the files, so a repeated effect run is a no-op.
  // `addFiles`/`takePending` are stable enough and `takePending` self-clears, so
  // keying this to the uuid is intentional (a re-run would consume nothing).
  useEffect(() => {
    const pending = takePending(uuid);
    if (pending?.length) addFiles(pending);
  }, [uuid]);

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner aria-label='Loading submission' />
      </Bullseye>
    );
  }

  if (isError || !mainFile || !submission) {
    return <Alert variant='danger' isInline isPlain title='Could not load the submission' />;
  }

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (selected.length) addFiles(selected);
  };

  const confirmDeleteFile = (filename: string) =>
    setConfirm({
      title: 'Delete file?',
      body: `"${filename}" will be permanently removed from this submission.`,
      confirmLabel: 'Delete',
      confirmVariant: ButtonVariant.danger,
      action: () => deleteFile(filename),
    });

  const confirmDeleteAll = () =>
    setConfirm({
      title: 'Delete submission?',
      body: 'This permanently deletes the submission and all of its files. This cannot be undone.',
      confirmLabel: 'Delete all',
      confirmVariant: ButtonVariant.danger,
      action: deleteWholeSubmission,
    });

  const confirmSubmit = () =>
    setConfirm({
      title: 'Submit for structural validation?',
      body: 'After submitting you can no longer add or remove files for this submission.',
      confirmLabel: 'Submit',
      action: submit,
    });

  const confirmProcess = () =>
    setConfirm({
      title: 'Mark as processed?',
      body: 'This marks the submission as processed and records you as the processor.',
      confirmLabel: 'Mark as processed',
      action: process,
    });

  const renderReproducerRow = (file: ClearinghouseSubmissionFile) => {
    let uploadedLabel = 'Successfully uploaded';
    // Don't say "by me": only credit an uploader when it isn't the current user.
    if (file.username && file.username !== currentUsername) uploadedLabel += ` by ${file.username}`;
    if (file.created_at) uploadedLabel += ` at ${formatDateDDMMMYYYY(file.created_at)}`;

    return (
      <Flex
        alignItems={{ default: 'alignItemsCenter' }}
        gap={{ default: 'gapSm' }}
        flexWrap={{ default: 'nowrap' }}
      >
        {canAddReproducers ? (
          <FlexItem>
            <Icon status='success'>
              <CheckCircleIcon />
            </Icon>
          </FlexItem>
        ) : null}
        <FlexItem grow={{ default: 'grow' }}>
          <Stack>
            <StackItem>
              <Content component='p'>
                <code>{file.filename}</code>
              </Content>
            </StackItem>
            <StackItem>
              <Content component='small'>{uploadedLabel}</Content>
            </StackItem>
          </Stack>
        </FlexItem>
        {file.can_download ? (
          <FlexItem>
            <LwButton
              variant='plain'
              isCircle
              aria-label={`Download ${file.filename}`}
              onClick={() => download(file.filename)}
            >
              <DownloadIcon />
            </LwButton>
          </FlexItem>
        ) : null}
        {file.can_delete ? (
          <FlexItem>
            <LwButton
              variant='plain'
              isCircle
              aria-label={`Delete ${file.filename}`}
              isDisabled={isMutating}
              onClick={() => confirmDeleteFile(file.filename)}
            >
              <TrashIcon />
            </LwButton>
          </FlexItem>
        ) : null}
      </Flex>
    );
  };

  const showFooter = canDelete || canSubmit || canProcess || canDownload;
  const packageSummary = submission.package_summary;

  const reproducersSection = (
    <>
      {canAddReproducers ? (
        <StackItem>
          <input
            ref={fileInputRef}
            type='file'
            multiple
            hidden
            data-ouia-component-id='add-reproducer-file-input'
            onChange={handleFilesSelected}
          />
          <LwButton
            variant='link'
            isInline
            icon={<PlusCircleIcon />}
            isDisabled={isMutating}
            onClick={handleUploadClick}
            ouiaId='add-more-reproducers'
          >
            Add more reproducers
          </LwButton>
        </StackItem>
      ) : null}

      {reproducerFiles.length ? (
        reproducerFiles.map((file) => (
          <StackItem key={file.uuid}>{renderReproducerRow(file)}</StackItem>
        ))
      ) : isAddingFiles ? null : (
        <StackItem>
          <Content component='small' data-ouia-component-id='submission-details-empty'>
            No reproducer files have been added to this submission.
          </Content>
        </StackItem>
      )}

      {isAddingFiles
        ? Array.from({ length: Math.max(addingCount, 1) }).map((_, index) => (
            <StackItem key={`uploading-${index}`}>
              <Skeleton width='70%' screenreaderText='Uploading reproducer file' />
            </StackItem>
          ))
        : null}
    </>
  );

  return (
    <div className={classes.root} data-ouia-component-id='submission-details'>
      <div className={classes.list}>
        <Stack hasGutter>
          <StackItem>
            <Content component='small'>Filename</Content>
          </StackItem>
          <StackItem>
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              gap={{ default: 'gapSm' }}
              flexWrap={{ default: 'nowrap' }}
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
            >
              <FlexItem>
                <code>{mainFile.can_download ? mainFile.filename : submission.name}</code>
              </FlexItem>
              {mainFile.can_download ? (
                <FlexItem>
                  <LwButton
                    variant='plain'
                    isCircle
                    aria-label={`Download ${mainFile.filename}`}
                    onClick={() => download(mainFile.filename)}
                  >
                    <DownloadIcon />
                  </LwButton>
                </FlexItem>
              ) : null}
            </Flex>
          </StackItem>
          <StackItem>
            <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <Content component='small'>Status:</Content>
              </FlexItem>
              <FlexItem>
                <Label isCompact color={statusColor[submission.status]}>
                  {capitalize(submission.status)}
                </Label>
              </FlexItem>
              {packageSummary ? (
                <FlexItem>
                  <SubmissionPackageSummary summary={packageSummary} />
                </FlexItem>
              ) : null}
            </Flex>
          </StackItem>

          <StackItem>
            <Divider />
          </StackItem>

          {packageSummary ? (
            <StackItem>
              <Tabs
                activeKey={currentTab}
                onSelect={(_event, key) => handleTabSelect(key as SubmissionDrawerTab)}
                mountOnEnter
                aria-label='Submission details tabs'
                ouiaId='submission-details-tabs'
              >
                <Tab
                  eventKey='reproducers'
                  title={<TabTitleText>Reproducers ({reproducerFiles.length})</TabTitleText>}
                  ouiaId='submission-details-tab-reproducers'
                >
                  <Stack hasGutter className={classes.tabBody}>
                    {reproducersSection}
                  </Stack>
                </Tab>
                <Tab
                  eventKey='packages'
                  title={<TabTitleText>Packages ({packageSummary.total})</TabTitleText>}
                  ouiaId='submission-details-tab-packages'
                >
                  <div className={classes.packagesTabBody}>
                    {packageSummary.ecosystems.length ? (
                      <SubmissionEcosystemChart ecosystems={packageSummary.ecosystems} />
                    ) : null}
                    <SubmissionPackagesTable
                      uuid={uuid}
                      ecosystems={packageSummary.ecosystems.map(({ ecosystem }) => ecosystem)}
                    />
                  </div>
                </Tab>
              </Tabs>
            </StackItem>
          ) : (
            <>
              <StackItem>
                <Content component='h4'>Reproducers ({reproducerFiles.length})</Content>
              </StackItem>
              {reproducersSection}
            </>
          )}
        </Stack>
      </div>

      {showFooter ? (
        <div className={classes.footer}>
          <Flex
            justifyContent={{ default: 'justifyContentFlexEnd' }}
            alignItems={{ default: 'alignItemsCenter' }}
            spaceItems={{ default: 'spaceItemsSm' }}
          >
            {canDelete ? (
              <FlexItem>
                <LwButton
                  variant='danger'
                  isDisabled={isMutating}
                  onClick={confirmDeleteAll}
                  ouiaId='delete-all'
                >
                  Delete all
                </LwButton>
              </FlexItem>
            ) : null}
            {canSubmit ? (
              <FlexItem>
                <LwButton
                  variant='primary'
                  isLoading={isSubmitting}
                  isDisabled={isMutating}
                  onClick={confirmSubmit}
                  ouiaId='submit-for-validation'
                >
                  Submit
                </LwButton>
              </FlexItem>
            ) : null}
            {canDownload ? (
              <FlexItem>
                <LwButton
                  variant='secondary'
                  icon={isDownloadingArchive ? undefined : <DownloadIcon />}
                  isLoading={isDownloadingArchive}
                  isDisabled={isDownloadingArchive}
                  onClick={downloadArchive}
                  ouiaId='download-archive'
                >
                  Download all
                </LwButton>
              </FlexItem>
            ) : null}
            {canProcess ? (
              <FlexItem>
                <LwButton
                  variant='primary'
                  isLoading={isProcessing}
                  isDisabled={isMutating}
                  onClick={confirmProcess}
                  ouiaId='mark-processed'
                >
                  Mark as processed
                </LwButton>
              </FlexItem>
            ) : null}
          </Flex>
        </div>
      ) : null}

      {confirm ? (
        <WarningModal
          isOpen
          title={confirm.title}
          withCheckbox={false}
          confirmButtonLabel={confirm.confirmLabel}
          confirmButtonVariant={confirm.confirmVariant ?? ButtonVariant.primary}
          onConfirm={() => {
            confirm.action();
            setConfirm(null);
          }}
          onClose={() => setConfirm(null)}
          ouiaId='submission-details-confirm'
        >
          {confirm.body}
        </WarningModal>
      ) : null}
    </div>
  );
};

export default SubmissionDetails;
