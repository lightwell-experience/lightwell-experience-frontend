# LwMetricsStackChart

> **Status:** implementing · Unit roadmap: [`ROADMAP.md`](./ROADMAP.md) · Family: [`../ROADMAP.md`](../ROADMAP.md)

## Why it exists

Reusable horizontal stacked-bar metrics surface. Call sites own category
ordering and fills (often from match-status / ecosystem tokens); kit owns the
PF chart stack, tooltips, optional legend, and a11y table host.

## What it can do

| Capability     | Notes                            |
| -------------- | -------------------------------- |
| Stacked series | Per-bar `fill` on data           |
| Tooltips       | Per-series label                 |
| Legend         | Optional (`showLegend`)          |
| A11y table     | Optional structured table for SR |

## Related

- Donut: [`../donut/README.md`](../donut/README.md)
- Extract: [`../examples/lens-coverage-layout-extract.md`](../examples/lens-coverage-layout-extract.md)
