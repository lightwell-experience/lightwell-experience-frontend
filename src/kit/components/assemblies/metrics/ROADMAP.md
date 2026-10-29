# Metrics family — roadmap

**Scope of this file:** family inventory, shared config, sequencing across units,
and cross-cutting conventions. Unit-specific phases live in each unit’s
`ROADMAP.md` — do not duplicate them here.

**Status:** scaffolding. No metrics unit implementation until that unit’s roadmap
is agreed and its README exists.

---

## Why this family exists

`assemblies/metrics/` holds **visual metrics surfaces** — steppers, summary cards,
charts, graphs. Product pages configure them; they do not own Beacon/Lens fetch or
domain catalogs.

**Non-destructive:** first product wiring **replaces** call sites (e.g. Beacon
`PipelineView`) by swapping in kit units. Existing domain components stay until
each replace lands. Nothing is deleted in this scaffolding pass.

---

## Inventory

| Unit        | Export                | Job                                                                      | Unit roadmap                                   |
| ----------- | --------------------- | ------------------------------------------------------------------------ | ---------------------------------------------- |
| Stepper     | `LwMetricsStepper`    | Hydratable progress metrics (PF ProgressStepper host)                    | [`stepper/ROADMAP.md`](./stepper/ROADMAP.md)   |
| Count       | `LwMetricsCount`      | One metric cell (PF text + status bar)                                   | [`count/ROADMAP.md`](./count/ROADMAP.md)       |
| Card        | `LwMetricsCard`       | `LwCard` + composable `items` / children                                 | [`card/ROADMAP.md`](./card/ROADMAP.md)         |
| Stat item   | `LwStatItem`          | Compact value + label (no PF host); prefer Count when bar/tooltip needed | [`stat-item/README.md`](./stat-item/README.md) |
| Donut chart | `LwMetricsDonutChart` | Donut / utilization metrics                                              | [`donut/ROADMAP.md`](./donut/ROADMAP.md)       |
| Stack chart | `LwMetricsStackChart` | Stacked bar / area metrics                                               | [`stack/ROADMAP.md`](./stack/ROADMAP.md)       |

Add a unit row here when a unit folder + roadmap + README are created. Do **not**
put step APIs, animation details, or chart series props in this file.

---

## Shared config (family-owned)

| Concern                       | Home                                           | Notes                                                                                                                   |
| ----------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Match-status chromatic tokens | `lightwell.config.ts` + `lightwell.config.css` | Absorbed from Lens `chartTheme` (`exact` / `partial` / `none`). CSS vars are source of paint; TS exposes the same keys. |
| Domain → token maps           | Per unit or later `metrics.config`             | Open: passthrough vs map. Decide per unit when implementing — family only requires tokens exist at root.                |
| Presentational family tokens  | `metrics.config.css` (when needed)             | Spacers / type shared by ≥2 metrics units. Not YAML.                                                                    |

**Cascade reminder:** tenant chromatic → family/unit presentational CSS → unit
co-located CSS. Prop defaults stay in `components.config.ts` when a unit needs them.

---

## Chart convention (all chart units)

Every chart assembly uses PatternFly **Resize Observer** for responsive sizing /
wrapping legends:

https://www.patternfly.org/components/charts/resize-observer#responsive-bullet-chart-with-wrapping-legend

Unit roadmaps for Donut / Stack own series APIs and PF chart host choice; they
must cite this convention and not redefine it.

---

## Sequencing (family)

| Order | Work                                                                                 | Owner doc                                                                                |
| ----- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| F0    | Family scaffolding (this file), root match-status colors, skill rule                 | this file                                                                                |
| F1    | Page-hero multi chrome-slot rows (build/validate surface; not Beacon coupling)       | page family + this file                                                                  |
| F2    | `LwMetricsStepper` implementation                                                    | [`stepper/ROADMAP.md`](./stepper/ROADMAP.md)                                             |
| F3    | Beacon replace: `PipelineView` → `LwMetricsStepper` (totals stay; card later)        | product + stepper README                                                                 |
| F4    | `LwMetricsCount` + `LwMetricsCard`; Beacon Status Summary + Lens `MatchSummaryStats` | count/card roadmaps                                                                      |
| F5    | Chart units + Lens `chartTheme` consumers read root colors                           | donut/stack roadmaps                                                                     |
| F5a   | Lens coverage layout extract — snapshot, page compose, restore domain blocks         | [`examples/lens-coverage-layout-extract.md`](./examples/lens-coverage-layout-extract.md) |
| F6    | Further product replaces as needed                                                   | product                                                                                  |

F3+ are **replace** operations at call sites — additive kit, swap imports/JSX.

**Lens coverage (F5a):** preserve the current hero layout by extracting donut/stack
**jobs** into kit, composing pieces on `CoverageReport`, then restoring mutated
`Lens/components` metrics blocks. Do not promote `CoverageSummaryBlock` /
`EcosystemBreakdownBlock` wholesale. Details + layout snapshot:
[`examples/lens-coverage-layout-extract.md`](./examples/lens-coverage-layout-extract.md).

---

## Explicitly out of family roadmap

- Step unhydrated/hydrated behavior, tooltips, CSS animation — **stepper** roadmap
- Totals/Critical card layout — **card** roadmap
- Donut/stack series, legends, PF chart props — **chart** roadmaps
- Where Beacon mounts the stepper in the hero — product; kit stays plug-and-play

---

## Validation (family)

| Gate                                                                                      | When       |
| ----------------------------------------------------------------------------------------- | ---------- |
| Root match-status tokens compile / Lens can import them                                   | F0         |
| `LwPageHeader hero` hosts ≥2 `.lw-c-page-header-chrome-slots` rows via composition        | F1         |
| Each unit: README + roadmap before `.tsx`                                                 | every unit |
| Smoke: build/validate surface via page-header hero chrome row (not required to be Beacon) | F2+        |
