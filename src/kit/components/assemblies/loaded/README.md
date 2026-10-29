# LwLoaded

> **Status:** implemented — loading / loaded surface pre-config.

## Why it exists

Surrounding chrome (card header, page chrome slots) must stay mounted while body
content hydrates. Swapping the whole region for a bare skeleton collapses flex
slots (`min-width: 0`) and jumps the page header.

`LwLoaded` is the **loading surface pre-config**: PatternFly `Skeleton` (via
`LwSkeleton`) when `!isLoaded`; children when loaded (no extra host — Rule 0).

## PatternFly loading shape

Default loading surface is a **PF text Skeleton** (`fontSize`, no fixed `height`
slab). A large `height` + full width reads as a solid block — not the PF shimmer
line demos use in cards.

When you know the loaded structure (PF guideline), pass `fallback` that mirrors
it — e.g. Beacon status summary uses two `3xl` + `sm` skeletons like
`LwMetricsCount` columns.

## API

```tsx
<LwMetricsCard hasHeader='Status Summary' hasAction={…}>
  <LwLoaded
    isLoaded={!isLoading}
    fallback={
      <Flex justifyContent={{ default: 'justifyContentCenter' }} gap={{ default: 'gapLg' }}>
        {/* PF text skeletons matching count columns */}
      </Flex>
    }
  >
    <Flex>…metrics…</Flex>
  </LwLoaded>
</LwMetricsCard>
```

| Prop        | Role                                                   |
| ----------- | ------------------------------------------------------ |
| `isLoaded?` | `false` → loading surface; `true` → children           |
| `fallback?` | Override default PF text `LwSkeleton`                  |
| `children?` | Loaded body                                            |
| host attrs  | Apply only while loading (`aria-busy`, `className`, …) |

## Defaults (`componentsConfig.loaded`)

| Key                | Default   |
| ------------------ | --------- |
| `fontSize`         | `md`      |
| `screenreaderText` | `Loading` |

## Related

- `LwSkeleton` / PF `Skeleton`
- `LwMetricsCard` (typical chrome that stays mounted)
