# Dissolution map — non-destructive migration

Companion to [examples.md](../examples.md), [perspective.md](../perspective.md),
and [beacon-header-kit-roots.md](beacon-header-kit-roots.md).

## Why two PRs (or two phases)

Kit-root migrations prove the **correct approach** by **replacing usages**, not by
deleting the old surface in the same change set.

| Phase | What lands | Reviewer can validate |
| ----- | ---------- | --------------------- |
| **1 — Migrate** | New kit roots + **page / app** call sites compose them; old domain files stay on disk **unchanged** | Behavior + approach; diff is kit + pages, not domain surgery |
| **2 — Dissolve** | Delete unused domain shells + orphan CSS only | Net removal with **only** organization / consistency / dead-code wins |

Deleting already-built product components in the migrate PR makes review harder:
reviewers must re-learn what was removed while also judging the new kit path.
**Leave litter until a sweep** whose sole job is dissolution.

**Do not edit** unused domain component files in the migrate PR — not even to add
`UNUSED` banners. Kit + page rewiring is enough proof; the inventory below is the
checklist for the dissolve sweep.

## Rules

1. **Replace usages first** — pages/assemblies point at kit roots.
2. **Do not delete** unused domain files or product CSS in the migrate PR.
3. **Do not modify** unused domain TS/TSX shells in the migrate PR (no kit swaps,
   no `UNUSED` JSDoc on those files). Track them here instead.
4. **SCSS orphans** may get a short `UNUSED` comment above the rule block (styles
   are not product components).
5. **Dissolve later** — one sweep removes only entries on this map.
6. **HCC / chrome product shells that still own real behavior stay** until a
   dedicated migrate (e.g. `ExportMenu` PDF/export) — do not half-rewrite them
   as kit wrappers in this PR. Pure chrome with no special behavior is
   **composed on the page** from kit roots (`LwMenu`, `LwAlert`, …).

## Current inventory (Beacon / Lightwell kit-root migrate)

| Leftover (untouched on disk) | Successor | Notes |
| -------- | --------- | ----- |
| `src/Pages/Lightwell/RemediatedDataWarning.tsx` | `LwAlert` | Usages → kit; file left as-is until dissolve |
| `src/Pages/Lightwell/Beacon/components/SlaInfoPopover.tsx` | Beacon: `LwPopover` + `LwButton isCircle` | Usages replaced; file untouched |
| `src/Pages/Lightwell/Beacon/components/PipelineView.tsx` | `LwMetricsStepper` on Beacon | No remaining page imports |
| `src/Pages/Lightwell/Beacon/components/StatusCard.tsx` | `LwMetricsStepper` step cells | Only referenced by unused `PipelineView` |
| `src/Pages/Lightwell/Beacon/components/CustomerIdSelect.tsx` | Beacon page: `LwMenu` + `LwSkeleton` + fetch | No special behavior; page owns composition |
| `styles/lightwell-beacon.scss` → `.lightwell-help-btn` | Circle plain `LwButton` / `LwTooltip` | Orphan CSS |
| `styles/lightwell-beacon.scss` → `.lightwell-pipeline`, `.lightwell-pipeline-arrow` | Metrics stepper layout | Orphan CSS |
| `styles/lightwell-beacon.scss` → `.lightwell-status-card*` | Metrics stepper / count chrome | Orphan CSS |
| `styles/lightwell-beacon.scss` → `.lightwell-stat-number`, `.lightwell-stat--critical` | `LwMetricsCount` | Orphan CSS |
| `src/Pages/Lightwell/Beacon/components/VulnerabilityTable.tsx` | Beacon page: `LwDataView` + `LwDataViewToolbar` + `LwDrawer` responsive panel | Cell renderer extracted to `utils/vulnerabilityTableCells.tsx`; file + test left on disk (D12) |
| `src/Pages/Lightwell/Beacon/components/VulnerabilityTable.test.tsx` | Tests for above | Tests still pass standalone — exercise the old component, not the page |
| `styles/lightwell-beacon.scss` → `.lightwell-filter-panel`, `.lightwell-filter-panel-header` | `LwDrawer` panel via `LwDataView` | Orphan CSS — sidebar sticky layout replaced by drawer |
| `styles/lightwell-beacon.scss` → `.lightwell-beacon-layout` | `LwDrawer` inline layout | Orphan CSS — Flex sidebar layout replaced by responsive drawer |
| `styles/lightwell-beacon.scss` → `.lightwell-beacon-table-area`, `.lightwell-beacon-table-area > .pf-v6-c-stack`, `.lightwell-beacon-table-area .pf-v6-c-card` | `LwDataView` (no card wrapper) | Orphan CSS — card + flex-item sizing replaced by direct table rendering |

### Not on this map (still live)

| Keep | Why |
| ---- | --- |
| `ExportMenu` | HCC/chrome export + PDF — leave alone until that feature is migrated |
| Kit primitives / assemblies introduced in migrate PRs | The destination, not litter |

## Marker pattern (SCSS only in migrate PRs)

```scss
/* UNUSED — successor: <kit root / call-site pattern>.
 * Slated for dissolution sweep. See kit/examples/dissolution-map.md */
```

When dissolving: delete the file/rules, drop the row from this table, and confirm no remaining imports / class references.
