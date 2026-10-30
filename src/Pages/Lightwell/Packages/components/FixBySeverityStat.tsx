import { Content, Flex, Icon, Title } from '@patternfly/react-core';
import {
  t_global_icon_color_severity_critical_default,
  t_global_icon_color_severity_important_default,
  t_global_icon_color_severity_minor_default,
  t_global_icon_color_severity_moderate_default,
  t_global_icon_color_severity_none_default,
} from '@patternfly/react-tokens';
import RhUiSeverityCriticalFillIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-severity-critical-fill-icon';
import RhUiSeverityImportantFillIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-severity-important-fill-icon';
import RhUiSeverityMinorFillIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-severity-minor-fill-icon';
import RhUiSeverityModerateFillIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-severity-moderate-fill-icon';
import RhUiSeverityNoneFillIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-severity-none-fill-icon';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import type { ReactNode } from 'react';

import type { AdvisorySeverityCounts } from '../hooks/useLatestReleaseFixes';
import type { AdvisorySeverity } from '../utils/severity';

const SEVERITY_ICONS: Record<AdvisorySeverity, ReactNode> = {
  Critical: (
    <RhUiSeverityCriticalFillIcon
      style={{ color: t_global_icon_color_severity_critical_default.var }}
    />
  ),
  Important: (
    <RhUiSeverityImportantFillIcon
      style={{ color: t_global_icon_color_severity_important_default.var }}
    />
  ),
  Moderate: (
    <RhUiSeverityModerateFillIcon
      style={{ color: t_global_icon_color_severity_moderate_default.var }}
    />
  ),
  Low: (
    <RhUiSeverityMinorFillIcon style={{ color: t_global_icon_color_severity_minor_default.var }} />
  ),
  None: (
    <RhUiSeverityNoneFillIcon style={{ color: t_global_icon_color_severity_none_default.var }} />
  ),
};

type FixBySeverityStatProps = {
  severity: AdvisorySeverity;
  counts: AdvisorySeverityCounts;
};

const FixBySeverityStat = ({ severity, counts }: FixBySeverityStatProps) => (
  <Flex
    direction={{ default: 'column' }}
    gap={{ default: 'gapXs' }}
    alignItems={{ default: 'alignItemsCenter' }}
    justifyContent={{ default: 'justifyContentCenter' }}
  >
    <Title headingLevel='h4' size='3xl' className={spacing.pxXl}>
      {counts[severity]}
    </Title>
    <Flex
      alignItems={{ default: 'alignItemsCenter' }}
      justifyContent={{ default: 'justifyContentCenter' }}
      gap={{ default: 'gapSm' }}
    >
      <Icon size='sm'>{SEVERITY_ICONS[severity]}</Icon>
      <Content>{severity}</Content>
    </Flex>
  </Flex>
);

export default FixBySeverityStat;
