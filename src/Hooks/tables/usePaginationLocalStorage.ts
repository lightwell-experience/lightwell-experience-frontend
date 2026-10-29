import { OnSetPage, OnPerPageSelect } from '@patternfly/react-core';
import React, { useCallback, useState } from 'react';

export type PaginationLocalStorage = {
  perPage: number;
  page: number;
  onSetPage: OnSetPage;
  onPerPageSelect: OnPerPageSelect;
  setPage: React.Dispatch<React.SetStateAction<number>>;
};

export const usePaginationLocalStorage = ({ key }: { key: string }) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(() => Number(localStorage.getItem(key)) || 20);

  const onPerPageSelect: OnPerPageSelect = useCallback(
    (_, newPerPage, newPage) => {
      // Save this value through page refresh for use on next reload
      setPerPage(newPerPage);
      setPage(newPage);
      localStorage.setItem(key, newPerPage.toString());
    },
    [key],
  );

  const onSetPage: OnSetPage = (_, newPage) => setPage(newPage);

  return { page, perPage, onPerPageSelect, onSetPage, setPage };
};
