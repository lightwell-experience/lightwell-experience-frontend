# LwMetricsStepper — roadmap

**Scope of this file:** this unit only — host, states, animation, tooltips, API,
and implementation phases for `LwMetricsStepper`.

**Not in this file:** family inventory, shared color absorption, chart Resize
Observer convention, Beacon totals/`LwMetricsCard`, or other metrics units.
Those live in [`../ROADMAP.md`](../ROADMAP.md).

**Prerequisite:** this roadmap + [`README.md`](./README.md) agreed before any
`*.tsx` / unit CSS for the stepper.

---

## Job

Plug-and-play **hydratable metrics stepper**. Pages pass step descriptors and
hydration state; the assembly does not know Beacon, customer IDs, or fetch.

**Host:** PatternFly `ProgressStepper` / `ProgressStep` (logic harness — host is
tree root; no DOM wrap).

**First product replace (later):** Beacon `PipelineView` only. Totals / Critical
remain until `LwMetricsCard`. Non-destructive until that swap.

---

## States

| State          | Behavior                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------ |
| **Unhydrated** | All `pending` (empty circles); titles hidden. Tooltips still available.                    |
| **Hydrated**   | Titles + descriptions from call-site data. PF `variant` / `isCurrent` own icons and fills. |

Hydration is a **prop/contract** (`isHydrated`). Not coupled to “customer selected.”
**Do not** restyle PF step icons/fills in kit CSS — pass PF variants from the call site.

---

## Features (unit)

1. Unhydrated shell (`pending`; no compact)
2. Hydrated fill from call-site step data (titles / descriptions)
3. Step chrome: PF for structure (`variant` / `isCurrent` / `icon`); icon
   **background** from tenant match-status via `steps[].color`
   (`exact` / `partial` / `none` → `--lw-color--match-status--*`)
4. Hydrate motion: simple left→right reveal on the host (`clip-path`); honor
   `prefers-reduced-motion`
5. Hover tooltips on the **step icon** in both states

---

## Proposed API (draft — confirm at implement)

```tsx
<LwMetricsStepper
  isHydrated={boolean}
  steps={[
    { id, label, tooltip, value?, /* color key or class — TBD */ },
  ]}
  className?
  /* PF ProgressStepper passthrough where safe */
/>
```

Open at implement:

- Prop name for hydration (`isHydrated` vs `isEmpty` vs absence of values)
- Color: domain key map vs caller-supplied class/token
- Whether counts render inside steps or only drive modifiers

---

## Implementation phases (unit)

| Phase | Deliverable                                                     | Done when                                                        |
| ----- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| S0    | README + this roadmap (no code)                                 | Review consensus                                                 |
| S1    | Harness shell: PF ProgressStepper, unhydrated N steps, tooltips | Unit tests + visual via page-header hero chrome rows             |
| S2    | Hydrated values + left→right hydrate reveal + reduced-motion    | Tests + visual                                                   |
| S3    | Color wiring to root match-status / future pipeline map         | Tokens only from kit config                                      |
| S4    | Export from assemblies barrel; demo/build surface only          | Plug-and-play; still no Beacon delete                            |
| S5    | Beacon **replace** `PipelineView` → `LwMetricsStepper`          | Product mounts stepper; `PipelineView.tsx` kept until callers go |

**Progress:** S0–S3 + barrel export done. Beacon hosts via `LwPageHeader hero`
children + `PageChromeSlots` with hydrated pipeline steps, per-status
`stepIcon` colors and `isCenterAligned={false}`. `PipelineView` is no longer
mounted from Beacon (component file retained).

---

## Build / validate surface

Do **not** couple the unit to Beacon placement. While building, mount via
`LwPageHeader hero` additional `.lw-c-page-header-chrome-slots` row via call-site
`PageChromeSlots` composition. Family roadmap owns multi-row chrome (F1).

---

## Dependencies

| Needs                                   | From                                              |
| --------------------------------------- | ------------------------------------------------- |
| Match-status (or later pipeline) tokens | Family / `lightwell.config`                       |
| Multi chrome-slot rows on hero          | Page family (`LwPageHeader hero`)                 |
| Tooltip primitive pattern               | PF `Tooltip` or future kit harness — decide at S1 |

---

## Out of scope (unit)

- `LwMetricsCard`, charts, Lens migration
- Deleting Beacon Status Summary / EmptyState
- Deciding final Beacon hero placement of the stepper
