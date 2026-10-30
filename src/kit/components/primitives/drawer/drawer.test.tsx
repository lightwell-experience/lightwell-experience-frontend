import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LwDrawer } from './drawer';

// ─── Core rendering ──────────────────────────────────────────────────────────

it('renders main content in DrawerContentBody', () => {
  render(
    <LwDrawer isExpanded panelContent={<div>Panel</div>}>
      <div>Main content</div>
    </LwDrawer>,
  );

  expect(screen.getByText('Main content')).toBeInTheDocument();
});

it('renders panel content in DrawerPanelBody', () => {
  render(
    <LwDrawer isExpanded panelContent={<div>Filter form</div>}>
      <div>Table</div>
    </LwDrawer>,
  );

  expect(screen.getByText('Filter form')).toBeInTheDocument();
});

it('renders DrawerHead with panelHead content', () => {
  render(
    <LwDrawer isExpanded panelContent={<div>Body</div>} panelHead={<span>Filters</span>}>
      <div>Main</div>
    </LwDrawer>,
  );

  expect(screen.getByText('Filters')).toBeInTheDocument();
});

it('renders DrawerCloseButton when onPanelClose is provided', () => {
  render(
    <LwDrawer isExpanded panelContent={<div>Body</div>} onPanelClose={() => {}}>
      <div>Main</div>
    </LwDrawer>,
  );

  expect(screen.getByRole('button', { name: 'Close drawer panel' })).toBeInTheDocument();
});

it('calls onPanelClose when close button is clicked', async () => {
  const user = userEvent.setup();
  const handleClose = jest.fn();

  render(
    <LwDrawer isExpanded panelContent={<div>Body</div>} onPanelClose={handleClose}>
      <div>Main</div>
    </LwDrawer>,
  );

  await user.click(screen.getByRole('button', { name: 'Close drawer panel' }));
  expect(handleClose).toHaveBeenCalledTimes(1);
});

it('uses custom panelCloseAriaLabel', () => {
  render(
    <LwDrawer
      isExpanded
      panelContent={<div>Body</div>}
      onPanelClose={() => {}}
      panelCloseAriaLabel='Close filters'
    >
      <div>Main</div>
    </LwDrawer>,
  );

  expect(screen.getByRole('button', { name: 'Close filters' })).toBeInTheDocument();
});

it('does not render DrawerHead when neither panelHead nor onPanelClose is set', () => {
  const { container } = render(
    <LwDrawer isExpanded panelContent={<div>Body</div>}>
      <div>Main</div>
    </LwDrawer>,
  );

  expect(container.querySelector('.pf-v6-c-drawer__head')).not.toBeInTheDocument();
});

// ─── Class & passthrough ─────────────────────────────────────────────────────

it('renders lw-c-drawer class on the Drawer root', () => {
  const { container } = render(
    <LwDrawer isExpanded panelContent={<div>Body</div>}>
      <div>Main</div>
    </LwDrawer>,
  );

  expect(container.querySelector('.lw-c-drawer')).toBeInTheDocument();
});

it('merges call-site className', () => {
  const { container } = render(
    <LwDrawer isExpanded panelContent={<div>Body</div>} className='custom-drawer'>
      <div>Main</div>
    </LwDrawer>,
  );

  const drawer = container.querySelector('.lw-c-drawer');
  expect(drawer).toHaveClass('custom-drawer');
});

