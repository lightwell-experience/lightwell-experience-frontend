import { Card, CardBody, Content, Flex, FlexItem, Title, Tooltip } from '@patternfly/react-core';
import text from '@patternfly/react-styles/css/utilities/Text/text';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import type { CSSProperties } from 'react';

import { MATCH_STATUS_COLORS, type MatchStatusColorKey } from '../charts/chartTheme';

export type MatchSummaryItem = {
  count: number;
  label: string;
  tooltip: string;
  color: MatchStatusColorKey;
};

type MatchSummaryStatsProps = {
  items: MatchSummaryItem[];
};

const getMatchLegendBarStyle = (color: MatchStatusColorKey): CSSProperties => ({
  display: 'block',
  width: '2.5rem',
  height: '0.25rem',
  borderRadius: 'var(--pf-t--global--border--radius--pill)',
  backgroundColor: MATCH_STATUS_COLORS[color],
});

const MatchSummaryStats = ({ items }: MatchSummaryStatsProps) => (
  <Card>
    <CardBody>
      <Flex gap={{ default: 'gapLg' }} justifyContent={{ default: 'justifyContentSpaceAround' }}>
        {items.map(({ count, label, tooltip, color }) => (
          <FlexItem key={label}>
            <Flex
              direction={{ default: 'column' }}
              alignItems={{ default: 'alignItemsCenter' }}
              gap={{ default: 'gapSm' }}
            >
              <FlexItem>
                <Flex
                  direction={{ default: 'column' }}
                  alignItems={{ default: 'alignItemsCenter' }}
                  gap={{ default: 'gapXs' }}
                >
                  <FlexItem>
                    <Title headingLevel='h4' size='3xl'>
                      {count}
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <span aria-hidden='true' style={getMatchLegendBarStyle(color)} />
                  </FlexItem>
                </Flex>
              </FlexItem>
              <FlexItem>
                <Content>
                  <Flex gap={{ default: 'gapXs' }}>
                    <FlexItem>{label}</FlexItem>
                    <FlexItem>
                      <Tooltip content={tooltip} position='bottom'>
                        <OutlinedQuestionCircleIcon className={text.textColorSubtle} />
                      </Tooltip>
                    </FlexItem>
                  </Flex>
                </Content>
              </FlexItem>
            </Flex>
          </FlexItem>
        ))}
      </Flex>
    </CardBody>
  </Card>
);

export default MatchSummaryStats;
