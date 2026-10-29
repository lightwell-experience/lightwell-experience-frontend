import { Content, Flex, FlexItem, Icon, Title } from '@patternfly/react-core';
import { RhUiSecuredIcon } from '@patternfly/react-icons';

import FixBySeverityStat from './FixBySeverityStat';
import FixesCard from './FixesCard';
import type { AdvisorySeverityCounts } from '../hooks/useLatestReleaseFixes';
import { pluralize } from '../utils/format';
import type { AdvisorySeverity } from '../utils/severity';

const DISPLAYED_SEVERITIES: AdvisorySeverity[] = ['Critical', 'Important', 'Moderate', 'Low'];

type LatestReleaseFixesProps = {
  total: number;
  counts: AdvisorySeverityCounts;
};

const LatestReleaseFixes = ({ total, counts }: LatestReleaseFixesProps) => {
  const fixesTotal = total - counts.None;

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      <FlexItem>
        <Flex
          alignItems={{ default: 'alignItemsCenter' }}
          gap={{ default: 'gapSm' }}
          height='fit-content'
        >
          {fixesTotal > 0 ? (
            <Icon size='xl' status='success'>
              <RhUiSecuredIcon />
            </Icon>
          ) : null}
          <Title headingLevel='h3' size='lg'>
            {fixesTotal > 0
              ? `${fixesTotal} new backported ${pluralize(fixesTotal, 'fix', 'fixes')} in this release`
              : 'No new backported fixes in this release'}
          </Title>
        </Flex>
      </FlexItem>
      {fixesTotal !== 0 ? (
        <FixesCard>
          {DISPLAYED_SEVERITIES.map((severity) => (
            <FixBySeverityStat key={severity} severity={severity} counts={counts} />
          ))}
        </FixesCard>
      ) : null}
      {fixesTotal === 0 ? (
        <FlexItem>
          <Content component='p'>
            Released to support a dependency update with no new fixes included.
          </Content>
        </FlexItem>
      ) : null}
    </Flex>
  );
};

export default LatestReleaseFixes;