it('forwards PF Drawer props (isInline, position)', () => {
  const { container } = render(
    <LwDrawer isExpanded isInline position='start' panelContent={<div>Panel</div>}>
      <div>Main</div>
    </LwDrawer>,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer');
  expect(drawer).toHaveClass('pf-m-inline');
  expect(drawer).toHaveClass('pf-m-panel-left');
});

it('renders collapsed when isExpanded is false', () => {
  const { container } = render(
    <LwDrawer isExpanded={false} panelContent={<div>Panel</div>}>
      <div>Main</div>
    </LwDrawer>,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer');
  expect(drawer).not.toHaveClass('pf-m-expanded');
});

it('renders expanded when isExpanded is true', () => {
  const { container } = render(
    <LwDrawer isExpanded panelContent={<div>Panel</div>}>
      <div>Main</div>
    </LwDrawer>,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer');
  expect(drawer).toHaveClass('pf-m-expanded');
});

// ─── Config defaults ─────────────────────────────────────────────────────────

it('applies isPill config default (pf-m-pill class)', () => {
  const { container } = render(
    <LwDrawer isExpanded panelContent={<div>Body</div>}>
      <div>Main</div>
    </LwDrawer>,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer');
  expect(drawer).toHaveClass('pf-m-pill');
});

it('applies isResizable default on DrawerPanelContent', () => {
  const { container } = render(
    <LwDrawer isExpanded panelContent={<div>Body</div>}>
      <div>Main</div>
    </LwDrawer>,
  );

  expect(container.querySelector('.pf-v6-c-drawer__splitter')).toBeInTheDocument();
});

it('allows call-site panelProps to disable isResizable', () => {
  const { container } = render(
    <LwDrawer isExpanded panelContent={<div>Body</div>} panelProps={{ isResizable: false }}>
      <div>Main</div>
    </LwDrawer>,
  );

  expect(container.querySelector('.pf-v6-c-drawer__splitter')).not.toBeInTheDocument();
});

// ─── Responsive behavior ─────────────────────────────────────────────────────
// JSDOM has no matchMedia → useLwBreakpoint returns 'lg' (desktop fallback).
// Default inline breakpoint is '2xl', so at lg the drawer is overlay, not inline.

it('responsive: overlay (not inline) at lg viewport with default config', () => {
  const { container } = render(
    <LwDrawer isExpanded responsive={{}} panelContent={<div>Panel</div>}>
      <div>Main</div>
    </LwDrawer>,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer');
  expect(drawer).not.toHaveClass('pf-m-inline');
  expect(drawer).toHaveClass('pf-m-expanded');
});

it('responsive: inline when inline breakpoint is explicitly set to lg', () => {
  const { container } = render(
    <LwDrawer isExpanded responsive={{ inline: 'lg' }} panelContent={<div>Panel</div>}>
      <div>Main</div>
    </LwDrawer>,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer');
  expect(drawer).toHaveClass('pf-m-inline');
  expect(drawer).toHaveClass('pf-m-expanded');
});

it('responsive: overrides call-site isInline when responsive is active', () => {
  const { container } = render(
    <LwDrawer isExpanded isInline={true} responsive={{}} panelContent={<div>Panel</div>}>
      <div>Main</div>
    </LwDrawer>,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer');
  // Call-site says isInline=true, but responsive overrides to false at lg < 2xl
  expect(drawer).not.toHaveClass('pf-m-inline');
});

it('responsive: respects isExpanded=false at lg viewport', () => {
  const { container } = render(
    <LwDrawer isExpanded={false} responsive={{}} panelContent={<div>Panel</div>}>
      <div>Main</div>
    </LwDrawer>,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer');
  expect(drawer).not.toHaveClass('pf-m-expanded');
  expect(drawer).not.toHaveClass('pf-m-inline');
});

it('responsive: custom inline breakpoint above lg forces non-inline at lg viewport', () => {
  const { container } = render(
    <LwDrawer isExpanded responsive={{ inline: 'xl' }} panelContent={<div>Panel</div>}>
      <div>Main</div>
    </LwDrawer>,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer');
  expect(drawer).not.toHaveClass('pf-m-inline');
  expect(drawer).toHaveClass('pf-m-expanded');
});

it('responsive: panel stays reachable (overlay, not forced closed) below every breakpoint', () => {
  // No breakpoint matches — simulates a viewport narrower than `sm` (36rem).
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });

  const { container } = render(
    <LwDrawer isExpanded responsive={{}} panelContent={<div>Panel</div>}>
      <div>Main</div>
    </LwDrawer>,
  );

  const drawer = container.querySelector('.pf-v6-c-drawer');
  // Overlay (not inline) — but still expanded. There is no breakpoint that
  // forces the panel closed; `isExpanded` from the call site always wins.
  expect(drawer).toHaveClass('pf-m-expanded');
  expect(drawer).not.toHaveClass('pf-m-inline');
});
