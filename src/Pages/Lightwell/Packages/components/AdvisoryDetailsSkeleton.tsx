import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Skeleton,
  Title,
} from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';

const AdvisoryDetailsSkeleton = ({ advisoryName }: { advisoryName?: string }) => (
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
            <Skeleton width='72px' height='24px' screenreaderText='Loading vulnerability details' />
            <Skeleton width='48px' height='24px' />
          </Flex>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Aliases</DescriptionListTerm>
        <DescriptionListDescription>
          <Skeleton width='60%' />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Released</DescriptionListTerm>
        <DescriptionListDescription>
          <Skeleton width='40%' />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Last updated</DescriptionListTerm>
        <DescriptionListDescription>
          <Skeleton width='40%' />
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
    <Title headingLevel='h3' size='lg' className={spacing.mbMd}>
      Summary
    </Title>
    <Skeleton width='100%' className={spacing.mbSm} />
    <Skeleton width='95%' className={spacing.mbSm} />
    <Skeleton width='72%' />
  </div>
);

export default AdvisoryDetailsSkeleton;
