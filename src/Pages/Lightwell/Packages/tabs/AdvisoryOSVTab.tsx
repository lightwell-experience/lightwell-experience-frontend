import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Title,
} from '@patternfly/react-core';
import { LinkIcon } from '@patternfly/react-icons';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import text from '@patternfly/react-styles/css/utilities/Text/text';
import { useState } from 'react';

import type { AdvisoryDetails } from '../types';
import { copyAdvisoryApiUrl } from '../utils/advisories';

type AdvisoryOSVTabProps = {
  advisoryName: string;
  osv: AdvisoryDetails['osv'];
};

const AdvisoryOSVTab = ({ advisoryName, osv }: AdvisoryOSVTabProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyApiUrl = async () => {
    await copyAdvisoryApiUrl(advisoryName);
    setCopied(true);
  };

  return (
    <div className={spacing.ptLg}>
      <Title headingLevel='h3' size='lg' className={spacing.mbMd}>
        File metadata
      </Title>
      <DescriptionList isHorizontal isCompact className={spacing.mbLg}>
        <DescriptionListGroup>
          <DescriptionListTerm>Schema version</DescriptionListTerm>
          <DescriptionListDescription>{osv.schemaVersion || '—'}</DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>Source</DescriptionListTerm>
          <DescriptionListDescription>{osv.source || '—'}</DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>Published</DescriptionListTerm>
          <DescriptionListDescription>{osv.published}</DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>Last updated</DescriptionListTerm>
          <DescriptionListDescription>{osv.lastUpdated}</DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>Record ID</DescriptionListTerm>
          <DescriptionListDescription className={text.textBreakWord}>
            {osv.recordId}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
      <Button variant='primary' icon={<LinkIcon />} onClick={handleCopyApiUrl}>
        {copied ? 'Copied API URL' : 'Copy API URL'}
      </Button>
    </div>
  );
};

export default AdvisoryOSVTab;
