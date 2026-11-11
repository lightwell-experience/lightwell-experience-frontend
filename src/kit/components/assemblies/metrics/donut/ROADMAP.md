# LwMetricsDonutChart — roadmap

**Scope:** this unit only — PF `ChartDonut` host, series API, colors, tooltips,
HTML legend, web container ref.  
**Not here:** Lens report types, coverage copy, stack chart, family inventory,
product slice catalogs (Beacon On Hold / In Pipeline, etc.).  
**Prerequisite:** this file + [`README.md`](./README.md) before unit `*.tsx`.

**Family:** [`../ROADMAP.md`](../ROADMAP.md) · Extract plan:
[`../examples/lens-coverage-layout-extract.md`](../examples/lens-coverage-layout-extract.md)

---

## Job

Configurable **donut / utilization** metrics surface. Pages pass series + labels;
kit owns PF chart harness and default match-status color scale.

**Host:** PatternFly Charts `ChartDonut` (Victory). Optional wrapping `div` for
resize-observer call sites (ref on container).

**Convention:** [PF Resize Observer](https://www.patternfly.org/components/charts/resize-observer#responsive-bullet-chart-with-wrapping-legend)
— call site measures width; unit renders at given `width` / `height`.

---

## Proposed API

```tsx
<LwMetricsDonutChart
  data={[
    { x: 'Exact match', y: 60 },
    { x: 'Partial match', y: 15 },
    { x: 'No match', y: 25 },
  ]}
  width={320}
  height={280}
  title='75%'
  subTitle='packages matched'
  containerRef={containerRef}
/>
```

| Prop                  | Role                                                |
| --------------------- | --------------------------------------------------- |
| `data`                | `{ x, y }[]` slices                                 |
| `width` / `height`    | Chart box                                           |
| `title` / `subTitle?` | Center labels                                       |
| `colorScale?`         | Default: match-status exact → partial → none        |
| `allowTooltip?`       | Default true                                        |
| `getLabel?`           | Tooltip label fn                                    |
| `showLegend?`         | HTML legend built from `data` + `colorScale`        |
| `legendPosition?`     | `'right'` (default) \| `'bottom'` \| `'responsive'` |
| `formatLegendLabel?`  | Row text override; default `${x}: ${y}`             |
| `legendAriaLabel?`    | Legend list name; defaults to `ariaDesc`            |
| `containerRef?`       | Web measure host                                    |
| `ariaDesc?`           | A11y                                                |

### Legend

The legend is an HTML `<ul>` rendered **inside the existing host** (no extra wrapper),
not PF's SVG legend. Rows come from the same `data` / `colorScale` the ring uses, so
there is no second series to keep in sync. A semantic list reads and reflows better
than SVG text, and the unit CSS owns layout (plain CSS, no `Flex` / `FlexItem`).

| `legendPosition` | Layout                                                      |
| ---------------- | ----------------------------------------------------------- |
| `right`          | Legend beside the ring                                      |
| `bottom`         | Legend under the ring                                       |
| `responsive`     | Beside the ring below `lg` (62rem), under it at `lg` and up |

`responsive` is a viewport `@media` rule. It matches the page-chrome-slot `lg`
breakpoint: below it the slots stack and the card is full width; at it and above the
slots sit side by side and the card narrows. The rem comes from the map in
`components.config.css`.

Legend and tooltips both show the same text. Pass one formatter to `getLabel` and
`formatLegendLabel` when you override it.

---

## Phases

| Phase | Deliverable                                                           | Done when |
| ----- | --------------------------------------------------------------------- | --------- |
| D0    | README + this roadmap                                                 | Docs      |
| D1    | Shell + defaults + unit test                                          | Green     |
| D2    | Barrel; Lens CoverageReport compose; thin Lens `MatchDonutChart` wrap | Replace   |
| D3    | HTML legend (`showLegend` / `legendPosition` / `formatLegendLabel`)   | Green     |
| D4    | Harness owns width measurement + aspect ratio (opt-in)                | Follow-up |

**Progress:** D0 → D2 in extract pass; D3 for the Beacon status summary.

**D4 (not started):** `useContainerWidth` and a height-from-width helper are repeated
at every donut call site (Lens coverage report, Lens summary block). Move them into
this unit once a second consumer needs them. Until then call sites pass `width` /
`height`.
