import {
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Label,
  Title,
} from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { useState } from 'react';

import type { AdvisoryDetails } from '../types';
import { SEVERITY_LABEL_COLORS } from '../utils/severity';

type AdvisoryOverviewTabProps = {
  advisoryName: string;
  overview: AdvisoryDetails['overview'];
};

const DETAILS_PREVIEW_LENGTH = 260;

const AdvisoryOverviewTab = ({ advisoryName, overview }: AdvisoryOverviewTabProps) => {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const hasLongDetails = overview.details.length > DETAILS_PREVIEW_LENGTH;

  return (
    <div className={spacing.ptLg}>
      <Title headingLevel='h3' size='lg' className={spacing.mbMd}>
        Details
      </Title>
      <DescriptionList isHorizontal isCompact className={spacing.mbLg}>
        <DescriptionListGroup>
          <DescriptionListTerm>Vulnerability ID</DescriptionListTerm>
          <DescriptionListDescription>{advisoryName}</DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>Severity</DescriptionListTerm>
          <DescriptionListDescription>
            <Flex gap={{ default: 'gapSm' }}>
              <Label variant='outline' color={SEVERITY_LABEL_COLORS[overview.severity]}>
                {overview.severity}
              </Label>
              <Label variant='outline' color={SEVERITY_LABEL_COLORS[overview.severity]}>
                {overview.cvssScore}
              </Label>
            </Flex>
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>Aliases</DescriptionListTerm>
          <DescriptionListDescription>
            {overview.aliases.join(', ') || '—'}
          </DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>Released</DescriptionListTerm>
          <DescriptionListDescription>{overview.released}</DescriptionListDescription>
        </DescriptionListGroup>

        <DescriptionListGroup>
          <DescriptionListTerm>Last updated</DescriptionListTerm>
          <DescriptionListDescription>{overview.lastUpdated}</DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>

      <Title headingLevel='h3' size='lg' className={spacing.mbMd}>
        Summary
      </Title>
      <Content component='p' className={spacing.mbMd}>
        {overview.summary || '—'}
      </Content>
      {overview.details && (
        <>
          <Content component='p'>
            {hasLongDetails && !showFullDetails
              ? `${overview.details.slice(0, DETAILS_PREVIEW_LENGTH).trimEnd()}…`
              : overview.details}
          </Content>
          {hasLongDetails && (
            <Button variant='link' isInline onClick={() => setShowFullDetails((open) => !open)}>
              {showFullDetails ? 'Show less' : 'Show more'}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default AdvisoryOverviewTab;
