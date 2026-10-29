import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  Spinner,
  type DropdownProps,
  type MenuToggleElement,
  type MenuToggleProps,
} from '@patternfly/react-core';
import { useId, useState, type ReactNode, type Ref } from 'react';

import {
  getLwMenuDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './menu.css';

/** One action row when using slot-build `items` (not children passthrough). */
export type LwMenuItem = {
  id: string;
  children: ReactNode;
  onSelect?: () => void;
  isDisabled?: boolean;
};

/**
 * PF `MenuToggle` passthrough for the harness-built toggle.
 * Harness owns ref / open / busy wiring and wins those keys after spread.
 *
 * `size: 'lg'` is a Lightwell gap fill — PF MenuToggle only ships `default` | `sm`.
 * Maps to `pf-m-display-lg` (same modifier Button uses for `size="lg"`).
 * See `src/kit/docs/patternfly-gaps.md`.
 */
export type LwMenuToggleProps = Partial<
  Omit<MenuToggleProps, 'ref' | 'onClick' | 'isExpanded' | 'children' | 'size'>
> & {
  size?: 'default' | 'sm' | 'lg';
};

type LwMenuOwnedProps = {
  /** Toggle label when idle. Required unless call-site passes PF `toggle`. */
  label?: ReactNode;
  /** Toggle label while `isBusy`; defaults to `label`. */
  busyLabel?: ReactNode;
  /**
   * Visible field label above the toggle (PF does not ship this).
   * When set, a grouping host earns its place so label + menu stay one flex item.
   * Not `FormGroup` — chrome / filter UI, not form semantics.
   */
  fieldLabel?: ReactNode;
  /** Locks open/close and disables the toggle; shows spinner + busy label. */
  isBusy?: boolean;
  /** Disables the toggle (also true while busy). */
  isDisabled?: boolean;
  /**
   * Pure PF `MenuToggle` passthrough for the harness-built toggle.
   * Do not rename PF tokens (`variant`, `ouiaId`, …) — pass them here.
   * Ignored when call-site supplies `toggle`.
   */
  toggleProps?: LwMenuToggleProps;
  /**
   * Slot build: item descriptors → `DropdownList` / `DropdownItem`.
   * Ignored when `children` is provided (passthrough wins).
   */
  items?: LwMenuItem[];
  /**
   * Passthrough: caller owns menu interior (`DropdownList`, groups, …).
   * Wins over `items`.
   */
  children?: ReactNode;
};

/** Owned slots + PF `Dropdown` passthrough. `toggle` / `children` may be caller-owned. */
export type LwMenuProps = LwMenuOwnedProps &
  Omit<DropdownProps, 'children' | 'toggle'> & {
    /** Explicit PF toggle wins over harness-built toggle from `label` / busy props. */
    toggle?: DropdownProps['toggle'];
  };

/**
 * Kit **primitive** — configured PF `Dropdown` (standard toggle + menu presentation).
 *
 * One base unit: host = `Dropdown` (or labeled grouping root when `fieldLabel` is set).
 * MenuToggle stays inside the harness (Dropdown slot) — not a second primitive.
 *
 * Cascade for interior:
 *   1. `children` → passthrough
 *   2. `items` → build `DropdownList` / `DropdownItem`
 *   3. neither → empty menu shell (toggle only)
 *
 * Owns open state by default; call-site `isOpen` / `onOpenChange` win when controlled.
 * `isBusy` blocks open changes and disables the toggle.
 */
export function LwMenu({
  label,
  busyLabel,
  fieldLabel,
  isBusy = false,
  isDisabled = false,
  toggleProps,
  items,
  children,
  toggle: toggleProp,
  isOpen: isOpenProp,
  onOpenChange: onOpenChangeProp,
  className,
  ...rest
}: LwMenuProps) {
  const fieldLabelId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = isOpenProp !== undefined;
  const isOpen = isControlled ? isOpenProp : uncontrolledOpen;

  const setOpen = (open: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(open);
    }
    onOpenChangeProp?.(open);
  };

  const handleOpenChange = (open: boolean) => {
    if (isBusy) {
      return;
    }
    setOpen(open);
  };

  const toggleDisabled = isDisabled || isBusy;
  const toggleLabel = isBusy ? (busyLabel ?? label) : label;
  const isLabeled = fieldLabel != null && fieldLabel !== false && fieldLabel !== '';

  const {
    size: toggleSize,
    className: toggleClassName,
    isDisabled: toggleIsDisabled,
    'aria-busy': toggleAriaBusy,
    icon: toggleIcon,
    ...restToggleProps
  } = toggleProps ?? {};
  const isDisplayLg = toggleSize === 'lg';

  const defaultToggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      {...restToggleProps}
      // PF MenuToggle size is `default` | `sm` only; `lg` → kit `pf-m-display-lg`.
      size={toggleSize === 'lg' ? undefined : toggleSize}
      className={mergeClassNames(isDisplayLg ? 'pf-m-display-lg' : undefined, toggleClassName)}
      ref={toggleRef}
      onClick={() => handleOpenChange(!isOpen)}
      isExpanded={isOpen}
      isDisabled={Boolean(toggleIsDisabled) || toggleDisabled}
      aria-busy={isBusy || toggleAriaBusy || undefined}
      icon={isBusy ? <Spinner size='sm' aria-hidden='true' /> : toggleIcon}
    >
      {toggleLabel}
    </MenuToggle>
  );

  const dropdownProps = mergeComponentProps(getLwMenuDefaults(), {
    ...rest,
    isOpen,
    onOpenChange: handleOpenChange,
    className: isLabeled ? undefined : mergeClassNames('lw-c-menu', className),
  });

  const selectItem = (onSelect?: () => void) => {
    setOpen(false);
    onSelect?.();
  };

  let interior: ReactNode = null;
  if (children) {
    interior = children;
  } else if (items?.length) {
    interior = (
      <DropdownList>
        {items.map((item) => (
          <DropdownItem
            key={item.id}
            isDisabled={item.isDisabled || isBusy}
            onClick={() => selectItem(item.onSelect)}
          >
            {item.children}
          </DropdownItem>
        ))}
      </DropdownList>
    );
  }

  const dropdown = (
    <Dropdown {...dropdownProps} toggle={toggleProp ?? defaultToggle}>
      {interior}
    </Dropdown>
  );

  if (!isLabeled) {
    return dropdown;
  }

  return (
    <div
      className={mergeClassNames('lw-c-menu', 'lw-c-menu-group', className)}
      role='group'
      aria-labelledby={fieldLabelId}
    >
      <span className='lw-c-menu-group__label' id={fieldLabelId}>
        {fieldLabel}
      </span>
      {dropdown}
    </div>
  );
}

export default LwMenu;
