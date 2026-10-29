---
name: kit
description: >-
  Operating perspective for Lightwell UI — return-as-spec, Rule 0 (nodes earn
  their place), config cascade (TS props + CSS presentational), base-support
  CSS (refuse exotic situational selectors), logic passthrough, page-header
  (hero surface), three-tier kit (primitive → assembly → page/domain). Use when
  authoring or refactoring JSX, pages, kit assemblies, Lw* primitives,
  data-view, naming, upgrades, semantic maps (severity→color), or when the user
  mentions scaffold, outline, code efficiency, passthrough, page.config, or
  centralized capability. Replaces visible-scaffolding + outline-first-ui.
---

# Scaffold & Outline

This skill is a **perspective** — how to operate, not only what to check.

## MANDATORY: Read before reasoning

**This skill defines the architecture. Existing code is what needs to conform to
it — not the other way around.** Do not analyze existing code first and then check
the skill. Read this file, internalize the perspective, then evaluate code through
this lens. When the skill and existing code disagree, the skill wins.

| Read first | Purpose |
| ---------- | ------- |
| **[perspective.md](perspective.md)** | **Why** — Rule 0, three-tier kit, config cascade, harness vs wrapper |
| This file | **How** — process, CHECK FIRST, authoring, checklist |
| [examples.md](examples.md) | **Traces** — Demo stack, anti-patterns, refactor steps |
| [examples/beacon-header-kit-roots.md](examples/beacon-header-kit-roots.md) | Saved plan — kit roots in chrome (circle help, EmptyState/Skeleton) |
| [examples/dissolution-map.md](examples/dissolution-map.md) | Non-destructive migrate → dissolve inventory |

**Tenant config:** [tenant-ui-config.yaml](../tenant-ui-config.yaml) — if
`exportPrefix` is unset, stop and define it before shared kit work.

**Repo contract:** [src/kit/README.md](../../../src/kit/README.md).

---

## Perspective (summary)

**One principle:** the return is the spec. Structure visible in JSX; data in slots
above.

**Code efficiency:** capability **centralized**, call sites **configure** — not
reimplemented per page. Pay PF integration once in `Lw*` + `components.config.ts`;
pages pass domain names (`payAttention`), not PF tokens (`color="orange"`).

