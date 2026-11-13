import { fireEvent, render, screen } from '@testing-library/react';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';

import { LwLabel, type LwLabelStatus } from './label';

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

it.each<[LwLabelStatus, string[], string[], boolean]>([
  ['techPreview', ['pf-m-purple'], ['pf-m-outline'], true],
  ['validated', ['pf-m-purple', 'pf-m-outline'], [], false],
  ['remediated', ['pf-m-orange', 'pf-m-outline'], [], false],
  ['predisclosure', ['pf-m-orange'], ['pf-m-outline'], false],
])('maps status "%s" to its presentation', (status, has, hasNot, hasIcon) => {
  render(<LwLabel status={status}>Status</LwLabel>);

  const host = getHost('Status');
  has.forEach((cls) => expect(host).toHaveClass(cls));
  hasNot.forEach((cls) => expect(host).not.toHaveClass(cls));
  expect(!!host?.querySelector('.pf-v6-c-label__icon')).toBe(hasIcon);
});

it('lets call-site PF props win over the status map', () => {
  render(
    <LwLabel status='techPreview' isCompact variant='outline'>
      Override
    </LwLabel>,
  );

  const host = getHost('Override');
  expect(host).toHaveClass('pf-m-purple', 'pf-m-outline', 'pf-m-compact');
});

it('renders a plain (non-interactive) label without a popover', () => {
  render(<LwLabel status='techPreview'>Static</LwLabel>);

  expect(screen.queryByRole('button', { name: 'Static' })).not.toBeInTheDocument();
});

it('becomes a button that opens its popover when popover content is provided', async () => {
  render(
    <LwLabel status='techPreview' popover={{ hasHeader: 'Popover title', hasBody: 'Popover body' }}>
      Trigger
    </LwLabel>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Trigger' }));

  expect(await screen.findByText('Popover title')).toBeInTheDocument();
  expect(screen.getByText('Popover body')).toBeInTheDocument();
});
