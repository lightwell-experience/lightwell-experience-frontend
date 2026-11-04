import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import SubmissionDrawer from './SubmissionDrawer';

jest.mock('./SubmissionDetails', () => ({
  __esModule: true,
  default: ({ uuid }: { uuid: string }) => <div>Detail for {uuid}</div>,
}));

const renderDrawer = (route = '/') =>
  render(
    <SubmissionDrawer>
      <div>table content</div>
    </SubmissionDrawer>,
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      ),
    },
  );

it('always renders its children (the table)', () => {
  renderDrawer();

  expect(screen.getByText('table content')).toBeInTheDocument();
});

it('does not render the submission detail when no submission param is set', () => {
  renderDrawer();

  expect(screen.queryByText(/Detail for/)).not.toBeInTheDocument();
});

it('renders the static title and the detail for the submission in the URL param', () => {
  renderDrawer('/?submission=sub-1');

  expect(screen.getByRole('heading', { name: 'Submission details' })).toBeInTheDocument();
  expect(screen.getByText('Detail for sub-1')).toBeInTheDocument();
});

it('closes the drawer (clears the detail) when the close button is clicked', async () => {
  const user = userEvent.setup();
  renderDrawer('/?submission=sub-1');

  expect(screen.getByText('Detail for sub-1')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /close/i }));

  expect(screen.queryByText('Detail for sub-1')).not.toBeInTheDocument();
});
