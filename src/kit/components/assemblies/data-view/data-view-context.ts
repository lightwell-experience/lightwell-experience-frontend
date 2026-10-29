import { createContext, useContext } from 'react';

/**
 * Internal context shared between `LwDataView` and `LwDataViewToolbar`.
 * Not part of the public kit API — do not re-export from the family index.
 */
type DataViewInternalContextValue = {
  /** Provided by `LwDataView` when `manageColumns` is set. */
  onOpenManageColumns?: () => void;
};

export const DataViewInternalContext = createContext<DataViewInternalContextValue>({});

export function useDataViewInternalContext(): DataViewInternalContextValue {
  return useContext(DataViewInternalContext);
}
