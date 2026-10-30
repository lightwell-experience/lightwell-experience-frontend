import { Button } from '@patternfly/react-core';

import { exportToCsv } from '../../utils/exportUtils';
import { buildRemediationCsvRows } from '../utils/advisories';
import type { AdvisoryRemediationEcosystem } from '../types';

type RemediationExportButtonProps = {
  advisoryName: string;
  remediations: AdvisoryRemediationEcosystem[];
};

const RemediationExportButton = ({ advisoryName, remediations }: RemediationExportButtonProps) => {
  const rows = buildRemediationCsvRows(remediations);

  return (
    <Button
      variant='primary'
      isDisabled={rows.length === 0}
      onClick={() =>
        exportToCsv(rows, `${advisoryName.replace(/[^a-zA-Z0-9.-]/g, '_')}-remediations.csv`)
      }
    >
      Export CSV
    </Button>
  );
};

export default RemediationExportButton;
