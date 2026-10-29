import {
  Card,
  CardBody,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  ExpandableSection,
  Timestamp,
} from '@patternfly/react-core';
import UrlWithExternalIcon from 'components/UrlWithLinkIcon/UrlWithLinkIcon';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useState } from 'react';
dayjs.extend(relativeTime);

type PackageSidebarProps = {
  lastUpdated: string;
  groupId?: string;
  upstreamVersion: string;
  allVersions?: string[];
  license?: string;
  author?: string;
  projectUrl?: string;
  hasRelease: boolean;
};

const PackageSidebar = ({
  lastUpdated,
  groupId,
  upstreamVersion,
  allVersions,
  license,
  author,
  projectUrl,
  hasRelease,
}: PackageSidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const onToggle = (_event, expanded: boolean) => {
    setIsExpanded(expanded);
  };

  return (
    <Card isPlain>
      <CardBody>
        <DescriptionList>
          {lastUpdated ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Last updated</DescriptionListTerm>
              <DescriptionListDescription>
                <Timestamp
                  date={new Date(lastUpdated)}
                  dateFormat='medium'
                  timeFormat='short'
                  tooltip={{ variant: 'default' }}
                  style={{ fontSize: 'inherit', textDecoration: 'none' }}
                >
                  {dayjs(lastUpdated).fromNow()}
                </Timestamp>
              </DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
          {license ? (
            <DescriptionListGroup>
              <DescriptionListTerm>License</DescriptionListTerm>
              <DescriptionListDescription>
                <ExpandableSection
                  variant='truncate'
                  toggleText={isExpanded ? 'hide' : 'show more'}
                  onToggle={onToggle}
                  isExpanded={isExpanded}
                >
                  {license}
                </ExpandableSection>
              </DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
          {groupId ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Group ID</DescriptionListTerm>
              <DescriptionListDescription>{groupId}</DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
          {author ? (
            <DescriptionListGroup>
              <DescriptionListTerm>{hasRelease ? 'Original author' : 'Author'}</DescriptionListTerm>
              <DescriptionListDescription>{author}</DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
          {hasRelease ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Rebuilt by</DescriptionListTerm>
              <DescriptionListDescription>Red Hat</DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
          {allVersions && allVersions.length > 1 ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Upstream versions</DescriptionListTerm>
              <DescriptionListDescription>{allVersions.join(', ')}</DescriptionListDescription>
            </DescriptionListGroup>
          ) : upstreamVersion ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Upstream version</DescriptionListTerm>
              <DescriptionListDescription>{upstreamVersion}</DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
          {projectUrl ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Project</DescriptionListTerm>
              <DescriptionListDescription>
                <UrlWithExternalIcon href={projectUrl} customText='Source' />
              </DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

export default PackageSidebar;
