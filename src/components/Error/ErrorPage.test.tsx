import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorPage } from './ErrorPage';

const errorText = 'Oh no!';
const WillError = () => {
  throw new Error(errorText);
};

const WontErrorText = 'Oh Yeah!';
const WontError = () => <h1>{WontErrorText}</h1>;

it('Catch any error in children and show it on the dom', () => {
  // See reference: https://til.hashrocket.com/posts/hrhejhqg2n-turn-off-console-error-messages-in-a-test
  const originalError = console.error;
  console.error = jest.fn();
  const { queryByText } = render(
    <div>
      <ErrorPage>
        <WillError />
      </ErrorPage>
    </div>,
    { wrapper: BrowserRouter },
  );

  expect(queryByText('There was a problem trying to process your request')).toBeInTheDocument();
  expect(queryByText(errorText)).not.toBeInTheDocument();
  console.error = originalError;
});

it('Render without an error page shown', () => {
  const { queryByText } = render(
    <div>
      <ErrorPage>
        <WontError />
      </ErrorPage>
    </div>,
    { wrapper: BrowserRouter },
  );

  expect(queryByText(WontErrorText)).toBeInTheDocument();
  expect(queryByText('There was a problem trying to process your request')).not.toBeInTheDocument();
});
