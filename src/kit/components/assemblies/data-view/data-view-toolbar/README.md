# LwDataViewToolbar

> **Status:** implemented (first cut — filters/actions/pagination slots only;
> filter primitives like `DataViewTextFilter` are not yet wrapped, call sites
> still compose them directly). Family: [`../ROADMAP.md`](../ROADMAP.md).
> Unit roadmap: [`ROADMAP.md`](./ROADMAP.md).

## Why it exists

Thin `DataViewToolbar` wrapper that bakes in a known PatternFly layout fix for
top pagination so every caller gets it for free, instead of each page
reimplementing the workaround independently.

## What it can do

| Capability        | Notes                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filters / actions | Pass through to `DataViewToolbar`'s own `filters` / `actions` props                                                                                |
| Pagination        | Rendered via an end-aligned `ToolbarItem`, not `DataViewToolbar`'s `pagination` prop — fixes a PF alignment bug (see [`ROADMAP.md`](./ROADMAP.md)) |
| Everything else   | Any other `DataViewToolbar` prop (`bulkSelect`, `toggleGroup`, `clearAllFilters`, …) passes straight through                                       |

## How it works

- **Tier:** assembly under `assemblies/data-view/data-view-toolbar/`
- **Host:** `@patternfly/react-data-view`'s `DataViewToolbar`
- Generalizes the pagination-alignment fix already applied ad hoc in
  `ContentListTable.tsx` and `PackagesTableWithToolbars.tsx` (commit `9bdb20c`)

## API

```tsx
import { LwDataViewToolbar } from 'kit/components/assemblies';

<LwDataViewToolbar
  filters={<SearchInput ... />}
  actions={<Button onClick={...}>Manage columns</Button>}
  pagination={<Pagination {...paginationProps} isCompact />}
/>
```

| Prop                   | Role                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `filters?`             | Filter controls, rendered first                                                                                                                    |
| `actions?`             | Non-filter actions, rendered between filters and pagination                                                                                        |
| `pagination?`          | Pagination control, rendered end-aligned via the PF workaround                                                                                     |
| `paginationItemProps?` | Extra props for the pagination `ToolbarItem` (e.g. `visibility` to hide top pagination on small screens); `variant`/`align` are owned by this unit |
| ...rest                | Forwarded to `DataViewToolbar` (minus its own `pagination` prop)                                                                                   |

## Out of scope

Table rendering (`../data-view.tsx`), filter primitive components
(`DataViewTextFilter` / `DataViewCheckboxFilter` / etc. — call sites compose
these directly for now), canonical filter ordering across call sites (open
question, see [`ROADMAP.md`](./ROADMAP.md)).
