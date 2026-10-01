import { render, screen, waitFor } from '@testing-library/react';

import Test from './Test';
import { getPing } from 'services/Ping/PingApi';
import { ReactQueryTestWrapper } from 'testingHelpers';

jest.mock('services/Ping/PingApi', () => ({
  getPing: jest.fn(),
}));

const renderTest = () => {
  render(
    <ReactQueryTestWrapper>
      <Test />
    </ReactQueryTestWrapper>,
  );
};

describe('Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title and ping response', async () => {
    (getPing as jest.Mock).mockResolvedValue('lightwell-experience ok');

    renderTest();

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('lightwell-experience ok')).toBeInTheDocument();
    });
  });
});
