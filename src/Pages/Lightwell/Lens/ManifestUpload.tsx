import { useMemo } from 'react';
import { useRemoteHook } from '@scalprum/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import {
  CardBody,
  Content,
  HelperText,
  HelperTextItem,
  MultipleFileUpload,
  MultipleFileUploadMain,
} from '@patternfly/react-core';
import { UploadIcon } from '@patternfly/react-icons';
import {
  LwPageHeader,
  PageChromeSlot,
  PageChromeSlots,
  PageTitleStack,
} from 'kit/components/assemblies';
import { LwCard } from 'kit/components/primitives';
import { useManifestUpload } from './hooks/useManifestUpload';
import AnalysisProgress from './components/AnalysisProgress';
import ManifestFormatPopover from './components/ManifestFormatPopover';
import { useLightwellRootPath } from '../../../Hooks/Lightwell/navigation/useLightwellRootPath';

const DROP_LAST_CHROME_SEGMENT_OPTIONS = { dropLastChromeSegment: true };

const ManifestUpload = () => {
  const { uploadProps } = useManifestUpload();
  const { step, reportUUID, file, fileError, processError, onDropAccepted, onRetry } = uploadProps;
  const showProgress = step === 'uploading' || step === 'analyzing' || !!processError;

  const rootPath = useLightwellRootPath();
  const appBreadcrumbsEnabled = useFlag('platform.chrome.app-breadcrumbs');
  const breadcrumbs = useMemo(
    () => [{ pathname: `${rootPath}/lens`, title: 'Lightwell Lens' }],
    [rootPath],
  );

  useRemoteHook({
    scope: 'chrome',
    module: './breadcrumbs/useReplaceBreadcrumbs',
    args: appBreadcrumbsEnabled ? [breadcrumbs, DROP_LAST_CHROME_SEGMENT_OPTIONS] : [[]],
  });

  return (
    <LwPageHeader hero>
      <PageChromeSlots>
        <PageChromeSlot>
          <PageTitleStack
            title='Lens'
            description='Get an analysis of your stack against the Lightwell Network catalog to immediately surface missing components, alternative options, and compatibility insights.'
            ouiaId='lightwell-coverage-header'
          />
        </PageChromeSlot>
        <PageChromeSlot>
          {showProgress ? (
            <LwCard isGlass={false}>
              <CardBody>
                <AnalysisProgress
                  step={step}
                  reportUUID={reportUUID}
                  processError={processError}
                  onRetry={onRetry}
                />
              </CardBody>
            </LwCard>
          ) : (
            <LwCard
              isGlass={false}
              hasHeader='Upload SBOM or package manifest'
              hasAction={<ManifestFormatPopover />}
            >
              <MultipleFileUpload
                isHorizontal
                dropzoneProps={{ multiple: false, maxFiles: 1, onDropAccepted }}
              >
                <MultipleFileUploadMain
                  titleIcon={<UploadIcon />}
                  titleText='Drag and drop a file here'
                  titleTextSeparator='or'
                  browseButtonText='Select file'
                />
              </MultipleFileUpload>
              {fileError ? (
                <HelperText>
                  <HelperTextItem variant='error'>
                    {file?.name ? `${file.name}: ${fileError}` : fileError}
                  </HelperTextItem>
                </HelperText>
              ) : null}
            </LwCard>
          )}
        </PageChromeSlot>
      </PageChromeSlots>
      <PageChromeSlots>
        <PageChromeSlot>
          <Content>
            Supported formats: CSV, CycloneDX, SPDX, POM, requirements.txt
            <br />
            File size limit: Up to 10MB for POM files. Up to 15MB for all other supported formats.
          </Content>
        </PageChromeSlot>
      </PageChromeSlots>
    </LwPageHeader>
  );
};

export default ManifestUpload;
