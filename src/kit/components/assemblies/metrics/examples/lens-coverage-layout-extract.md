# Lens coverage layout — extract roadmap

**Status:** snapshot + plan (no extract code until unit README + unit ROADMAP exist).  
**Family:** [`../ROADMAP.md`](../ROADMAP.md) · Skills: kit (migrate usages; do not mutate product chart shells).

**Goal:** Keep the **current visual layout** of Lens coverage / upload chrome. Achieve it by
extracting **kit metrics pieces**, composing them at **Lens page call sites**, then
**restoring** pre-mutation `Lens/components` (and chart wrappers) so domain files are no
longer the migration surface.

---

## Principles

1. **Migrate page usage**, not edit product metrics blocks in place.
2. Promote the **chart / metrics job** into `assemblies/metrics/` — never
   `CoverageSummaryBlock` / `EcosystemBreakdownBlock` wholesale.
3. Lens owns **titles, supporting copy, report → series/count builders, Flex/chrome
   arrangement**.
4. Color / severity / match meaning stay **data-driven** via
   `lightwell.config` (+ CSS vars); charts and counts consume keys, not one-off hex.
5. Non-destructive: restore domain components to HEAD shape; leave unused shells
   for dissolution sweeps — do not delete in the extract PR unless already unused.

---

## Snapshot — target layout (current working tree)

Captured from Lens pages as of this document. This is the **presentation contract**
to preserve after extract + restore.

### ManifestUpload (`ManifestUpload.tsx`)

```
LwPageHeader hero
├─ PageChromeSlots (row 1)
│  ├─ PageChromeSlot → PageTitleStack (title + description)
│  └─ PageChromeSlot → ManifestUploadCard (upload / progress)
└─ PageChromeSlots (row 2)
   └─ PageChromeSlot → format / size limit Content
```

**Out of this extract:** upload card / dropzone (not metrics family). Keep page chrome
migration; do not fold ManifestUploadCard into `/metrics`.

### CoverageReport (`CoverageReport.tsx`)

```
LwPageHeader hero bodyWidth/bodyMaxWidth 100%
├─ PageChromeSlots (row 1) — title band
│  ├─ PageChromeSlot → PageTitleStack (match analysis + filename)
│  └─ PageChromeSlot → "New analysis" Button
├─ PageChromeSlots (row 2) — coverage summary band
│  └─ [compose pieces — see Coverage summary composition]
├─ PageChromeSlots (row 3) — ecosystem band
│  └─ [compose pieces — see Ecosystem composition]
└─ PageChromeSlots (row 4) — alert band
   └─ PageChromeSlot → PageChromeSlotFooter → LwAlert

PageSection (body) — not in hero
└─ LwCard → PackageCoverageTable
```

**Note:** Working tree may pass summary/ecosystem nodes as direct `PageChromeSlots`
children. Prefer wrapping each band’s content in `PageChromeSlot` when rewriting
usage (same visual; valid chrome grammar).

### Coverage summary composition (current `CoverageSummaryBlock` look)

Preserve this arrangement at **CoverageReport** after extract (not inside a restored
domain mega-block):

| Region       | Content                                                           | Kit / domain                                               |
| ------------ | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| Left         | Match donut (responsive width/height)                             | → `LwMetricsDonutChart` (extract)                          |
| Right column | Percentage `Title` (`{n}% of packages match…`)                    | Lens copy                                                  |
| Right column | Supporting `Content` (ecosystems including unsupported)           | Lens copy                                                  |
| Right column | Match counts in a card (exact / partial / none + tooltips + bars) | `LwMetricsCard` + `LwMetricsCount` **items** (already kit) |

Layout intent (call site):

- Horizontal band: donut | (title + description + metrics card)
- Donut flex ~1, copy/metrics column flex ~2; wrap on narrow viewports
- Gap ~ `gapXl` / spacer xl between regions; column gap ~ md–lg inside copy stack

**Data builders (stay Lens):** map `CompletedCoverageReport` → donut series + three
`LwMetricsCount` props (`exact` / `partial` / `none` colors from config).

### Ecosystem composition (current `EcosystemBreakdownBlock` look)

| Region          | Content                                  | Kit / domain                      |
| --------------- | ---------------------------------------- | --------------------------------- |
| Title           | `Packages by ecosystem` (h3)             | Lens copy                         |
| Supporting line | `{inCatalog} of {total} packages found…` | Lens copy                         |
| Chart           | Stacked bars by ecosystem + legend       | → `LwMetricsStackChart` (extract) |

Layout intent (call site): column Flex, `gapMd`, grow (`flex: 1`) when sharing a row.

**Data builders (stay Lens):** map `ecosystem_coverage_summary` (+ match totals) →
stack series / legend; colors from match-status (or ecosystem) config keys.

### Package table

Stays **outside** the hero (`PageSection` + `LwCard`). Not part of metrics extract.

---

## Piece inventory — extract vs leave

### Already kit (wire / keep)

| Unit                | Path                           | Lens job                             |
| ------------------- | ------------------------------ | ------------------------------------ |
| `LwMetricsCount`    | `metrics/count/`               | Exact / partial / none cells         |
| `LwMetricsCard`     | `metrics/card/`                | Host for count `items` in `CardBody` |
| Match-status colors | `lightwell.config.ts` / `.css` | `exact` / `partial` / `none`         |

### Extract into kit (F5 — unit docs first)

