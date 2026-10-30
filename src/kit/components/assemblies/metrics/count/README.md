# LwMetricsCount

> **Status:** implemented — PF text + status bar. Unit roadmap: [`ROADMAP.md`](./ROADMAP.md) · Family: [`../ROADMAP.md`](../ROADMAP.md)

## Why it exists

Reusable **one-stat cell** for Lightwell metrics. Same job on Lens match summary
and Beacon status totals — value, optional chromatic bar, label (+ tooltip).
Not product-specific.

## What it can do

| Capability    | Notes                                                         |
| ------------- | ------------------------------------------------------------- |
| Value + label | PF `Title` + `Content`                                        |
| Status bar    | `color` → `lightwellConfig.colors.stepIcon` (default `blue`)  |
| Label tooltip | Optional; help icon beside label                              |
| Direction     | `column` (default) \| `row`                                   |
| Kit host      | Flex layout root; text from PatternFly                        |
| Loading       | `isLoading` — matched-size skeletons on the same host/classes |

## How it works

- **Tier:** assembly under `assemblies/metrics/count/`
- **Composition:** owned slots (`value`, `label`, `tooltip?`, `color?`, `direction?`)
- **Defaults:** `componentsConfig.metricsCount` (`direction: 'column'`, `color: 'blue'`)

## API

```tsx
import { LwMetricsCount } from 'kit/components/assemblies';

<LwMetricsCount value={34} label='Exact match' color='exact' tooltip='…' />;
```

| Prop                       | Role                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `value`                    | Prominent metric                                                                                 |
| `label`                    | Caption under (column) / beside (row) the value                                                  |
| `color?`                   | `LwStepIconColorKey` → bar fill (default `blue` via config)                                      |
| `tooltip?`                 | Label help tooltip                                                                               |
| `direction?`               | `column` \| `row`                                                                                |
| `isLoading?`               | Renders skeletons instead of `value`/`label` (no bar/tooltip); `value`/`label` optional when set |
| `loadingScreenReaderText?` | Screen-reader text for the loading skeleton                                                      |
| `…rest`                    | Flex passthrough                                                                                 |

## Related

- Composer: [`../card/README.md`](../card/README.md)
- Family: [`../ROADMAP.md`](../ROADMAP.md)
