import { Button } from '@patternfly/react-core';
import { render, screen } from '@testing-library/react';

import {
  PageChromeSlot,
  PageChromeSlotFooter,
  PageChromeSlots,
  PageTitleStack,
} from '../page-chrome-slots';
import { LwPageHeader } from './page-header';

const title = 'Repositories';
const description = 'Manage Lightwell repositories and notification preferences.';
const actionLabel = 'Notifications';
const actions = <Button>{actionLabel}</Button>;

it('renders the title without a Hero host', () => {
  const { container } = render(<LwPageHeader title={title} />);

  expect(container.querySelector('.pf-v6-c-hero')).toBeNull();
  expect(container.querySelector('.lw-c-page-header')).toBeTruthy();
  expect(container.querySelector('.lw-c-page-hero')).toBeNull();
  expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('renders title, description, and actions', () => {
  render(<LwPageHeader title={title} description={description} actions={actions} />);

  expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  expect(screen.getByRole('paragraph')).toHaveTextContent(description);
  expect(screen.getByRole('button', { name: actionLabel })).toBeInTheDocument();
});

it('merges call-site className onto the Flex root', () => {
  const { container } = render(<LwPageHeader title={title} className='lw-page-header-test' />);
  const root = container.querySelector('.lw-c-page-header');

  expect(root).toHaveClass('lw-page-header-test');
});

it('passthrough mode renders children and skips slots', () => {
  render(
    <LwPageHeader title={title} description={description} actions={actions}>
      <p>Custom chrome</p>
    </LwPageHeader>,
  );

  expect(screen.getByText('Custom chrome')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: title })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: actionLabel })).not.toBeInTheDocument();
});

it('renders ReactNode description without wrapping it in a paragraph', () => {
  render(
    <LwPageHeader
      title={title}
      description={
        <>
          <p>Intro copy</p>
          <div role='status'>Trailing note</div>
        </>
      }
    />,
  );

  expect(screen.getByText('Intro copy')).toBeInTheDocument();
  expect(screen.getByText('Trailing note')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Trailing note');
});

it('hero surface uses Hero host and both page-header classes', () => {
  const { container } = render(<LwPageHeader hero title={title} />);

  const root = container.querySelector('.pf-v6-c-hero');
  expect(root).toBeTruthy();
  expect(root).toHaveClass('lw-c-page-header');
  expect(root).toHaveClass('lw-c-page-hero');
  expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
});

it('hero passthrough composes PageChromeSlots children', () => {
  const { container } = render(
    <LwPageHeader hero bodyWidth='100%'>
      <PageChromeSlots>
        <PageChromeSlot>
          <PageTitleStack title={title} description={description} />
          <PageChromeSlotFooter>
            <p>Pipeline metrics</p>
          </PageChromeSlotFooter>
        </PageChromeSlot>
        <PageChromeSlot>
          <p>Status summary</p>
        </PageChromeSlot>
      </PageChromeSlots>
    </LwPageHeader>,
  );

  expect(container.querySelectorAll('.lw-c-page-header-chrome-slots')).toHaveLength(1);
  expect(container.querySelectorAll('.lw-c-page-header-chrome-slot')).toHaveLength(2);
  expect(container.querySelector('.lw-c-page-header-chrome-slot__footer')).toHaveTextContent(
    'Pipeline metrics',
  );
  expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  expect(screen.getByText('Status summary')).toBeInTheDocument();
  expect(screen.getByText('Pipeline metrics')).toBeInTheDocument();
});
