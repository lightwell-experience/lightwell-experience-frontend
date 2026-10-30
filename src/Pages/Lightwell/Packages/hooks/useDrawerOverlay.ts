import {
  useEffect,
  useLayoutEffect,
  useState,
  type KeyboardEvent,
  type TransitionEvent,
} from 'react';
import backdropStyles from '@patternfly/react-styles/css/components/Backdrop/backdrop';

const DRAWER_SLIDE_FALLBACK_MS = 400;

type UseDrawerOverlayProps = {
  isExpanded: boolean;
  onClose: () => void;
};

type UseDrawerOverlayResult = {
  isOverlayMounted: boolean;
  isOverlayExpanded: boolean;
  onOverlayTransitionEnd: (event: TransitionEvent<HTMLElement>) => void;
  onEscape: (event: KeyboardEvent<HTMLElement>) => void;
};

export const useDrawerOverlay = ({
  isExpanded,
  onClose,
}: UseDrawerOverlayProps): UseDrawerOverlayResult => {
  const [isOverlayMounted, setIsOverlayMounted] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const isOverlayExpanded = isExpanded && hasEntered;

  useLayoutEffect(() => {
    if (isExpanded) {
      setIsOverlayMounted(true);
      return undefined;
    }

    setHasEntered(false);
    return undefined;
  }, [isExpanded]);

  useLayoutEffect(() => {
    if (!isExpanded || !isOverlayMounted) {
      return undefined;
    }

    const frame = requestAnimationFrame(() => setHasEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [isExpanded, isOverlayMounted]);

  useLayoutEffect(() => {
    if (!isOverlayMounted) {
      return undefined;
    }

    const onDocumentEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.classList.add(backdropStyles.backdropOpen);
    document.addEventListener('keydown', onDocumentEscape);

    return () => {
      document.body.classList.remove(backdropStyles.backdropOpen);
      document.removeEventListener('keydown', onDocumentEscape);
    };
  }, [isOverlayMounted, onClose]);

  useEffect(() => {
    if (isExpanded || !isOverlayMounted) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setIsOverlayMounted(false), DRAWER_SLIDE_FALLBACK_MS);
    return () => window.clearTimeout(timeoutId);
  }, [isExpanded, isOverlayMounted]);

  const onEscape = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  const onOverlayTransitionEnd = (event: TransitionEvent<HTMLElement>) => {
    if (event.propertyName !== 'transform' || isExpanded) {
      return;
    }

    setIsOverlayMounted(false);
  };

  return {
    isOverlayMounted,
    isOverlayExpanded,
    onOverlayTransitionEnd,
    onEscape,
  };
};
