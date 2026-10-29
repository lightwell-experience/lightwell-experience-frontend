# LwMetricsStepper

> **Status:** S1–S3 implemented against **PatternFly ProgressStepper** guidance.
> Unit roadmap: [`ROADMAP.md`](./ROADMAP.md) · Family: [`../ROADMAP.md`](../ROADMAP.md)

## Why it exists

Reusable **metrics stepper** for Lightwell: hydratable progress metrics any page
can drop in. Not Beacon-specific. Beacon mounts via `LwPageHeader hero` children
composition (`PageChromeSlots`) and maps domain → `stepIcon` colors; the kit
unit stays product-agnostic.

## What it can do

| Capability        | Notes                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------- |
| Unhydrated shell  | All steps `variant="pending"` (empty circles); titles hidden via kit CSS                     |
| Hydrated metrics  | Titles with **stacked** count + label; call-site PF `variant` / `isCurrent` / `icon`         |
| Icon tooltips     | Hover on the **step icon** (titles stay plain — no title help-text)                          |
| Custom icons      | `steps[].icon` → PF `ProgressStep` `icon` (see PF “With custom icons”)                       |
| Config icon fills | `steps[].color` → `lightwellConfig.colors.stepIcon` via `--lw-metrics-step-icon-bg`          |
| Truncated counts  | String/number `value` → PF `Truncate` (container / width ellipsis — not `maxCharsDisplayed`) |
| Count rule        | Hydrated count: `3xl` + heading bold                                                         |
| Label rule        | Label `border-block-end` uses `--lw-metrics-step-icon-bg`; labels hidden below xl (`75rem`)  |
| Hydrate motion    | Whole band reveals **left → right** (`clip-path`); `prefers-reduced-motion` disables         |
| Kit host          | PF `ProgressStepper` root — logic harness, not a DOM wrap                                    |

**Subtract PF:** connectors / alignment stay PatternFly (default = left;
omit `isCenterAligned`). Compact is refused. Icon **background** fills come from tenant `stepIcon` tokens
when `color` is set. Call site maps domain → key; kit does not invent paints.
Hydrated `value` stacks **above** the label — not PF `description`, not an inline `&nbsp;` run.

## How it works

- **Tier:** assembly under `assemblies/metrics/`
- **Host:** PatternFly `ProgressStepper` / `ProgressStep`
- **Composition:** slot-build from `steps` + `isHydrated`
- **Defaults:** `componentsConfig.metricsStepper` (`isHorizontal: true` → `pf-m-horizontal`).
  PF host props passthrough (`isVertical`, `isCenterAligned`, …) except `isCompact` (refused).
  `isHorizontal` is kit-owned (PF React gap).

## API

```tsx
import { LwMetricsStepper } from 'kit/components/assemblies';
import RhUiInProgressIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-in-progress-icon';
import RhUiPendingIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-pending-icon';

<LwMetricsStepper
  aria-label='Submission pipeline metrics'
  isHydrated
  steps={[
    {
      id: 'a',
      label: 'Submitted',
      tooltip: '…',
      value: 4,
      icon: <RhUiPendingIcon />,
      color: 'blue',
    },
    {
      id: 'b',
      label: 'In process',
      value: 2,
      isCurrent: true,
      icon: <RhUiInProgressIcon />,
      color: 'orange',
      tooltip: '…',
    },
    {
      id: 'c',
      label: 'Pending',
      value: 0,
      variant: 'pending',
      icon: <RhUiPendingIcon />,
      color: 'teal',
    },
  ]}
/>;
```

Renders as a **column** under each icon — count above label (e.g. `4` / `Submitted`).
String/number counts use PF `Truncate` (width ellipsis). Spacing is CSS `gap`, not `&nbsp;`.

| Prop            | Role                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------- |
| `steps`         | `{ id, label, tooltip?, value?, variant?, isCurrent?, icon?, color? }[]`                    |
| `steps[].color` | `LwStepIconColorKey` → icon background via config (hydrated only)                           |
| `steps[].value` | Stacked above label when hydrated; string/number → PF `Truncate`                            |
| `isHydrated`    | `false` → pending + titles hidden; `true` → titles/values + call-site variants/icons/colors |
| `…rest`         | PF `ProgressStepper` passthrough (`isCenterAligned`, `isVertical`, …) — not `isCompact`     |

## Related

- PatternFly Progress stepper (variants, alignment)
- Family roadmap: [`../ROADMAP.md`](../ROADMAP.md)
- Unit roadmap: [`ROADMAP.md`](./ROADMAP.md)
