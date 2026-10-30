import { render } from '@testing-library/react';
import Hide from './Hide';

const text = 'Hello';
const children = <h1>{text}</h1>;

it('Render children when false', () => {
  const { queryByText } = render(
    <div>
      <Hide hide={false}>{children}</Hide>
    </div>,
  );

  expect(queryByText(text)).toHaveTextContent('Hello');
});

it('Render nothing when true', () => {
  const { queryByText } = render(
    <div>
      <Hide hide>{children}</Hide>
    </div>,
  );

  expect(queryByText(text)).not.toBeInTheDocument();
});
