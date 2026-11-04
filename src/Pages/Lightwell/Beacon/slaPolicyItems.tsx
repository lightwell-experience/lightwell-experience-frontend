import type { LwListItem } from 'kit/components/primitives';

/** Beacon SLA popover body — hydrated into kit `LwList`. */
export const SLA_POLICY_ITEMS: LwListItem[] = [
  {
    id: 'submit',
    children: (
      <>
        <strong>Submit:</strong> Submit findings at any time.
      </>
    ),
  },
  {
    id: 'response-time',
    children: (
      <>
        <strong>Response time:</strong> Triaged within <strong>48 hours</strong> (up to 25 findings
        per member per week).
      </>
    ),
  },
  {
    id: 'prioritize',
    children: (
      <>
        <strong>Prioritize:</strong> Your severity sets the default order. Adjust at any time.
      </>
    ),
  },
  {
    id: 'fix-completion',
    children: (
      <>
        <strong>Fix completion:</strong> Applied after a patched artifact is published to the
        repository or Lightwell Network.
      </>
    ),
  },
];
