import { render, screen } from '@testing-library/react';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';

import { LwLabel } from './label';

const getHost = (text: string) => screen.getByText(text).closest('.pf-v6-c-label');

it('renders the PF Label host with the kit class and PF defaults', () => {
  render(<LwLabel>Default</LwLabel>);

  const host = getHost('Default');
  expect(host).toHaveClass('lw-c-label');
  expect(host).not.toHaveClass('pf-m-compact');
  expect(host).not.toHaveClass('pf-m-outline');
});

it('passes PF variants through to the host', () => {
  render(
    <LwLabel color='purple' variant='outline' isCompact icon={<InfoCircleIcon />}>
      Configured
    </LwLabel>,
  );

  const host = getHost('Configured');
  expect(host).toHaveClass('pf-m-purple');
  expect(host).toHaveClass('pf-m-outline');
  expect(host).toHaveClass('pf-m-compact');
  expect(host?.querySelector('.pf-v6-c-label__icon svg')).toBeInTheDocument();
});

it('merges call-site className onto the host root', () => {
  render(<LwLabel className='call-site'>Merged</LwLabel>);

  const host = getHost('Merged');
  expect(host).toHaveClass('lw-c-label');
  expect(host).toHaveClass('call-site');
});
