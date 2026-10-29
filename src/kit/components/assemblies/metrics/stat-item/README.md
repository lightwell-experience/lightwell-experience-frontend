# LwStatItem

> **Status:** implemented (rehomed from `primitives/stat-item`). Family: [`../ROADMAP.md`](../ROADMAP.md)

## Why it exists

Compact **value + label** metrics cell with optional semantic value color.
No PF host — minimal kit block when `LwMetricsCount` (status bar / tooltip / Flex)
is more chrome than the surface needs.

## What it can do

| Capability       | Notes                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| Value + label    | Two-element block                                                         |
| Semantic variant | `danger` / `warning` / `success` / `info` → PF status tokens on the value |
| Layout           | Parent owns Flex / alignment                                              |

## How it works

- **Tier:** assembly under `assemblies/metrics/stat-item/`
- **Host:** kit `div` (no PatternFly root)
- **Prefer** `LwMetricsCount` for bar + tooltip surfaces

## API

```tsx
import { LwStatItem } from 'kit/components/assemblies';

<LwStatItem value={12} label='Critical' variant='danger' />;
```

| Prop         | Role                                    |
| ------------ | --------------------------------------- |
| `value`      | Prominent metric                        |
| `label`      | Caption under the value                 |
| `variant?`   | Semantic value color (`default` = none) |
| `className?` | Merged onto the host                    |

## Out of scope

Fetch, product catalogs, status-bar / tooltip chrome (`LwMetricsCount`).
