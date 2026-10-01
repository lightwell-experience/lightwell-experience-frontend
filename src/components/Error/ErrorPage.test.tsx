import { render, screen } from '@testing-library/react';

import { ErrorPage } from './ErrorPage';

const errorText = 'error';
const ThrowsError = () => {
  throw new Error(errorText);
};

const successText = 'success';
const RendersSuccess = () => <p>{successText}</p>;

it('catch any error in children and show it on the dom', () => {
  const originalError = console.error;
  console.error = jest.fn();

  render(
    <ErrorPage>
      <ThrowsError />
    </ErrorPage>,
  );

  expect(
    screen.getByText('There was a problem trying to process your request'),
  ).toBeInTheDocument();
  expect(screen.queryByText(errorText)).not.toBeInTheDocument();
  console.error = originalError;
});

it('renders children when there is no error', () => {
  render(
    <ErrorPage>
      <RendersSuccess />
    </ErrorPage>,
  );

  expect(screen.getByText(successText)).toBeInTheDocument();
  expect(
    screen.queryByText('There was a problem trying to process your request'),
  ).not.toBeInTheDocument();
});
