# Data View toolbar unit — roadmap

**Scope of this file:** this unit only — filter composition, pagination
placement, and implementation phases for the data-view toolbar.

**Not in this file:** family inventory, shared active-state/empty-state config,
the table unit, or other data-view units. Those live in
[`../ROADMAP.md`](../ROADMAP.md).

**Status:** implemented — `LwDataViewToolbar` (`data-view-toolbar.tsx`) and
[`README.md`](./README.md) are both live. Open questions below are follow-ups,
not implementation blockers.

---

## Job

Plug-and-play **toolbar composition** over PatternFly's `DataViewToolbar`:
filters (text / checkbox / tree, as needed per call site) + pagination. The unit
does not know Beacon/Lens/Repositories fetch or domain filter options — call
sites pass filter config and pagination state.

**Host:** `@patternfly/react-data-view`'s `DataViewToolbar` (+ `DataViewFilters`
family) — logic/composition harness, not a from-scratch toolbar.

**Generalizes from (read before implementing, don't reinvent):**

- `src/Pages/Lightwell/Lens/components/PackageCoverageTable.tsx` — Lightwell's
  existing usage (`DataViewToolbar` + `DataViewTextFilter` +
  `DataViewCheckboxFilter`), including a second bare `DataViewToolbar` just for
  bottom pagination.

---

## Known issue to carry forward

Commit `9bdb20c` ("align toolbar with top pagination for all uses of PF
DataView component — can revert after patternfly fixes this issue") patches a
PF layout bug in both `ContentListTable.tsx` and `PackagesTableWithToolbars.tsx`.
This unit must bake that same fix in, or Beacon/Lens will visually regress on
day one versus their current (or existing) DataView tables. Revert this unit's
copy once PatternFly fixes the underlying issue upstream and remove the
workaround from the two existing call sites in the same pass.

---

## Open questions (follow-up, not blocking)

~~Export name~~ — resolved: `LwDataViewToolbar`.

1. Canonical filter/search-input order (family `ROADMAP.md` calls for "one
   documented default order") — still undecided across Beacon/Lens/Repositories/
   Packages, which each use a different order today. See family `ROADMAP.md`.
2. Which filter primitives (`DataViewTextFilter` / `DataViewCheckboxFilter` /
   `DataViewTreeFilter`) the unit exposes directly vs. which stay call-site
   composition.

---

## Explicitly out of scope

- Table rendering, `DataView` root, active-state wiring — `../data-view.tsx`
- Sticky columns, column management — `../data-view.tsx` (Beacon's requirement)
- Domain filter option lists (statuses, severities, etc.) — product call sites
