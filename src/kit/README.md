# Lightwell kit (`src/kit`)

Reusable `Lw*` units for the Lightwell app. Existing pages import from here; do not
rewrite page-local copies in place. When migration is complete, contents dissolve
into `src/` via `git mv`.

## Structure

```
src/kit/
  assets/                             Shared kit artwork (logos, backgrounds)
  components/
    primitives/                       Base units — one PF host + Lightwell config
                                      (LwButton, LwCard, LwMenu, LwPopover, …)
    assemblies/                       Multi-region slots; use primitives
      page/                           Page-family assembly
        page.config.css               Page presentational defaults (spacers, type)
        page-header/                  One header — plain or hero surface
        page-chrome-slots             PageTitleStack + PageChromeSlots / PageChromeSlot / PageChromeSlotFooter
      metrics/                        Metrics family (stepper, count, card, stat-item, charts, …)
        ROADMAP.md                    Family inventory / shared config / sequencing
        stepper/                      LwMetricsStepper (README + unit roadmap first)
        stat-item/                    LwStatItem (compact value + label)
      data-view/                      List/collection table surfaces (toolbar + table)
        ROADMAP.md                    Family inventory / shared config / sequencing
        data-view.tsx                 LwDataView (flat at family root — see ROADMAP § rehome)
        data-view-toolbar/            LwDataViewToolbar (README + unit roadmap)
      …                               (LwButtonGroup, …)
    components.config.ts              Prop / behavior defaults for both tiers
    components.config.css             Domain presentational baseline
  docs/
    patternfly-gaps.md                Intentional PF gap fills
  lightwell.config.ts                 Tenant root config — cascade top
```

Assemblies require **README + roadmap before code** (family + unit roadmaps must
not overlap). See `.cursor/skills/kit`.

## Importing

```ts
// Kit assemblies (barrel)
import {
  LwPageHeader,
  PageChromeSlot,
  PageChromeSlotFooter,
  PageChromeSlots,
  PageTitleStack,
  LwStatItem,
  LwDataView,
  LwDataViewToolbar,
} from 'kit/components/assemblies';

// Kit primitives (barrel)
import { LwButton, LwCard, LwMenu, LwPopover } from 'kit/components/primitives';

// Config utilities
import { mergeComponentProps } from 'kit/components/components.config';
```

## Config cascade

**Prop / behavior (TypeScript):**

```
src/kit/lightwell.config.ts           ← tenant identity (cssPrefix, exportPrefix, brand tokens)
  └── components/components.config.ts ← prop defaults (mergeComponentProps)
        └── Lw* roots                 ← mergeComponentProps; call-site wins; className/style merge
```

**Presentational (CSS) — no YAML:**

```
components/components.config.css      ← domain baseline (generic padding, font-size, …)
  └── assemblies/page/page.config.css ← page-family overrides (header/hero spacers)
        └── unit co-located *.css     ← unit-only rules
```

## Logic passthrough

Each `Lw*` is a logic harness:

1. **children / content** → passthrough (caller owns interior)
2. **owned slot args** → harness builds interior
3. **neither** → minimal shell / empty state

One job per assembly. `LwPageHeader` is one assembly — `hero` is surface pre-config
(PF Hero host + two classes), same children / slot grammar. Compose chrome with
`PageChromeSlots` / `PageChromeSlot` / `PageChromeSlotFooter`; do not invent region props.

## Tier rules

| Tier          | Building rule                  | Promotion trigger                           |
| ------------- | ------------------------------ | ------------------------------------------- |
| **Primitive** | One PF host, configured once   | Grows a slot contract → promote to assembly |
| **Assembly**  | Slot contract; uses primitives | Kit-level, product-agnostic                 |

**Domain wiring** (Beacon table, column catalogs, pipeline views) stays with the
product until it earns extraction. It is not an assembly in `src/kit/`.

## Dissolution path

When all reusable components are extracted:

```bash
git mv src/kit/components/primitives/* src/components/primitives/
git mv src/kit/components/assemblies/* src/components/assemblies/
git mv src/kit/lightwell.config.ts src/lightwell.config.ts
# update barrel imports; remove src/kit/
```

## PatternFly gaps

Intentional fills for missing PF APIs (e.g. MenuToggle `size="lg"`) are tracked in
[`docs/patternfly-gaps.md`](docs/patternfly-gaps.md). Remove a fill when upstream ships it.

## Skills

`.cursor/skills/kit` — operating perspective, Rule 0, config cascade,
logic passthrough, page-header (hero surface), naming conventions.
