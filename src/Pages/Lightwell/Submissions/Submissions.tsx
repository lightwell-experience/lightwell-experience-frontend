import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRemoteHook } from '@scalprum/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import { Bullseye, CardBody, Content, PageSection, Spinner } from '@patternfly/react-core';
import HelpIcon from '@patternfly/react-icons/dist/esm/icons/help-icon';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';

import { useLightwellRootPath } from '../../../Hooks/Lightwell/navigation/useLightwellRootPath';
import {
  LwPageHeader,
  PageChromeSlot,
  PageChromeSlots,
  PageTitleStack,
} from 'kit/components/assemblies';
import { LwButton, LwCard, LwPopover } from 'kit/components/primitives';
import { useAppContext } from 'middleware/AppContext';
import { isFeatureOn } from 'services/Features/FeatureApi';
import { CLEARINGHOUSE_SUBMISSIONS_KEY } from 'services/Lightwell/ClearinghouseQueries';

import FileUploadCard from '../components/FileUploadCard';
import UploadSuccessStep from './components/UploadSuccessStep';
import SubmissionsTable from './components/SubmissionsTable';
import { PendingReproducersProvider } from './components/PendingReproducersContext';
import { useSubmissions } from './hooks/useSubmissions';

// Writers submit; read-only (TAM) users review what customers have submitted, so
// the hero copy is framed differently for each.
const SUBMISSIONS_DESCRIPTION_WRITE =
  'Submit vulnerability findings using the shared JSON / OpenAPI intake contract—without emailing files to your STAM.';
const SUBMISSIONS_DESCRIPTION_READ =
  'Review vulnerability findings submitted by customers through the shared JSON / OpenAPI intake contract.';

const DROP_LAST_CHROME_SEGMENT_OPTIONS = { dropLastChromeSegment: true };

const SubmissionsHelpPopover = () => (
  <LwPopover
    hasHeader='Vulnerability report intake'
    hasBody={
      <Content>
        <p>
          Upload a single findings report that follows the shared JSON / OpenAPI intake contract.
          The report is stored under its original filename.
        </p>
        <p>You can attach reproducer files to the submission after it is created.</p>
      </Content>
    }
    hasTrigger={
      <LwButton isCircle variant='plain' aria-label='Submissions help'>
        <HelpIcon />
      </LwButton>
    }
  />
);

/**
 * Clearinghouse submissions page, routed at `/submissions` for users with
 * `lightwellclearinghouse` or `lightwellclearinghouseread`. A Lens-style hero:
 * title + description on the left; on the right the JSON upload form (always
 * visible for writers) which swaps in place for the created submission's detail
 * after an upload. The submissions table sits below the hero in its own section.
 */
const Submissions = () => {
  const { step, file, fileError, createdUuid, onDropAccepted, reset } = useSubmissions();
  const queryClient = useQueryClient();
  const { features } = useAppContext();

  const rootPath = useLightwellRootPath();
  const appBreadcrumbsEnabled = useFlag('platform.chrome.app-breadcrumbs');
  const breadcrumbs = useMemo(
    () => [{ pathname: `${rootPath}/submissions`, title: 'Lightwell Submissions' }],
    [rootPath],
  );

  useRemoteHook({
    scope: 'chrome',
    module: './breadcrumbs/useReplaceBreadcrumbs',
    args: appBreadcrumbsEnabled ? [breadcrumbs, DROP_LAST_CHROME_SEGMENT_OPTIONS] : [[]],
  });

  // Uploading (creating a submission) requires the clearinghouse write feature.
  // Read-only users still see the submissions table and can process submitted ones.
  const canUpload = isFeatureOn(features?.lightwellclearinghouse);

  const showForm = canUpload && step === 'select';
  const showUploading = canUpload && step === 'uploading';
  const showDetail = canUpload && step === 'detail' && !!createdUuid;

  // The success step is done once the author submits for validation or moves on
  // to manage reproducers in the drawer: refetch the list so the submission shows
  // up in the table now, and reset back to the (always-visible) upload form.
  const handleCloseDetail = () => {
    queryClient.invalidateQueries({ queryKey: [CLEARINGHOUSE_SUBMISSIONS_KEY] });
    reset();
  };

  return (
    <PendingReproducersProvider>
      <LwPageHeader hero bodyWidth='100%' bodyMaxWidth='100%'>
        <PageChromeSlots>
          <PageChromeSlot>
            <PageTitleStack
              title='Submissions'
              description={canUpload ? SUBMISSIONS_DESCRIPTION_WRITE : SUBMISSIONS_DESCRIPTION_READ}
              ouiaId='lightwell-beacon-submissions-header'
            />
          </PageChromeSlot>

          <PageChromeSlot>
            {showDetail ? (
              <UploadSuccessStep
                uuid={createdUuid}
                onSubmitted={handleCloseDetail}
                onReproducersUploaded={handleCloseDetail}
              />
            ) : null}
            {showForm ? (
              <FileUploadCard
                title='Select vulnerability report to upload'
                action={<SubmissionsHelpPopover />}
                dropzoneTitle='Drag and drop findings JSON file'
                infoText='.json required · attach reproducers after selection'
                file={file}
                fileError={fileError}
                onDropAccepted={onDropAccepted}
                footer={
                  <Content
                    component='small'
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--pf-t--global--spacer--xs)',
                      marginTop: 'var(--pf-t--global--spacer--md)',
                    }}
                  >
                    <ExclamationTriangleIcon />
                    All submitted files are saved for up to 90 days.
                  </Content>
                }
              />
            ) : null}

            {showUploading ? (
              <Bullseye>
                <Spinner aria-label='Creating submission' />
              </Bullseye>
            ) : null}
          </PageChromeSlot>
        </PageChromeSlots>
      </LwPageHeader>

      <PageSection aria-label='Clearinghouse submissions' hasBodyWrapper={false}>
        <LwCard>
          <CardBody>
            <SubmissionsTable />
          </CardBody>
        </LwCard>
      </PageSection>
    </PendingReproducersProvider>
  );
};

export default Submissions;
