import { useMemo } from 'react';
import { DataViewState } from '@patternfly/react-data-view/dist/dynamic/DataView';

type UseTableActiveStateProps = {
  isLoading: boolean;
  count: number;
  isFetching?: boolean;
  isError?: boolean;
};

export default function useTableActiveState({
  isLoading,
  count,
  isFetching = false,
  isError = false,
}: UseTableActiveStateProps): DataViewState | undefined {
  return useMemo(() => {
    if (isLoading || isFetching) return DataViewState.loading;
    if (isError) return DataViewState.error;
    return count === 0 ? DataViewState.empty : undefined;
  }, [isLoading, isError, isFetching, count]);
}
