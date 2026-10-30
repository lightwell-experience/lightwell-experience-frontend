# LwMetricsCount — roadmap

**Scope of this file:** this unit only — host/text stack, status bar, tooltip,
direction, API, and implementation phases for `LwMetricsCount`.

**Not in this file:** family inventory, `LwMetricsCard` phases, stepper, charts.
Those live in [`../ROADMAP.md`](../ROADMAP.md) / sibling unit roadmaps.

**Prerequisite:** this roadmap + [`README.md`](./README.md) before unit `*.tsx` / CSS.

---

## Job

One **metric count cell**: large value, optional chromatic status bar, label
(+ optional tooltip). Pages configure; no Beacon/Lens domain.

**Host:** layout root earns its place (`Flex` column by default). Value / label
use PatternFly **text** (`Title`, `Content`) — logic harness, not a DOM wrap
around an invented chrome shell.

**Consumers:** composed inside `LwMetricsCard`; also usable alone.

---

## Features (unit)

1. Value + label via PF text componentry (white / default type — paint in CSS)
2. Optional status **bar** from tenant chromatic (`steps`/match keys via
   `lightwellConfig.colors.stepIcon` or `matchStatus`)
3. Optional label tooltip (`LwTooltip` + help icon)
4. `direction`: `column` (default) | `row`
5. `isLoading` — renders matched-size `LwSkeleton`s on the same host/classes
   instead of `value`/`label` (no bar, no tooltip). Added after Beacon
   hand-rolled the identical skeleton shape three times (raw `Flex` +
   `LwSkeleton` pairs mirroring this unit's own `.lw-c-metrics-count` CSS) as
   a `LwLoaded` fallback — mechanically fixed shape (loading skeleton always
   matches the loaded layout) justified it off one consumer, no second
   consumer needed. `value`/`label` are optional as a result (required only
   when not loading).

---

## Proposed API

```tsx
<LwMetricsCount
  value={34}
  label='Exact match'
  tooltip='…'
  color='exact'
  direction='column' // default
/>
```

---

## Implementation phases (unit)

| Phase | Deliverable                                                            | Done when        |
| ----- | ---------------------------------------------------------------------- | ---------------- |
| C0    | README + this roadmap                                                  | Review consensus |
| C1    | Shell: PF text value/label, column layout, bar + tooltip               | Unit tests       |
| C2    | `direction='row'`; config color keys; barrel export                    | Plug-and-play    |
| C3    | Product replace: Lens `MatchSummaryStats` cells; Beacon Total/Critical | Call sites swap  |

**Progress:** implementing C0–C2 with Beacon/Lens replace in the same pass.
