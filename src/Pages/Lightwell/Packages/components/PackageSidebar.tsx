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
import type { NpmPackageDetailResponse } from 'services/Content/ContentApi';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useState } from 'react';
dayjs.extend(relativeTime);

type PackageSidebarProps = {
  lastUpdated: string;
  groupId?: string;
  scope?: string;
  tarball?: NpmPackageDetailResponse['tarball'];
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
  scope,
  tarball,
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
          {/* npm's analogue of Group ID, so it takes the same slot. */}
          {scope && scope !== '-' ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Scope</DescriptionListTerm>
              <DescriptionListDescription>{scope}</DescriptionListDescription>
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
          {tarball?.filename ? (
            <>
              <DescriptionListGroup>
                <DescriptionListTerm>Tarball</DescriptionListTerm>
                <DescriptionListDescription>{tarball.filename}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Size</DescriptionListTerm>
                <DescriptionListDescription>
                  {tarball.size.toLocaleString()} bytes
                </DescriptionListDescription>
              </DescriptionListGroup>
              {tarball.sha256 ? (
                <DescriptionListGroup>
                  <DescriptionListTerm>SHA-256</DescriptionListTerm>
                  <DescriptionListDescription style={{ overflowWrap: 'anywhere' }}>
                    {tarball.sha256}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ) : null}
            </>
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