| Unit  | Export                | Source today                                                         | Job                                                        |
| ----- | --------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| Donut | `LwMetricsDonutChart` | `Lens/charts/MatchDonutChart` + `matchDonutModel` (presentation)     | Configurable donut; PF charts + resize-observer convention |
| Stack | `LwMetricsStackChart` | `Lens/charts/EcosystemBarChart` + `ecosystemBarModel` (presentation) | Configurable stacked bar; same convention                  |

**Do not kit-ize:** report types, filename title truncation rules, alert copy,
table, ManifestUploadCard.

### Restore after page rewire (HEAD / pre-mutation domain)

Restore these files to **git HEAD** (pre Lens-metrics surgery), then leave them
unused or thinly re-export only if something outside CoverageReport still imports
them. Prefer CoverageReport **not** importing the mega-blocks once composition
lives on the page.

| File                                          | Restore reason                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Lens/components/CoverageSummaryBlock.tsx`    | Mutated for hero/metrics-card; restore HEAD                                                                   |
| `Lens/components/EcosystemBreakdownBlock.tsx` | Mutated layout (`flex: 1`, etc.); restore HEAD                                                                |
| `Lens/components/MatchSummaryStats.tsx`       | Emptied UNUSED; restore HEAD implementation                                                                   |
| `Lens/components/coverage-summary-block.css`  | Added during surgery; remove after page owns layout                                                           |
| `Lens/charts/chartTheme.ts`                   | Only if extract moved chromatic ownership cleanly to root — consumers should read config; avoid divergent hex |

Charts under `Lens/charts/` that become kit hosts: after extract, either thin
deprecated wrappers marked UNUSED or delete in a later dissolution sweep — **not**
in the same PR as first green replace if PDF/other surfaces still import them.

---

## Target call-site sketch (CoverageReport)

Illustrative — product copy and builders stay above the return.

```tsx
// builders above: matchCountItems, donutSeries, stackSeries, …

<LwPageHeader hero bodyWidth='100%' bodyMaxWidth='100%'>
  <PageChromeSlots>
    <PageChromeSlot>
      <PageTitleStack title={…} ouiaId='lightwell-coverage-header' />
    </PageChromeSlot>
    <PageChromeSlot>
      <Button …>New analysis</Button>
    </PageChromeSlot>
  </PageChromeSlots>

  <PageChromeSlots>
    <PageChromeSlot>
      <Flex …> {/* page layout — not inside kit chart */}
        <FlexItem flex={{ default: 'flex_1' }}>
          <LwMetricsDonutChart … series={donutSeries} />
        </FlexItem>
        <Flex direction={{ default: 'column' }} flex={{ default: 'flex_2' }} …>
          <Title …>{percentage}% of packages match…</Title>
          <Content …>Includes packages from every detected ecosystem…</Content>
          <LwMetricsCard items={matchCountItems} />
        </Flex>
      </Flex>
    </PageChromeSlot>
  </PageChromeSlots>

  <PageChromeSlots>
    <PageChromeSlot>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} style={{ flex: 1 }}>
        <Title …>Packages by ecosystem</Title>
        <Content …>{inCatalog} of {total} packages…</Content>
        <LwMetricsStackChart … series={stackSeries} />
      </Flex>
    </PageChromeSlot>
  </PageChromeSlots>

  <PageChromeSlots>
    <PageChromeSlot>
      <PageChromeSlotFooter>
        <LwAlert />
      </PageChromeSlotFooter>
    </PageChromeSlot>
  </PageChromeSlots>
</LwPageHeader>

<PageSection …>
  <LwCard><CardBody><PackageCoverageTable … /></CardBody></LwCard>
</PageSection>
```

---

## Sequencing

| Step | Work                                                                                              | Done when                          |
| ---- | ------------------------------------------------------------------------------------------------- | ---------------------------------- |
| L0   | This snapshot + link from family ROADMAP                                                          | Done                               |
| L1   | Unit README + ROADMAP for `LwMetricsDonutChart`                                                   | Done                               |
| L2   | Unit README + ROADMAP for `LwMetricsStackChart`                                                   | Done                               |
| L3   | Implement donut kit unit (resize-observer; config colors)                                         | Done                               |
| L4   | Implement stack kit unit                                                                          | Done                               |
| L5   | **Replace** CoverageReport usage — compose kit pieces + Lens copy/builders; match snapshot layout | Done                               |
| L6   | **Restore** `Lens/components` metrics blocks (+ remove surgery CSS) to HEAD                       | Done                               |
| L7   | Thin-wrap Lens chart hosts on kit (PDF/web); dissolution of unused blocks later                   | Done (thin wrap); dissolution open |

Do **not** start L3 before L1/L2. Do **not** restore (L6) before replace (L5) or the
target layout disappears.

---

## Validation

| Gate      | Check                                                                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Layout    | Snapshot regions present: title row, summary band (donut + copy + metrics card), ecosystem band, alert footer, table in body                                                   |
| Chromatic | Counts/charts use `exact` / `partial` / `none` (or documented config keys) — no new local hex maps                                                                             |
| Grammar   | Metrics assemblies have no Lens report types; page owns builders                                                                                                               |
| Restore   | `git diff HEAD -- Lens/components/CoverageSummaryBlock.tsx EcosystemBreakdownBlock.tsx MatchSummaryStats.tsx` empty (or intentional UNUSED stub only after dissolution policy) |
| Tests     | CoverageReport + new kit unit tests green                                                                                                                                      |

---

## Explicitly out of scope

- Reworking ManifestUploadCard internals as metrics
- Promoting PackageCoverageTable into kit
- Deleting PDF chart entry points in the first extract PR
- Beacon Status Summary (already on `LwMetricsCard` / Count — separate track)
