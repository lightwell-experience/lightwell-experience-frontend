import {
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  DrawerPanelDescription,
  Flex,
  FlexItem,
  Label,
  Title,
} from '@patternfly/react-core';
import type { PropsWithChildren } from 'react';

import type { AdvisoryDetails } from '../types';
import { pluralize } from '../utils/format';
import { SEVERITY_LABEL_COLORS, type AdvisorySeverity } from '../utils/severity';

const ADVISORY_DRAWER_TITLE_ID = 'lightwell-vulnerability-drawer-title';

type AdvisoryDetailsPanelProps = PropsWithChildren<{
  advisoryName: string;
  details?: AdvisoryDetails;
  isDetailsUnavailable: boolean;
  onClose: () => void;
}>;

const AdvisoryDetailsPanel = ({
  advisoryName,
  details,
  isDetailsUnavailable,
  onClose,
  children,
}: AdvisoryDetailsPanelProps) => {
  const displayDetails = isDetailsUnavailable ? undefined : details;
  const severity: AdvisorySeverity | undefined = displayDetails?.overview.severity;
  const counts = displayDetails?.counts ?? { packages: 0, upstreamVersions: 0, ecosystems: 0 };

  return (
    <DrawerPanelContent
      isResizable
      isGlass
      id='lightwell-vulnerability-details-panel'
      minSize='462px'
      maxSize='1422px'
      widths={{ default: 'width_50' }}
      resizeAriaLabel='Resize vulnerability details drawer'
      focusTrap={{
        enabled: true,
        elementToFocusOnExpand: `#${ADVISORY_DRAWER_TITLE_ID}`,
        'aria-labelledby': ADVISORY_DRAWER_TITLE_ID,
      }}
    >
      <DrawerHead>
        <Flex
          spaceItems={{ default: 'spaceItemsSm' }}
          alignItems={{ default: 'alignItemsCenter' }}
          flexWrap={{ default: 'wrap' }}
        >
          <FlexItem>
            <Title id={ADVISORY_DRAWER_TITLE_ID} tabIndex={-1} headingLevel='h2' size='lg'>
              {displayDetails?.advisoryName ?? advisoryName}
            </Title>
          </FlexItem>
          {severity ? (
            <FlexItem>
              <Label variant='outline' isCompact color={SEVERITY_LABEL_COLORS[severity]}>
                {severity}
              </Label>
            </FlexItem>
          ) : null}
        </Flex>
        <DrawerActions>
          <DrawerCloseButton onClose={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelDescription>
        Remediated across <strong>{counts.packages}</strong> {pluralize(counts.packages, 'package')}
        , <strong>{counts.upstreamVersions}</strong> upstream{' '}
        {pluralize(counts.upstreamVersions, 'version')}, in <strong>{counts.ecosystems}</strong>{' '}
        {pluralize(counts.ecosystems, 'ecosystem')}
      </DrawerPanelDescription>
      <DrawerPanelBody>{children}</DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default AdvisoryDetailsPanel;
