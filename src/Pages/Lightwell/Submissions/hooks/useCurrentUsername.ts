import { useEffect, useState } from 'react';

import { useAppContext } from 'middleware/AppContext';

/**
 * Resolves the logged-in user's username via chrome auth. Returns `undefined`
 * until it resolves (or if chrome is unavailable). Used so the UI can omit a
 * redundant "by <you>" when the author is the current user.
 */
export const useCurrentUsername = (): string | undefined => {
  const { chrome } = useAppContext();
  const [username, setUsername] = useState<string | undefined>();

  useEffect(() => {
    let active = true;
    chrome?.auth
      ?.getUser?.()
      ?.then((user) => {
        if (active) setUsername(user?.identity?.user?.username);
      })
      .catch(() => {
        // Non-fatal: without a username we simply keep showing the author.
      });
    return () => {
      active = false;
    };
  }, [chrome]);

  return username;
};
