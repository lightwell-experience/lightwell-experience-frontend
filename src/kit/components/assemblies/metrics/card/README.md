# LwMetricsCard

> **Status:** implemented. Unit: [`ROADMAP.md`](./ROADMAP.md) · Family: [`../ROADMAP.md`](../ROADMAP.md)

## Why it exists

Configurable metrics card shell — `LwCard` + composable body. Capability once;
call sites compose content and layout.

## API

```tsx
<LwMetricsCard
  hasHeader='Status Summary'
  hasAction={<Help />}
  items={[
    <LwMetricsCount key='total' value={26} label='Total' />,
    <LwMetricsCount key='critical' value={5} label='Critical' color='red' />,
  ]}
/>
```

| Prop                      | Role                                           |
| ------------------------- | ---------------------------------------------- |
| `hasHeader` / `hasAction` | → `LwCard`                                     |
| `children?`               | Body content (wins over `items`)               |
| `items?`                  | `LwMetricsCount` nodes when `children` omitted |

Counts always render inside `CardBody`. Count-row layout is owned by
`metrics-card.css` — pass `LwMetricsCount` via `items` / children; do not wrap
them in a call-site `Flex`.

Keep the card (and header) mounted while metrics hydrate — compose `LwLoaded` in
the body with a PF text-skeleton `fallback` that mirrors the count columns. Do
not swap the whole chrome slot for a bare height slab (collapses the second
page-chrome slot and reads as a solid block).

Card CSS floors `min-width` with `--lw-space--metrics-card-min-inline` (metrics
scale — smaller than prose `--lw-base-min-width`).

## Related

- Count: [`../count/README.md`](../count/README.md)
- Loaded: [`../../loaded/README.md`](../../loaded/README.md)
- Primitive: `LwCard`
