import type { ReactNode } from 'react';
import {
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  type DrawerProps,
  type DrawerPanelContentProps,
} from '@patternfly/react-core';

import {
  getLwDrawerDefaults,
  isBreakpointAtLeast,
  mergeClassNames,
  mergeComponentProps,
  type LwBreakpointKey,
} from 'kit/components/components.config';
import { useLwBreakpoint } from 'kit/hooks/useLwBreakpoint';
import './drawer.css';

/** Responsive drawer behavior — breakpoint-driven panel mode.
 * Breakpoint values come from `lwBreakpoints` in `components.config.ts`. */
export type LwDrawerResponsiveConfig = {
  /** Panel becomes inline (push content) at and above this breakpoint.
   * Below it, the panel overlays — PF's overlay mode floats over content
   * rather than squeezing it, so it works at any viewport width down to
   * phone-narrow; there's no width below which the panel can't render.
   * Default: `'2xl'`. */
  inline?: LwBreakpointKey;
};

type LwDrawerOwnedProps = {
  /** Content for the drawer panel body (e.g. filter form, detail view). */
  panelContent: ReactNode;
  /** Optional content in the drawer panel head (e.g. title, subtitle).
   * When provided (or `onPanelClose` is set), renders a `DrawerHead`. */
  panelHead?: ReactNode;
  /** Close handler — renders `DrawerCloseButton` in `DrawerHead` when provided. */
  onPanelClose?: () => void;
  /** Aria label for the close button. Default: `'Close drawer panel'` (PF default). */
  panelCloseAriaLabel?: string;
  /** PF `DrawerPanelContent` passthrough (sizing, border, color, etc.).
   * `isResizable` defaults to `true` — call site can override via `panelProps`. */
  panelProps?: Omit<DrawerPanelContentProps, 'children'>;
  /** Main content — rendered inside `DrawerContentBody`. */
  children?: ReactNode;
  /**
   * Responsive drawer behavior. When set, the primitive reads the current
   * viewport breakpoint and automatically:
   *   - **Overlays** below `responsive.inline` (default `'2xl'`)
   *   - Goes **inline** at and above `responsive.inline`
   *
   * The panel is reachable at every viewport width — there's no breakpoint
   * where it's hidden or forced closed. `isExpanded` from the call site is
   * always respected. `isInline` from the call site is overridden when
   * responsive is active.
   */
  responsive?: LwDrawerResponsiveConfig;
};

/** Owned slots + PF `Drawer` passthrough (isExpanded, isInline, isPill, position, etc.). */
export type LwDrawerProps = LwDrawerOwnedProps & Omit<DrawerProps, 'children'>;

/**
 * Kit **primitive** — configured PF `Drawer`.
 *
 * Root = PF `Drawer`. Secondary PF pieces (`DrawerContent`, `DrawerPanelContent`,
 * `DrawerHead`, `DrawerActions`, `DrawerCloseButton`, `DrawerPanelBody`,
 * `DrawerContentBody`) stay inside the harness — not separate primitives.
 *
 * Defaults baked in:
 *   - `isPill: true` (config cascade)
 *   - `isResizable: true` on `DrawerPanelContent`
 *
 * Composition:
 *   - `children` → main content (`DrawerContentBody`)
 *   - `panelContent` → panel body (`DrawerPanelBody`)
 *   - `panelHead` / `onPanelClose` → panel header (`DrawerHead` + `DrawerCloseButton`)
 *   - `responsive` → viewport-driven overlay / inline
 */
export function LwDrawer({
  panelContent,
  panelHead,
  onPanelClose,
  panelCloseAriaLabel,
  panelProps,
  children,
  className,
  responsive,
  isExpanded,
  isInline,
  ...rest
}: LwDrawerProps) {
  const bp = useLwBreakpoint();

  const effectiveExpanded = isExpanded;
  let effectiveInline = isInline;

  if (responsive) {
    const inlineAt = responsive.inline ?? '2xl';
    effectiveInline = isBreakpointAtLeast(bp, inlineAt);
  }

  const drawerProps = mergeComponentProps(getLwDrawerDefaults(), {
    ...rest,
    isExpanded: effectiveExpanded,
    isInline: effectiveInline,
    className: mergeClassNames('lw-c-drawer', className),
  });

  const headNode =
    panelHead != null || onPanelClose ? (
      <DrawerHead>
        {panelHead}
        {onPanelClose ? (
          <DrawerActions>
            <DrawerCloseButton
              onClose={onPanelClose}
              {...(panelCloseAriaLabel ? { 'aria-label': panelCloseAriaLabel } : {})}
            />
          </DrawerActions>
        ) : null}
      </DrawerHead>
    ) : null;

  const {
    isResizable: callSiteResizable,
    defaultSize: callSiteDefaultSize,
    minSize: callSiteMinSize,
    ...restPanelProps
  } = panelProps ?? {};

  const panel = (
    <DrawerPanelContent
      isResizable={callSiteResizable ?? true}
      defaultSize={callSiteDefaultSize ?? '260px'}
      minSize={callSiteMinSize ?? '200px'}
      {...restPanelProps}
    >
      {headNode}
      <DrawerPanelBody>{panelContent}</DrawerPanelBody>
    </DrawerPanelContent>
  );

  return (
    <Drawer {...drawerProps}>
      <DrawerContent panelContent={panel}>
        <DrawerContentBody>{children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
}

export default LwDrawer;
