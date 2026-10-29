import { CardBody, Flex } from '@patternfly/react-core';
import type { CSSProperties } from 'react';

import { LwMetricsCount } from 'kit/components/assemblies';
import { LwCard } from 'kit/components/primitives';
import type { CompletedCoverageReport } from 'services/Lightwell/CoverageReportsApi';
import { CVE_SEVERITIES, renderCveSeverityIcon } from '../utils/cveSeverity';

type CveFixesBlockProps = {
  report: CompletedCoverageReport;
};

const CveFixesBlock = ({ report }: CveFixesBlockProps) => (
  <LwCard ouiaId='lightwell-cve-fixes-card'>
    <CardBody>
      <Flex gap={{ default: 'gapLg' }} justifyContent={{ default: 'justifyContentSpaceAround' }}>
        {CVE_SEVERITIES.map((meta) => (
          <LwMetricsCount
            key={meta.key}
            value={report.cve_summary[meta.key]}
            label={
              <>
                {renderCveSeverityIcon(meta)}
                {meta.label}
              </>
            }
            style={{ '--lw-metrics-count-bar-color': meta.color } as CSSProperties}
          />
        ))}
      </Flex>
    </CardBody>
  </LwCard>
);

export default CveFixesBlock;
