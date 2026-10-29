import { SearchInput, type SearchInputProps } from '@patternfly/react-core';

import {
  getLwSearchInputDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './search-input.css';

/** Owned slots + PF `SearchInput` passthrough — `className` / `style` / rest merge onto the SearchInput root. */
export type LwSearchInputProps = SearchInputProps;

/**
 * Kit **primitive** — configured PF `SearchInput`.
 * Logic harness, not a DOM wrap: root = `SearchInput`; call-site props win via mergeComponentProps.
 * Defaults live in `components.config.ts` → `componentsConfig.searchInput`.
 */
export function LwSearchInput({ className, ...rest }: LwSearchInputProps) {
  const searchInputProps = mergeComponentProps(getLwSearchInputDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-search-input', className),
  });
  return <SearchInput {...searchInputProps} />;
}

export default LwSearchInput;
