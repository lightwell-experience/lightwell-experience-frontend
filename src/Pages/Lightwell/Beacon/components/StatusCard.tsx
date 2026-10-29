import { Card, CardBody, CardHeader, CardTitle, Tooltip } from '@patternfly/react-core';

import { STATUS_DESCRIPTIONS } from '../constants';
import type { Status } from '../types';

type StatusCardProps = {
  status: Status;
  count: number;
  className?: string;
};

export function StatusCard({ status, count }: StatusCardProps) {
  return (
    <Tooltip content={STATUS_DESCRIPTIONS[status]}>
      <Card className='lightwell-status-card'>
        <CardHeader>
          <CardTitle className='lightwell-status-card-label'>{status}</CardTitle>
        </CardHeader>
        <CardBody>
          <span className='lightwell-status-card-number'>{count}</span>
        </CardBody>
      </Card>
    </Tooltip>
  );
}