**Three-tier kit** — see [perspective.md](perspective.md#three-tier-kit):

| Tier | Role | Path |
| ---- | ---- | ---- |
| **Primitive** | Base unit — one PF host + Lightwell config | `src/kit/components/primitives/` |
| **Assembly** | Multi-region slots; **uses primitives** | `src/kit/components/assemblies/` |
| **Page / domain** | Product outline + domain wiring | app pages; stays with product until extracted |

Primitive test: (A) single unit (B) standard presentation (C) PF-shaped control.
Lightwell-owned props on that host stay primitive — kit invention ≠ assembly.

**Lightwell chrome uses kit roots** (`LwButton`, `LwMenu`, `LwPopover`, `LwTooltip`,
`LwEmptyState`, `LwSkeleton`, …). Domain owns fetch + copy + item builders — not a
second chrome API named after the first consumer. **Replace usages** of product-named
shells; do not promote the wrapper into kit. Icon-help: `LwTooltip` defaults to
`LwButton` + PF `isCircle`; richer anchored content = `LwPopover` + circle `LwButton`
at the call site. `EmptyState` / `Skeleton`: **root harness only** — Footer/Actions/Body
stay call-site children until ≥2 surfaces need a real kit job.

**Config cascade** — see [perspective.md](perspective.md#config-cascade):

```
lightwell.config.ts                    ← tenant root (brand, cssPrefix, palette)
  └── components.config.ts             ← prop / behavior defaults (mergeComponentProps)
lightwell.config.css                   ← tenant presentational baseline (shared chromatic scales)
  └── components.config.css            ← domain presentational baseline (padding, type)
        └── assemblies/page/page.config.css   ← page-family presentational overrides
              └── Lw* roots            ← merge props; co-located unit CSS
```

**TS = props. CSS = paint/space. No YAML.** Presentational page defaults
(padding, font-size, font-weight, spacers) live in `page.config.css`, not in
`components.config.ts`.

**Rule 0:** wrappers add a node without a job — refused. Logic wrap (`Lw*` function configures
and returns the host) is not a DOM wrap (extra host around PF). `className` / passthrough
apply on the host root, not on kit chrome. Full treatment: [perspective.md](perspective.md#rule-0--nodes-must-earn-their-place).

**Anti-God:** one job per assembly. Page chrome is **one** `LwPageHeader` —
hero is surface pre-config (`hero` → PF Hero host + two classes), not a sibling
assembly and not a second layout API. Shared `page.config.css` spacers. Still
refuse unrelated second jobs on the same assembly. See
[perspective.md](perspective.md#page-family--one-header-hero-is-surface).

**Assembly completeness:** a page configures an assembly with hydration only —
data, flags, domain copy — never presentational logic. If independent pages
reimplement the same workaround for the same assembly, that is proof the
capability belongs in the assembly, not evidence of page-specific need. Finish
the assembly before re-pointing a consumer onto it — re-pointing early
manufactures page-local logic as a side effect, and the next consumer copies
that patch as "the pattern." `LwDataView` will be a whole assembly where pages
hydrate it, or it has failed. Full treatment:
[perspective.md](perspective.md#assembly-completeness--hydrate-dont-implement).

---

## Before you write — questions

1. Does this **node** earn its place? (Rule 0)
2. Does **PF** already own this? (subtract)
3. **Primitive or assembly?** (A/B/C single PF unit vs multi-region / composing `Lw*`)
4. Does a **harness** exist? (configure `Lw*`; do not copy the PF tree)
5. **Domain name or PF token?** (map once in harness)
6. Is this a **second job** on an existing assembly? (split — anti-God)
7. **Prop default or presentational?** (TS config vs CSS config)
8. Is the **return** still the spec? (no hidden sections)
9. **Layout intent known?** (justify / align / gap / direction) — **ask** if the
   user did not state it. Do not assume `spaceAround` / `spaceBetween` / `center`.
10. **Base support or exotic?** Unit CSS states the contract — refuse situational
    `:has` / `:nth-child` policy stacks; prefer an explicit class/prop.
11. **PF layout scope?** Is `Flex` / `FlexItem` / `Grid` being used inside the assembly
    for its own internal arrangement? → plain HTML host + co-located CSS. PF layout
    components are for landmark sections, not internal component structure.

Do **not** promote to assembly only because the primitive adds Lightwell props
(`isBusy`, `items`, semantic maps). That is base-unit configuration.

**PF Flex / layout tokens:** breakpoint props take PF enum strings, not CSS keywords.
`justifyContent={{ default: 'center' }}` is a no-op — use `'justifyContentCenter'`.
Same pattern for `alignItems` (`alignItemsCenter`), `gap` (`gapLg`), etc. Invalid
values apply **no** modifier class; layout silently falls back to the Flex default.

---

## Logic passthrough model (`Lw*`)

Same shape for primitives and assemblies — logic wrap; host as tree root.

**Composition cascade** (one grammar; do not invent per-assembly dialects):

| Priority | Condition | Behavior |
| -------- | --------- | -------- |
| 1 | `children` / `content` provided | **Passthrough** — caller owns interior |
| 2 | Owned slot args (`title`, `has*`, …) | **Slot build** — harness builds interior |
| 3 | Neither | **Minimal shell** — empty / empty-state per contract |

```tsx
// ✅ One page header — plain or hero surface; same slots / children cascade
export function LwPageHeader({ hero, title, description, actions, children, className, ...rest }: Props) {
  const content = children ?? /* title / description / actions slots */;
  if (hero) {
    return (
      <Hero {...mergeComponentProps(heroDefaults, { ...rest, className: mergeClassNames('lw-c-page-header', 'lw-c-page-hero', className) })}>
        {content}
      </Hero>
    );
  }
  return (
    <Flex {...mergeComponentProps(defaults, { ...rest, className: mergeClassNames('lw-c-page-header', className) })}>
      {content}
    </Flex>
  );
}

// ❌ DOM wrap — extra host around PF; className lands on the wrong node
export function LwPageHeader(props) {
  return (
    <div className="lw-c-page-header">
      <Hero {...props} />
    </div>
  );
}

// ❌ Region props that fork the composition grammar
export function LwPageHeader({ hasAside, hasChromeRows, ... }) { /* … */ }
```

| Allowed | Refused |
| ------- | ------- |
| Resolve defaults / map domain → PF props | `<div>` / extra layout host around the PF root |
| Owned slots as **children** of the host | Re-parenting the host under kit chrome |
| Assembly using kit **primitives** in slots | Ceremonial wrappers "for readability" |
| Kit `className` merged onto the host root | Kit styles that assume a wrapper between page and PF |
| Surface pre-config on one grammar (`hero`) | Region props / second assembly that fork the cascade |

Kit root: `src/kit/`. Pages pull; do not rewrite page-local copies in place.

---

## Rule 0 — mechanisms

| Kind | DOM | Verdict |
| ---- | --- | ------- |
| Expedient / inert / ceremonial | +1 node | Refuse |
| Primitive / assembly harness | Same as PF root (logic only) | Write once; callers configure |
| Page / domain | Uses kit | Props and outline only |

**Logic wrap ≠ DOM wrap.** The `Lw*` function may exist; an extra host around the
PF component must not.

**Flex / grid:** wrappers re-parent direct children — wrong flex item, `gap`,
sticky, and `overflow` context.

**Harness once:** one integration per surface type — primitives for single PF units
(with Lightwell-owned config), assemblies for multi-region slots. Upgrades and
semantic maps live in the harness.

---

## Model

| Layer | What it is | Lightwell home |
| ----- | ---------- | -------------- |
| **Scaffolding** | Sections, headings, layout, conditionals, ARIA | Visible in the JSX return |
| **Hydration** | Flags, copy, API data, domain row builders | Above the return; injected as slots |
| **Primitive** | One PF host + Lightwell config / owned props | `components/primitives/` |
| **Assembly** | Multi-region slots; uses primitives | `components/assemblies/` |
| **Page family** | Shared page chrome + presentational config | `assemblies/page/` (`page.config.css`, header, hero) |
| **Page / domain** | Async outline + product wiring | app pages / domain wiring |

> **Data layer** (`api-matrix.ts`, query keys, mock gates) is a **separate effort** —
> not in scope for the current kit work (component reusability and consistency).
> Do not model it here until that effort begins.

**Scaffolding is the spec. Hydration fills slots. Do not invert.**

| Layer owns | Does not own |
| ---------- | ------------ |
| Primitive | single PF host, Lightwell-owned props, maps, defaults | multi-region chrome, other `Lw*` composition, fetch |
| Assembly | multi-region slot grammar, primitives inside | route params, direct `services/*` |
| Page / domain | state, async branches, catalogs (filter values/options) | inline PF config; filter UI, once an assembly owns that capability |

**No `features/` layer.** Domain wiring is not an assembly in kit paths.

---

## Process

```
propose → dry-run → review → consensus → change → validate
```

| Step | Rule |
| ---- | ---- |
| Propose / dry-run | No edits until consensus |
| Change | `git mv` for renames / rehomes; status should show `renamed:` |
| Validate | build + tests + smoke on affected routes |

---

## CHECK FIRST

Before a new file, wrapper, hook, or DTO:

1. **Search** — primitive, assembly, PF, existing helper?
2. **Tier** — base unit → `primitives/`; slot contract → `assemblies/`.
3. **Extend** — props, config, defaults. New file = last resort.
4. **Parent, not wrapper** — `ref` / `className` / `style` on existing host.
5. **Subtract PF** — app-only fields on types.
6. **Relevance** — one sentence; ≥2 consumers or delete.

| Impulse | Move |
| ------- | ---- |
| Loading UI | shared status assembly; conditional in return |
| New table shell | extend kit assembly `LwDataView` |
| New columns | domain catalog + keyed rows; shell owns `manageColumns` |
| `color="orange"` in page | `severity` on `LwLabel`; map in primitive harness |
| Dropdown / MenuToggle tree copied in a page | extract or reuse primitive `LwMenu`; domain keeps handlers |
| Export / kebab / actions menu with product fetch | `LwMenu` + domain shell — do not kit-ify fetch/PDF |
| Lightwell props on one PF host (`isBusy`, `items`) | Stay **primitive** — do not promote for kit invention alone |
| Tenant token / brand value | `lightwell.config.ts` |
| Component/assembly **prop** default | `components/components.config.ts` |
| Domain **presentational** default (padding, type) | `components/components.config.css` |
| Page-family spacer / type | `assemblies/page/page.config.css` or unit `.css` |
| Reach for `spacing.mMd` / `pf-v6-u-*` | Stop — utility classes are last resort; write co-located CSS |
| `Flex` / `FlexItem` / `Grid` inside an assembly's own internal tree | Plain HTML host (`div`, `span`) + co-located CSS — `flex-direction`, `gap`, `align-items` belong in `.css`, not JSX props. PF layout is for landmark sections, not internal component structure. |
| `FlexItem` wrapping a label, icon, or single token inside a custom element | Remove. Inline the child directly; CSS on the parent handles spacing. |
| All `FlexItem` children are identical — no per-child props on any of them | Remove all `FlexItem` wrappers. CSS flex already makes direct children flex items. The container's `gap` / `align-items` / `justify-content` governs them. A `FlexItem` with no per-child override is dead weight. |
| Exotic `:has` / `:nth-child` layout policy | Stop — base-support CSS only; explicit class/prop for variants |
| `@media (min-width: 1200px)` or `var(--pf-t--global--breakpoint--*)` in a query | Copy rem from `components.config.css` comment map (`75rem` = xl) |
| Header needs Hero look | `LwPageHeader hero` — surface pre-config, same grammar |
| Body loading collapses chrome / jumps header | Keep shell mounted; `LwLoaded` in the body (default `LwSkeleton`) |
| Assembly growing a second visual job | split into sibling assemblies (anti-God) |
| Metric / count that could grow large | PF `Truncate` — stacked metrics count **and `LwMetricsStepper` values**: container Truncate + `min-width: 0` on the host (never `maxCharsDisplayed` — it disables width-based truncation); inline title runs only: `maxCharsDisplayed` (`pf-m-fixed`). Never assume digit length |
| Product-named chrome shell (`SlaInfoPopover`, …) | Compose kit roots at call site; replace **usages** — do not promote the wrapper into kit; dissolve later ([dissolution-map](examples/dissolution-map.md)) |
| Short icon-help / circle help dialect | `LwTooltip` (default trigger = `LwButton isCircle`); richer = `LwPopover` + circle `LwButton` |
| Raw PF `EmptyState` / `Skeleton` in Lightwell chrome | Root-only `LwEmptyState` / `LwSkeleton`; Footer/Actions/Body stay call-site children |
| ≥2 independent consumers hand-roll the same workaround for the same assembly | Not page-specific need — convergence is proof; promote the capability into the assembly |
| Re-pointing a consumer onto an assembly before it does what that consumer needs | Finish the assembly first — the re-point should be a near-mechanical diff, not invention |
| New logic needed, and the nearest existing file is a non-Kit component/utility the page already imports | UI capability → Kit; page-specific → the page. Logic genuinely shared across multiple pages/consumers may live in an appropriate product-owned domain module — being in the dependency chain alone doesn't make an existing file fair game, but a real cross-page domain concern isn't forced into Kit or duplicated per page either |

---

## Authoring

### Return-as-spec

Single return. Flags and hydration **above**; structure **below**.

```tsx
return (
  <>
    <LwPageHeader title={staticContent.demoProof.titleText} … />
    {/* or <LwPageHeader hero …> when the page needs PF Hero surface */}
    <PageSection>
      {!isLoadingCustomers ? <DemoCustomerIdSelect … /> : null}
      {selectedCustomerId && !isLoading ? (
        <TableVulnerabilities … />
      ) : !selectedCustomerId && !isLoadingCustomers ? (
        <EmptyState … />
      ) : (
        <LoadingSkeleton />
      )}
    </PageSection>
  </>
);
```

**Forbidden:** `introContent` / `tailContent`; duplicate scaffold across early
returns; click-time structure injection.

### Hydration slots

| Allowed | Forbidden |
| ------- | --------- |
| Flags: `isLoading`, `isEmpty`, `isError` | Whole-section variables |
| Single widgets: `introBody` | `introBlocks` from parsers |
| `error` in visible branch | Scaffold `className` constants (unless ≥2 uses) |

---

## Naming & placement

- Export: `{exportPrefix}{Type}` from tenant config (e.g. `LwPageHeader`, `LwMetricsStepper`)
- Type-first kit files: `page-header/page-header.tsx`
- Page family under `assemblies/page/` — shared `page.config.css` + one header unit
- Name the thing — not the first consumer
- Primitives → `components/primitives/`; assemblies → `components/assemblies/`
- No `-panel` on content files
- Domain page entry: ask singular name (**default `entry`**)

### Page family layout

```
src/kit/components/assemblies/page/
  page.config.css       # presentational config (spacers, type) — not YAML
  page-header/          # one assembly — plain or hero surface
  page-chrome-slots.*   # PageTitleStack + PageChromeSlots / PageChromeSlot / PageChromeSlotFooter
```

### Metrics family layout

```
src/kit/components/assemblies/metrics/
  ROADMAP.md            # family inventory, shared config, sequencing (no unit detail)
  metrics.config.css    # optional family presentational tokens (≥2 units)
  stepper/              # LwMetricsStepper
    README.md           # why / what / how / API
    ROADMAP.md          # unit phases only — zero overlap with family ROADMAP
  card/ donut-chart/ …  # siblings as they earn folders
```

Charts in this family use PatternFly **Resize Observer** (responsive sizing /
wrapping legends). Cite it in chart unit roadmaps; do not redefine per unit.

### Assembly docs (required before code)

**Assemblies** ship documentation **before** implementation. **Primitives** do not
carry this tax.

| Doc | Required | Owns |
| --- | -------- | ---- |
| Family `ROADMAP.md` | When a multi-unit family exists | Inventory, shared config, cross-unit sequencing, conventions |
| Unit `ROADMAP.md` | Every new assembly unit | That unit’s phases, host, API draft, validate surface |
| Unit `README.md` | Every new assembly unit | Why / what / how / API (planned or live) |

**Zero overlap:** family roadmap must not restate unit phases; unit roadmap must
not restate family inventory or sibling unit plans. Link across; do not copy.

**Process:** agree roadmaps (+ README stub) → then `*.tsx` / unit CSS. Non-destructive
product wiring **replaces** call sites later; scaffolding does not delete domain code.

---

## Lw\* & PatternFly

| Rule | Detail |
| ---- | ------ |
| Typing | `OwnedProps & Omit<UpstreamHostProps, 'children'>` (or Partial where optional) |
| Prop defaults | `components.config.ts` → `mergeComponentProps` |
| Presentational defaults | `components.config.css` → `page.config.css` → unit `.css` |
| Kit CSS scope | See **Hidden theme namespace** below — already inside `html.lightwell-v1-theme` |
| Spread | Lw-owned props destructured; `...rest` on host |
| className / style | Merge onto the **host root** — never onto a wrapping element |
| Composition | children passthrough **or** slot build — see logic passthrough model |
| Secondary PF piece | Required by a host render-prop (e.g. Dropdown `toggle` → MenuToggle) stays **inside** the harness — not a twin primitive. Pure PF knobs → props bag (`toggleProps`), not renamed `toggleVariant` twins |

**Logic wrap ≠ DOM wrap.** `LwFoo` configures and returns `<Foo {...}>`. May resolve
defaults, map domain props, hydrate children. Must **not** insert an extra host around the PF root.
When PF has no equivalent (`LwPageHeader`), the kit host still must earn its place (layout job).

**Remap vs passthrough:** remap only when the name earns a domain job (`isBusy` → spinner).
If it is still a PF token, passthrough (`toggleProps={{ variant: 'secondary' }}`) — do not invent
`toggleVariant`.
### Hidden theme namespace (`KitCssScopePlugin`)

Every file under `src/kit/**` is webpack-wrapped in `html.lightwell-v1-theme { … }`
(`fec.config.js` → `KitCssScopePlugin`). Treat that as an **invisible outer namespace**:

| Do | Don't |
| -- | ----- |
| Write rules for the theme root / its descendants | Re-state `.lightwell-v1-theme` or `html.lightwell-v1-theme` in kit CSS |
| Host tokens via `& { --token: … }` (needs a `{` so the plugin wraps) | Bare custom props at file root (invalid CSS; plugin skips brace-free sheets) |
| Dark modifiers as `&.pf-v6-theme-dark` (same node as theme) | Nest `.lightwell-v1-theme { … }` again → descendant selector that matches nothing |
| Unit hosts as `.lw-c-*` | Assume `styles/*.scss` has the same auto-scope (it does **not**) |

Double-nesting is the silent failure mode: emit becomes
`html.lightwell-v1-theme .lightwell-v1-theme …` while the class lives only on `<html>`.

### Layout assemblies (children-only)

Some assemblies exist **only** to arrange call-site children (gap, alignment). They must
stay reusable — **no product-shaped slots**.

| Rule | Detail |
| ---- | ------ |
| API | `children` (+ `className` / host passthrough). Paint in co-located `.css` |
| Forbidden | Domain props (`customerSelect`, `exportMenu`, …) or hard-coded N controls |
| Call site | Pass **N** controls (`LwButton`, `LwMenu`, …) — assembly does not invent them |
| Example | `LwButtonGroup` — row of button-like controls; Beacon wires two `LwMenu`s |

Name the layout job (`ButtonGroup`), not the first consumer (`BeaconControls`).

### Kit CSS (co-located)

| Rule | Detail |
| ---- | ------ |
| Format | Plain `.css` — **not** SCSS for kit surfaces yet; **not** YAML for defaults |
| Layers | Not using CSS cascade layers yet — defer until kit hardens |
| Prefix | `lw-c-*` on the host root |
| Config vs unit | `*.config.css` = shared defaults/tokens; co-located unit CSS = unit-only rules |
| Host first | Prefer PF host when it owns the job (`Hero` → `LwPageHeader hero`); kit invents plain header host when PF has no equivalent |
| Theme | Use host's light/dark API when present (`Hero` → `backgroundSrcLight` / `backgroundSrcDark`); otherwise `&.pf-v6-theme-dark` under the scope wrapper |
| Assets | Under `src/kit/assets/`; Lightwell page background images are owned by insights-chrome |
| **Intrinsic size** | Do **not** set `width: 100%` (or `height: 100%`) unless the layout job is **explicit** — stretch to fill a known containing block. Prefer natural block flow, flex/grid item growth (`flex`, `min-width`), or tokens. Blind `100%` fights parent sizing the same way forced height does, usually with less visible damage but still layout debt. |
| **Utility classes** | **Last resort.** Do not use PF utility classes (`spacing.*`, `pf-v6-u-*`, etc.) casually for layout or polish. Prefer co-located CSS + design tokens (`--pf-t--global--spacer--*`). Utilities only when a one-off cannot earn a kit rule and you have checked first. |
| **Base support** | Unit CSS states the contract: host padding, flex direction, gap, align. Easy to read, easy to debug. See [perspective.md § Base support](perspective.md#base-support-not-exotic-selectors). |
| **No exotic selectors** | Refuse elaborate situational CSS — deep `:has()` / `:nth-child()` / `:first-child` / `:not(:only-child)` stacks that infer layout from sibling count or DOM order. Fragile, contextual, unnecessary, overly complex, noise; confuses concepts. Prefer an explicit class/prop when a variant earns a name. |

**Utility classes = last resort** — not a shortcut for kit spacing. If the same space appears twice, it belongs in CSS (unit or `*.config.css`), not `className={spacing.mMd}`.

**Base support, not exotic** — unit CSS declares what the surface is. Do not encode
“if there are two chrome rows, stretch the first…” in combinators. That is policy
hidden in selectors; make the variant explicit or keep layout dumb.

**PF breakpoints** — kit is plain CSS. PatternFly stores breakpoints as SCSS
(`$pf-v6-global--breakpoint--*`). `@media` cannot use those vars or
`--pf-t--global--breakpoint--*`. Copy the rem from the comment map in
[components.config.css](../../../src/kit/components/components.config.css).
Label the query (`/* xl */`). Do not use `px`. Do not duplicate the map.

Example — one page header, plain or hero surface:

```tsx
<LwPageHeader title="…" description="…" actions={…} />
<LwPageHeader hero title="…" />
<LwPageHeader hero>{/* full composition — caller owns interior */}</LwPageHeader>
```

---

## Anti-patterns → fixes

| Smell | Fix |
| ----- | --- |
| Two returns, same scaffold | One return + conditionals |
| `{tailContent}` | Inline in return |
| Extra `div` for ref/class | Existing PF parent / host |
| `Lw*` wraps PF in kit chrome | Logic only; className on host root |
| Slot assembly in `primitives/` | Rehome to `assemblies/` |
| Base unit in `assemblies/` | Rehome to `primitives/` |
| Domain wiring labeled "assembly" in kit | Keep with product until extracted |
| Page copies `Dropdown` + `MenuToggle` + busy lock | Primitive `LwMenu`; page passes `items` / handlers |
| Split `LwMenuToggle` + assemble with menu | Keep combined `LwMenu`; MenuToggle is a Dropdown slot |
| Renamed PF twins (`toggleVariant`, `toggleOuiaId`) | `toggleProps={{ variant, ouiaId }}` — pure passthrough bag |
| `FormGroup` around a chrome menu toggle | `LwMenu` `fieldLabel` (kit extension) — not form semantics |
| Treat Lightwell-owned props as “assembly” | Still primitive if A/B/C (one PF host) hold; `fieldLabel` may earn a grouping host |
| Layout assembly with product-shaped props | Children passthrough only (`LwButtonGroup`) |
| Kit CSS re-scopes `.lightwell-v1-theme` | Already inside plugin wrapper — write bare / `&` rules |
| Kit assembly that calls `services/*` or chrome PDF | Domain shell — harness has no product fetch |
| Mid-layer `LwExportMenu` with one consumer | Skip until ≥2 surfaces share export UX |
| Tenant token in `components.config.ts` | Move to `lightwell.config.ts` |
| Padding / font-size in `components.config.ts` | Move to `components.config.css` or `page.config.css` |
| Casual PF utility classes (`spacing.*`, `pf-v6-u-*`) | Co-located CSS + tokens; utilities only as last resort |
| PF `Flex` / `FlexItem` as the host of a kit assembly | Plain `div` or PF semantic host + CSS layout — `Flex` is for landmark sections, not custom element hosts |
| Nested `Flex` / `FlexItem` inside an assembly's own tree | Flatten. Each `FlexItem` is a DOM node with no earned job; the UA matches its modifier classes on every repaint. Move direction / gap / align to `.css`. |
| Uniform `FlexItem` wrappers with no per-child props (all children identical) | `FlexItem` earns its place only with a per-child override: growth ratio (`flex: 1`), shrink (`flex-shrink: 0`), individual `align-self`, or `flex-basis`. Same wrapper on every sibling = the CSS rule the UA was already going to run. 5–10 CSS lines govern every instance; N `FlexItem`s scale to hundreds or thousands of modifier-class nodes. See [examples.md § FlexItem before/after](examples.md#flexitem-beforeafter--lwmetricscount) for the `LwMetricsCount` trace. |
| Blind `width: 100%` / `height: 100%` | Only when stretch is an explicit job; else flow / flex / `min-width` |
| Exotic situational selectors (`:has(> …:nth-child)`, `:not(:only-child)` layout policy) | Base-support rules only; explicit class/prop for variants |
| `@media` with `px` or `var(--pf-t--global--breakpoint--*)` | Rem from `components.config.css` header map |
| `page.config.yaml` for spacers | Use `page.config.css` — presentational track |
| Second page-chrome assembly for Hero | One `LwPageHeader`; `hero` surface pre-config |
| PF tokens in pages | Domain name + harness map |
| Demo inlines PF chrome | Use same stack as prod |
| Kit styles in global SCSS / layers early | Co-located `.css` on the `Lw*`; layers later |
| Flex + custom bg when PF Hero fits | `LwPageHeader hero` + `backgroundSrcLight` / `Dark` |
| Rewrite page-local unit in place | New kit under `src/kit`; page pulls |
| Rename Write + Delete | `git mv` |
| tsc green, UI broken | Smoke route |
| Bare metric number in chrome / title | PF `Truncate` — stacked count cell and `LwMetricsStepper` values: container Truncate (width-based; `maxCharsDisplayed` would disable it); single-line title run only: `maxCharsDisplayed` (`pf-m-fixed`) so `inline-grid` does not break the line |
| Page hand-rolls active-state derivation, panel-expand breakpoint state, or raw PF filter wiring the assembly could own | Extend the assembly; delete the page copy. Example: three `LwDataView` consumers each independently called `useTableActiveState` and wired raw PF `DataViewFilters` before `isLoading` derivation and a filter capability existed in the assembly — the fix is in `LwDataView`, not a fourth bespoke copy |
| Consumer re-pointed onto an assembly before the capability it needs exists there | Hold the re-point; finish the assembly first. Re-pointing early is what produced the hand-rolled copies above in the first place |

Extended: [examples.md](examples.md).

---

## Validate

| Gate | Lightwell |
| ---- | --------- |
| Compile | `yarn build` |
| Tests | `yarn test` on touched paths |
| Smoke | `/lightwell/demo-proof` (Demo); prod route for prod work |

Structure review without smoke is incomplete.

---

## Review checklist

- [ ] Read [perspective.md](perspective.md) when changing layers or adding DOM
- [ ] propose → dry-run → review → consensus → change → validate
- [ ] `git mv` for rehomes
- [ ] Correct tier: primitive vs assembly vs page/domain
- [ ] Config cascade: tenant → `lightwell.config.ts`; prop default → `components.config.ts`; presentational → `components.config.css` / `page.config.css`
- [ ] No casual PF utility classes — co-located CSS + tokens first
- [ ] Kit CSS is base support — no exotic situational selector stacks
- [ ] Kit `@media` uses PF rem from `components.config.css` map — not `px`, not CSS vars
- [ ] Anti-God: one visual job per assembly; page header hero is surface pre-config
- [ ] New assembly: family + unit `ROADMAP.md` and unit `README.md` **before** code; zero overlap between family and unit roadmaps
- [ ] No PF `Flex` / `FlexItem` / `Grid` / `GridItem` inside an assembly's own internal tree — plain HTML host + co-located CSS owns internal layout; PF layout is for landmark sections only
- [ ] Logic passthrough: children compose **or** slot args build
- [ ] CHECK FIRST: extended or proved absent
- [ ] Return readable without sibling files
- [ ] Hydration = flags + slots only
- [ ] Passthrough harness: logic wrap only; `className` on host root
- [ ] PF subtract; kit under `src/kit`; pages pull
- [ ] Layout intent asked when unspecified — do not assume justify/align
- [ ] PF Flex tokens are enum strings (`justifyContentCenter`), not CSS keywords
- [ ] Smoke on touched routes
- [ ] Assembly complete for what this page needs — or is the page compensating for a gap?
- [ ] If ≥2 consumers hand-roll the same workaround, promote it before re-pointing more consumers
- [ ] New logic lands in Kit or the page only — never a pre-existing non-Kit file, even one already imported

---

## Documentation map

| Doc | Role |
| --- | ---- |
| [perspective.md](perspective.md) | Operating lens (canonical **why**) |
| [examples.md](examples.md) | Code traces |
| [examples/beacon-header-kit-roots.md](examples/beacon-header-kit-roots.md) | Saved plan — Beacon header → kit roots |
| [examples/dissolution-map.md](examples/dissolution-map.md) | Non-destructive migrate → dissolve inventory |
| [ARCHITECTURE.md § Lightwell](../../../ARCHITECTURE.md#lightwell-components) | Repo contract |
| [src/kit/README.md](../../../src/kit/README.md) | Kit structure + cascade |
| [src/kit/components/primitives](../../../src/kit/components/primitives) | Kit primitives |
| [src/kit/components/assemblies](../../../src/kit/components/assemblies) | Kit assemblies |
| [components.config.css](../../../src/kit/components/components.config.css) | Domain presentational baseline + PF breakpoint rem map (comment) |
| [assemblies/page/page.config.css](../../../src/kit/components/assemblies/page/page.config.css) | Page-family presentational config |
| [assemblies/metrics/ROADMAP.md](../../../src/kit/components/assemblies/metrics/ROADMAP.md) | Metrics family roadmap (shared config / sequencing) |
| [assemblies/loaded/](../../../src/kit/components/assemblies/loaded) | `LwLoaded` — loading surface pre-config (keep chrome mounted) |
| [assemblies/metrics/stat-item/](../../../src/kit/components/assemblies/metrics/stat-item) | `LwStatItem` README (metrics family; not a primitive) |
| [assemblies/metrics/stepper/](../../../src/kit/components/assemblies/metrics/stepper) | `LwMetricsStepper` README + unit roadmap |
| [assemblies/data-view/](../../../src/kit/components/assemblies/data-view) | `LwDataView` family — ROADMAP + table/toolbar README, unit roadmaps |
