# LwMetricsDonutChart

> **Status:** implementing · Unit roadmap: [`ROADMAP.md`](./ROADMAP.md) · Family: [`../ROADMAP.md`](../ROADMAP.md)

## Why it exists

Reusable donut metrics surface for match / utilization summaries. Lens (and
future products) pass series + title; chromatic defaults come from
`lightwellConfig.colors.matchStatus`.

## What it can do

| Capability              | Notes                                                 |
| ----------------------- | ----------------------------------------------------- |
| Series                  | `{ x, y }[]`                                          |
| Center title / subtitle | PF ChartDonut                                         |
| Color scale             | Default match-status order; override via `colorScale` |
| Tooltips                | Optional `getLabel`                                   |
| Responsive host         | Optional `containerRef` for call-site resize observer |

## Related

- Stack: [`../stack/README.md`](../stack/README.md)
- Extract: [`../examples/lens-coverage-layout-extract.md`](../examples/lens-coverage-layout-extract.md)
