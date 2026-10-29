# Scaffold & Outline — Examples

Companion to [perspective.md](perspective.md) (why) and [SKILL.md](SKILL.md) (how).

**Saved plans / maps:**
- [examples/beacon-header-kit-roots.md](examples/beacon-header-kit-roots.md) —
  Beacon page-header red flags → kit roots
- [examples/dissolution-map.md](examples/dissolution-map.md) — non-destructive
  migrate-then-dissolve inventory (unused shells kept until a litter sweep)

## Perspective

**Operating question:** "Am I configuring a harness, or re-building PF?"

If the latter, you are outside the perspective — see
[perspective.md § When you are outside](perspective.md#when-you-are-outside-the-perspective).

Demo proof page — each layer pays once:

| Layer | Pays once | Demo instance |
| ----- | --------- | ------------- |
| PF table shell | One harness | `LwDataView` (scroll, toolbar, manage columns, pagination) |
| Demo wiring | One config | `DemoVulnerabilityDataView` + `data-view-config.ts` |
| Domain columns | One catalog + row builder | `VULNERABILITY_COLUMN_CATALOG`, `buildVulnerabilityRows` |
| Page | Outline only | `Demo.tsx` — customer select + conditional table slot |

**Wrong perspective:** `Demo.tsx` inlines `DataView` + `ColumnManagementModal` +
sticky CSS because "it's just the demo." That demo becomes the tax every
production page pays later.

**Right perspective:** demo proves the same stack production will use — page/domain
→ kit assembly → primitive/PF. Demo-only files hold **demo config** (ouia ids,
storage keys), not a second PF integration.

**Logic passthrough (page chrome):**

```tsx
// Slot build — harness owns title stack
<LwPageHeader title="Beacon" description="…" actions={<ExportMenu />} />
// Domain ExportMenu stays page-local until a migration pass; kit LwMenu is ready when rewired.
// See "Extract trace — Beacon ExportMenu"

// Passthrough — caller owns interior
<LwPageHeader hero isGlass>
  <CustomChrome />
</LwPageHeader>

// Hero surface pre-config on the one page header
<LwPageHeader hero title="…" />
```

Shared padding from `assemblies/page/page.config.css`. Prop defaults
(`isGlass`, …) from `components.config.ts`.

### Base support CSS (not exotic selectors)

**Base support** — states the contract; easy to read, easy to debug:

```css
.lw-c-page-header {
  padding-inline: var(--lw-space--page-inline);
  padding-block: var(--lw-space--page-block);
}

.lw-c-page-header.lw-c-page-hero {
  flex: 1 1 auto;

  .pf-v6-c-hero__body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--lw-space--page-chrome-gap);
  }
}

.lw-c-page-header-chrome-slots {
  flex: 1;
  align-items: start;
}
```

**Exotic anti-pattern** — situational policy in combinators (fragile, contextual,
unnecessary, overly complex, noise; confuses concepts):

```css
/* ❌ Infer layout from sibling count / DOM order */
.lw-c-page-header.lw-c-page-hero
  .pf-v6-c-hero__body:has(> .lw-c-page-header-chrome-slots:nth-child(2))
  > .lw-c-page-header-chrome-slots:first-child {
  flex: 1 1 auto;
  align-items: start;
}

.lw-c-page-header.lw-c-page-hero .lw-c-page-header-chrome-slot:last-child:not(:only-child) {
  align-self: start;
  align-items: center;
}
```

When a variant earns a name, use an explicit class or prop — do not hide it in
`:has` / `:nth-child` stacks. See
[perspective.md § Base support](perspective.md#base-support-not-exotic-selectors).

**Semantic map (future `LwLabel` primitive):**

```tsx
// components.config.ts or LwLabel primitive — once
const severityToLabel = {
  critical: { color: 'red', … },
  payAttention: { color: 'orange', … },
};

// domain / page — many times, zero PF tokens
<LwLabel severity="payAttention">{text}</LwLabel>
```

PF v7 renames `color` → callers unchanged; primitive updated once.

---

## Lightwell Demo

Proof page stack (page/domain → kit assembly → PF):

```
Demo.tsx                    ← async outline only
        ↓
TableVulnerabilities        ← domain: body states + pagination props
        ↓
DemoVulnerabilityDataView   ← demo config (ouia, manageColumns, sticky)
        ↓
LwDataView                  ← kit assembly: columnCatalog + manageColumns + PF
```

**Page outline** (`Demo.tsx`) — customer select + one conditional slot for the table:

```tsx
{selectedCustomerId && !isLoading ? (
  <TableVulnerabilities data={…} pagination={…} />
) : !selectedCustomerId && !isLoadingCustomers ? (
  <EmptyState … />
) : (
  <LoadingSkeleton />
)}
```

**Domain wiring** owns empty/error chrome; **does not** fetch:

```tsx
export function TableVulnerabilities({ data, isLoading, isError, … }) {
  const bodyStates = useMemo(() => ({ empty: <LwEmptyState …>, error: <LwErrorState …> }), […]);
  return (
    <DemoVulnerabilityDataView
      vulnerabilities={data?.vulnerabilities ?? []}
      activeState={…}
      bodyStates={bodyStates}
      pagination={{ …pagination, itemCount }}
    />
  );
}
```

**Domain catalog** (shared utils, not page JSX):

```tsx
export const VULNERABILITY_COLUMN_CATALOG: LwDataViewColumnCatalogItem[] = […];
export function buildVulnerabilityRows(vulnerabilities: Vulnerability[]): LwDataViewKeyedRow[] { … }
```

---

## Return-as-spec

```tsx
// Good — structure visible
return (
  <>
    <Title headingLevel="h2" id="overview-title">{title}</Title>
    {introBody}
    {hasReadme ? <ReadmeRenderer html={rest} /> : (
      <>
        <section aria-labelledby="detail-a">…</section>
        <section aria-labelledby="detail-b">…</section>
      </>
    )}
  </>
);

// Bad — structure hidden
introContent = <div>…</div>;
tailContent = hasReadme ? <ReadmeRenderer /> : <></>;
return <Flex>{introContent}{card}{tailContent}</Flex>;
```

---

## File placement

```
# Bad
features/container-entry/          # fake layer
container-details-panel.tsx        # shell stem on section
assemblies/page-header/            # Hero + plain chrome in one God unit

# Good
src/kit/components/primitives/label/label.tsx
src/kit/components/assemblies/page/
  page.config.css                  # page spacers / type (CSS, not YAML)
  page-header/                     # plain chrome — kit invention
src/kit/components/components.config.ts    # prop defaults
src/kit/components/components.config.css   # domain presentational baseline
# domain wiring — stays with product, not in src/kit/
src/Pages/Lightwell/Beacon/components/pipeline-view.tsx
```

---

## Anti-patterns (extended)

| Anti-pattern | Fix |
| ------------ | --- |
| Chrome title + document `h2` same string | Header null or one outline owns title |
| Per-tab Spinner dialect | Shared status primitive |
| `catalog-browse-toolbar` (type last) | `toolbar/toolbar.tsx` |
| `HbCardCatalog` usage-named kit | `HbCard` + page `ImageCard` |
| Hand-copied PF `color` unions | `Pick<LabelProps, …>` + app-only fields |
| One-call-site table extraction | Table scaffolding stays in domain/return |
| JS mount section trees on click | Scaffold mounted with surface; hydrate values only |
| Domain wiring labeled "assembly" in kit | Keep with product until extracted |
| Second assembly for Hero | One `LwPageHeader` + `hero` surface |
| Spacers in YAML or TS prop config | `page.config.css` / `components.config.css` |
| Exotic situational selectors for chrome layout | Base-support rules; explicit class/prop for variants |
| `@media (min-width: 1200px)` / CSS var in a media query | Copy rem from `components.config.css` map (`/* xl */` + `75rem`) |
| Beacon `ExportMenu` half-rewritten to `LwMenu` in a chrome migrate | Leave HCC/export shell alone until that feature is migrated; page keeps importing it |
| `LwExportMenu` before a second consumer | Page/domain configures `LwMenu` when export is in scope; promote assembly later |
| Call `LwMenu` an assembly because of `isBusy` / `items` | Still primitive — Lightwell config on one Dropdown |
| Product-named chrome shell (`SlaInfoPopover`, `lightwell-help-btn`) | Compose kit roots at the call site; replace **usages** first; dissolve later ([dissolution map](examples/dissolution-map.md)) |
| Raw PF `EmptyState` / `Skeleton` / `Tooltip` in Lightwell chrome | `LwEmptyState` / `LwSkeleton` / `LwTooltip` (root harness) |
| Per-page circle help button dialect | `LwTooltip` default trigger = `LwButton isCircle`; richer = `LwPopover` + circle `LwButton` |

---

## Extract trace — Beacon header → kit roots

Full plan (working copy): [examples/beacon-header-kit-roots.md](examples/beacon-header-kit-roots.md).

**Problem:** Beacon page header mixed kit chrome with product-named shells and raw PF
(`SlaInfoPopover` + `lightwell-help-btn`, raw `EmptyState` / `Skeleton`).

**Fix:**

| Was | Now |
| --- | --- |
| `SlaInfoPopover` usage | Call-site `LwPopover` + `LwButton isCircle` (Beacon owns SLA copy) |
| Short icon-help | `LwTooltip` (default trigger = circle plain `LwButton`) |
| Raw `EmptyState` / `Skeleton` | Root-only `LwEmptyState` / `LwSkeleton` |
| `CustomerIdSelect` (no special behavior) | Page composes `LwMenu` + `LwSkeleton` + fetch; leave `CustomerIdSelect.tsx` untouched |

**Do not:** promote `SlaInfoPopover` into kit, or rewrite unused domain files in the
migrate PR. Replace usages on the page; inventory leftovers for the
[dissolution sweep](examples/dissolution-map.md).

---

## Dissolution map (non-destructive migration)

Full write-up: [examples/dissolution-map.md](examples/dissolution-map.md).

**Migrate PR** = prove kit roots by rewiring **pages** (and kit); unused domain shells
stay on disk **unchanged**. **Dissolve PR** = delete only mapped leftovers so reviewers
see pure dead-code removal (organization / consistency), not a mixed rewrite+delete.

---

## Extract trace — Beacon ExportMenu → `LwMenu` (primitive)

**Problem:** `Pages/Lightwell/Beacon/components/ExportMenu.tsx` mixed (1) PF
Dropdown / MenuToggle / busy lock chrome with (2) Beacon fetch, PDF chrome,
CSV/JSON, notifications.

**Tier — why primitive, not assembly:**

| # | Criterion | `LwMenu` |
| - | --------- | -------- |
| A | Single unit | One host: PF `Dropdown` |
| B | Not a special composition | Standard toggle + menu presentation |
| C | PF-shaped | Same job as PatternFly Dropdown |

Lightwell-owned props (`label`, `isBusy`, `items`, …) **configure** that base unit.
Kit invention does not promote to assembly. Assembly would be multi-region chrome
or composing other `Lw*` (e.g. a future `LwExportMenu` that wraps `LwMenu`).

**CHECK FIRST:**

| Question | Answer |
| -------- | ------ |
| Does a harness exist? | No `LwMenu` yet — Dropdown tax paid in the page |
| What is reusable? | Open/close, toggle, items, `isBusy` lock + spinner |
| What stays domain? | `getVulnerabilities`, `buildBeaconPdfPayload`, filenames, notify |
| Promote `LwExportMenu` now? | No — one consumer; middle layer would be empty ceremony |

**Stack after extract (kit ready; domain rewire optional):**

```
Beacon ExportMenu (domain)     ← may still own PF Dropdown until a migration pass
        ↓ (when rewired) label, isBusy, items[{ id, children, onSelect }]
LwMenu (primitive)             ← PF Dropdown + Lightwell config once
        ↓
PF Dropdown / MenuToggle / DropdownList
```

Do **not** rewire page-specific Beacon shells (`ExportMenu`, `SlaInfoPopover`) in the
same pass as landing the primitive — leave pre-existing domain files untouched;
call sites migrate later.

**Return-as-spec (domain shell):**

```tsx
return (
  <LwMenu
    label="Export"
    busyLabel="Exporting"
    isBusy={isExporting}
    isDisabled={!customerId}
    toggleProps={{ variant: 'secondary', ouiaId: 'lightwell-beacon-export-toggle' }}
    items={[
      { id: 'csv', children: 'Export as CSV', onSelect: () => void handleExport('csv') },
      { id: 'json', children: 'Export as JSON', onSelect: () => void handleExport('json') },
      { id: 'pdf', children: 'Export as PDF', onSelect: () => void handleExport('pdf') },
    ]}
  />
);
```

**Interior cascade on `LwMenu`:** `children` passthrough wins; else `items`
build; else empty menu shell. Explicit PF `toggle` wins over harness-built
toggle from `label` / busy props. Pure MenuToggle knobs go in `toggleProps`
(not renamed `toggleVariant` / `toggleOuiaId`).

**Do not kit-ify:** `fetchAllFilteredVulnerabilities`, PDF payload builders, or
chrome `requestPdf` — that fails promotion (domain, not base-unit config).

**When to add `LwExportMenu`:** a second product surface needs the same Export
busy/format UX defaults — that assembly would **consume** primitive `LwMenu`.
Until then, domain configures `LwMenu` directly.

---

## FlexItem before/after — LwMetricsCount

**Problem:** `LwMetricsCount` used PF `Flex` as the assembly host with two levels of
nested `Flex` + three `FlexItem` wrappers. None of the `FlexItem`s carried per-child
overrides. Layout intent was encoded in JSX props scattered across component args —
not in CSS.

### Before (dead weight)

```tsx
// host: PF Flex — direction, alignItems, gap as JSX props
<Flex
  direction={{ default: isColumn ? 'column' : 'row' }}
  alignItems={{ default: isColumn ? 'alignItemsCenter' : 'alignItemsBaseline' }}
  gap={{ default: isColumn ? 'gapSm' : 'gapMd' }}
>
  {/* inner group: value + bar stacked — another Flex */}
  <Flex
    direction={{ default: 'column' }}
    alignItems={{ default: isColumn ? 'alignItemsCenter' : 'alignItemsFlexStart' }}
    gap={{ default: 'gapXs' }}
  >
    <FlexItem>                              {/* no per-child override */}
      <Title headingLevel='h4' size='3xl'>{value}</Title>
    </FlexItem>
    <FlexItem>                              {/* no per-child override */}
      <span className='lw-c-metrics-count__bar' aria-hidden='true' />
    </FlexItem>
  </Flex>
  <FlexItem>                                {/* no per-child override */}
    <Content>
      <Flex gap={{ default: 'gapXs' }} alignItems={{ default: 'alignItemsCenter' }}>
        <FlexItem>{label}</FlexItem>        {/* no per-child override */}
        <FlexItem><LwTooltip>…</LwTooltip></FlexItem>  {/* no per-child override */}
      </Flex>
    </Content>
  </FlexItem>
</Flex>
```

**DOM cost per render:** 2 `Flex` hosts + 5 `FlexItem` hosts = 7 extra nodes.
Each PF component generates modifier classes (`pf-m-flex-1`, `pf-m-align-items-center`,
`pf-m-gap-sm`, …). The UA evaluates those classes on every layout/repaint of that
subtree. Zero `FlexItem`s carried a per-child override — every wrapper was pure ceremony.

At page scale (a coverage report with 3 `LwMetricsCount` cells): 21 extra nodes.
At product scale (N pages, tables, repeated metric surfaces): hundreds → thousands of
identical modifier-class-carrying nodes. 5–10 CSS lines govern all of them at once.

### After (CSS owns layout)

```tsx
// host: plain div — className + style only
<div
  className={mergeClassNames(
    'lw-c-metrics-count',
    isColumn ? 'lw-m-column' : 'lw-m-row',
    colorToken != null ? 'lw-m-has-bar' : undefined,
    className,
  )}
  style={colorToken != null ? { ...style, '--lw-metrics-count-bar-color': colorToken } : style}
>
  <Title headingLevel='h4' size='3xl' className='lw-c-metrics-count__value'>
    {value}
  </Title>
  {colorToken != null && <span className='lw-c-metrics-count__bar' aria-hidden='true' />}
  <Content component='small' className='lw-c-metrics-count__label'>
    {label}
    {tooltip != null && (
      <LwTooltip content={tooltip} position='bottom'>
        <span className='lw-c-metrics-count__help' tabIndex={0}>
          <OutlinedQuestionCircleIcon />
        </span>
      </LwTooltip>
    )}
  </Content>
</div>
```

```css
/* All layout in one place; governs every instance */
.lw-c-metrics-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--pf-t--global--spacer--sm);
}
.lw-c-metrics-count.lw-m-row {
  flex-direction: row;
  align-items: baseline;
  gap: var(--pf-t--global--spacer--md);
}
.lw-c-metrics-count__label {
  display: inline-flex;
  align-items: center;
  gap: var(--pf-t--global--spacer--xs);
}
```

**DOM cost per render:** 0 extra nodes. Layout intent is in CSS — readable in DevTools,
traceable to one file, patched in one place for every consumer.

### Rule

> `FlexItem` earns its place **only** when a specific child needs a per-child override
> (growth ratio, shrink, individual `align-self`, `flex-basis`). When all children get
> the same wrapper with no per-child props, the wrapper is dead weight — remove it.
> The UA already promotes direct children to flex items. Let CSS on the parent govern
> uniform children.

See [perspective.md § FlexItem](perspective.md#flexitem--earns-its-place-only-with-a-per-child-override).

---

## Refactor workflow

1. Propose scope — no edits
2. Dry-run: relevance, CHECK FIRST, naming, smoke targets
3. Review until consensus
4. `git mv` misnamed files → edit in place
5. Write return outline from design order
6. Lift hydration into allowed slots only
7. Leave `TODO(rehome): …` on wrong-layer code not moved this pass; list migrated-but-kept
   shells on [dissolution-map.md](examples/dissolution-map.md) — do not edit those files
8. Validate: compile, tests, smoke
9. Dissolution (separate pass): delete only mapped unused files / orphan CSS
