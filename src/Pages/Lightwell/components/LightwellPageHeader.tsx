import { Content, Flex, FlexItem, PageSection } from '@patternfly/react-core';
import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components';
import { ReactNode } from 'react';

type LightwellPageHeaderProps = {
  title: ReactNode;
  titleStart?: ReactNode;
  titleEnd?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  ouiaId?: string;
};

const LightwellPageHeader = ({
  title,
  titleStart,
  titleEnd,
  description,
  actions,
  ouiaId,
}: LightwellPageHeaderProps) => (
  <PageSection hasBodyWrapper={false}>
    {/* Main header row: page content stays together while actions fill the remaining space. */}
    <Flex
      alignItems={{ default: 'alignItemsStretch' }}
      fullWidth={{ default: 'fullWidth' }}
      gap={{ default: 'gapSm' }}
    >
      {/* Page content: keep the title row and its description in one vertical group. */}
      <FlexItem style={{ minWidth: 0 }}>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
          {/* Title row: the slots bracket the title without affecting the description below. */}
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            gap={{ default: 'gapSm' }}
            flexWrap={{ default: 'nowrap' }}
          >
            {/* Optional leading slot, such as an ecosystem icon. */}
            {titleStart ? <FlexItem flex={{ default: 'flexNone' }}>{titleStart}</FlexItem> : null}

            {/* Keep the trailing slot beside the title while allowing long titles to shrink. */}
            <FlexItem style={{ minWidth: 0 }}>
              {typeof title === 'string' ? <PageHeaderTitle title={title} /> : title}
            </FlexItem>

            {/* Optional trailing slot, such as a distribution URL or version selector. */}
            {titleEnd ? <FlexItem flex={{ default: 'flexNone' }}>{titleEnd}</FlexItem> : null}
          </Flex>

          {/* Optional supporting description directly beneath the title row. */}
          {description != null &&
            (typeof description === 'string' ? (
              <Content component='p' ouiaId={ouiaId}>
                {description}
              </Content>
            ) : (
              description
            ))}
        </Flex>
      </FlexItem>

      {/* Optional page-level actions fill the remaining area and align with the title row. */}
      {actions ? (
        <FlexItem grow={{ default: 'grow' }} style={{ minWidth: 0 }}>
          <Flex
            alignItems={{ default: 'alignItemsFlexStart' }}
            justifyContent={{ default: 'justifyContentFlexEnd' }}
            fullWidth={{ default: 'fullWidth' }}
            style={{ height: '100%' }}
          >
            {actions}
          </Flex>
        </FlexItem>
      ) : null}
    </Flex>
  </PageSection>
);

export default LightwellPageHeader;
