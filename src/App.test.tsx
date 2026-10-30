import { render, screen } from '@testing-library/react';

import App from './App';

jest.mock('./LightwellApp', () => ({
  __esModule: true,
  default: jest.fn(() => <div>Lightwell</div>),
}));

it('renders the Lightwell app', () => {
  render(<App />);

  expect(screen.getByText('Lightwell')).toBeInTheDocument();
});
