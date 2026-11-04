import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type PropsWithChildren,
} from 'react';

type PendingReproducersContextValue = {
  /** Stash reproducer files chosen in the hero, keyed by submission uuid. */
  setPending: (uuid: string, files: File[]) => void;
  /** Return and clear any files stashed for this uuid (consume once). */
  takePending: (uuid: string) => File[] | undefined;
};

// Default no-op so components (and their unit tests) render without a provider;
// the real hand-off only happens when Submissions wraps the page in the provider.
const PendingReproducersContext = createContext<PendingReproducersContextValue>({
  setPending: () => undefined,
  takePending: () => undefined,
});

/**
 * Carries reproducer File objects from the Submissions hero (UploadSuccessStep) to the
 * submission drawer (SubmissionDetails). The drawer is opened via the URL param
 * `?submission=<uuid>`, which can't carry File objects, so the hero stashes the
 * chosen files here and the drawer consumes them on mount to perform the upload.
 */
export const PendingReproducersProvider = ({ children }: PropsWithChildren) => {
  const pendingRef = useRef(new Map<string, File[]>());

  const setPending = useCallback((uuid: string, files: File[]) => {
    pendingRef.current.set(uuid, files);
  }, []);

  const takePending = useCallback((uuid: string) => {
    const files = pendingRef.current.get(uuid);
    pendingRef.current.delete(uuid);
    return files;
  }, []);

  const value = useMemo(() => ({ setPending, takePending }), [setPending, takePending]);

  return (
    <PendingReproducersContext.Provider value={value}>
      {children}
    </PendingReproducersContext.Provider>
  );
};

export const usePendingReproducers = () => useContext(PendingReproducersContext);
