import { Flex, FlexItem, Title } from '@patternfly/react-core';

type PackageVersionTitleProps = {
  name: string;
  version: string;
  descriptor: string;
};

const PackageVersionTitle = ({ name, version, descriptor }: PackageVersionTitleProps) => (
  <Title headingLevel='h2' size='xl'>
    <Flex gap={{ default: 'gapSm' }}>
      <FlexItem>
        {descriptor} for: {name}
      </FlexItem>
      <code className='pf-v6-u-font-family-monospace pf-v6-u-font-size-lg'>{version}</code>
    </Flex>
  </Title>
);

export default PackageVersionTitle;
