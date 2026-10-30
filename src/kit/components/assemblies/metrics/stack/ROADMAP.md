# LwMetricsStackChart — roadmap

**Scope:** this unit only — horizontal stacked bar host, series API, legend /
a11y table slots, tooltips.  
**Not here:** Lens ecosystem ordering, report types, donut, family inventory.  
**Prerequisite:** this file + [`README.md`](./README.md) before unit `*.tsx`.

**Family:** [`../ROADMAP.md`](../ROADMAP.md) · Extract plan:
[`../examples/lens-coverage-layout-extract.md`](../examples/lens-coverage-layout-extract.md)

---

## Job

Configurable **stacked bar** metrics surface. Pages build series (including
per-bar `fill`); kit owns PF `Chart` + `ChartStack` harness.

**Host:** PatternFly Charts Victory `Chart` / `ChartStack` / `ChartBar`.

**Convention:** [PF Resize Observer](https://www.patternfly.org/components/charts/resize-observer#responsive-bullet-chart-with-wrapping-legend)
— call site supplies `width` / `height`.

---

## Proposed API

```tsx
<LwMetricsStackChart
  series={[
    { id: 'exact', label: 'Exact match', data: [{ x: 'maven', y: 10, fill: '…' }] },
    { id: 'partial', label: 'Partial match', data: […] },
    { id: 'none', label: 'No match', data: […] },
  ]}
  width={500}
  height={240}
  containerRef={containerRef}
  a11yTable={{ caption: '…', columns: […], rows: […] }}
/>
```

| Prop               | Role                                                         |
| ------------------ | ------------------------------------------------------------ |
| `series`           | Stacked layers (`id`, `label`, `data[]` with `x`/`y`/`fill`) |
| `width` / `height` | Chart box                                                    |
| `allowTooltip?`    | Default true                                                 |
| `showLegend?`      | Optional side legend (e.g. PDF)                              |
| `a11yTable?`       | Screen-reader table                                          |
| `containerRef?`    | Web measure host                                             |

---

## Phases

| Phase | Deliverable                                                             | Done when |
| ----- | ----------------------------------------------------------------------- | --------- |
| S0    | README + this roadmap                                                   | Docs      |
| S1    | Shell + a11y table + unit test                                          | Green     |
| S2    | Barrel; Lens CoverageReport compose; thin Lens `EcosystemBarChart` wrap | Replace   |

**Progress:** S0 → S2 in extract pass.
