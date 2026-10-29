import { Flex, FlexItem } from '@patternfly/react-core';

import { STATUSES } from '../constants';
import { StatusCard } from './StatusCard';

type PipelineViewProps = {
  statusCounts?: Record<string, number>;
  className?: string;
};

export function PipelineView({ statusCounts = {}, className }: PipelineViewProps) {
  const statusStats = STATUSES.map((status) => ({
    status,
    count: statusCounts[status] ?? 0,
  }));

  return (
    <div className={`lightwell-pipeline ${className ?? ''}`}>
      <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsStretch' }}>
        {statusStats.map((stat, idx) => (
          <FlexItem key={stat.status} flex={{ default: 'flex_1' }}>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapNone' }}>
              <FlexItem flex={{ default: 'flex_1' }}>
                <StatusCard status={stat.status} count={stat.count} />
              </FlexItem>
              {idx < statusStats.length - 1 && (
                <FlexItem className='lightwell-pipeline-arrow'>&#9654;</FlexItem>
              )}
            </Flex>
          </FlexItem>
        ))}
      </Flex>
    </div>
  );
}
