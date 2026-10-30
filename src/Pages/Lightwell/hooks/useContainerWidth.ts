import { useCallback, useLayoutEffect, useState } from 'react';
import { getResizeObserver } from '@patternfly/react-core';

export const useContainerWidth = (defaultWidth: number) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(defaultWidth);

  // Measure when the node mounts. The hook often runs while the chart is not rendered yet.
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  useLayoutEffect(() => {
    if (!container) return;

    const handleResize = () => {
      if (container.clientWidth > 0) {
        setWidth(container.clientWidth);
      }
    };
    handleResize();
    return getResizeObserver(container, handleResize);
  }, [container]);

  return { containerRef, width };
};
