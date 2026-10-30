import { Content, Flex, FlexItem, Title } from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';

import { ECOSYSTEM_CHART_MIN_WIDTH } from '../charts/chartTheme';
import { getEcosystemBarChartHeight } from '../charts/ecosystemBarModel';
import type { CompletedCoverageReport } from 'services/Lightwell/CoverageReportsApi';
import { useContainerWidth } from '../../hooks/useContainerWidth';
import EcosystemBarChart from '../charts/EcosystemBarChart';

type EcosystemBreakdownBlockProps = {
  report: CompletedCoverageReport;
};

const EcosystemBreakdownBlock = ({ report }: EcosystemBreakdownBlockProps) => {
  const { containerRef, width: chartWidth } = useContainerWidth(ECOSYSTEM_CHART_MIN_WIDTH);

  const inCatalog = report.exact_matches + report.partial_matches;

  return (
    <>
      <Title headingLevel='h3' size='xl' className={spacing.pbSm}>
        Packages by ecosystem
      </Title>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
        <FlexItem>
          <Content component='p'>
            <strong>{inCatalog}</strong> of <strong>{report.total}</strong> packages found in the
            Lightwell Network catalog.
          </Content>
        </FlexItem>
        <FlexItem>
          <EcosystemBarChart
            report={report}
            containerRef={containerRef}
            width={chartWidth}
            height={getEcosystemBarChartHeight(report.ecosystem_coverage_summary.length)}
          />
        </FlexItem>
      </Flex>
    </>
  );
};

export default EcosystemBreakdownBlock;
