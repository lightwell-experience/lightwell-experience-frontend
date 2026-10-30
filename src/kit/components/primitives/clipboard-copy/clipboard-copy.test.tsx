import { render, screen } from '@testing-library/react';

import { LwClipboardCopy } from './clipboard-copy';

it('merges kit host class onto the PF ClipboardCopy root', () => {
  const { container } = render(
    <LwClipboardCopy ouiaId='lw-clipboard-copy-test'>1.2.3</LwClipboardCopy>,
  );

  const host = container.querySelector('.lw-c-clipboard-copy');
  expect(host).toBeTruthy();
  expect(host).toHaveClass('pf-v6-c-clipboard-copy');
  expect(host).toHaveClass('pf-m-inline');
  expect(screen.getByText('1.2.3')).toBeInTheDocument();
});
