# PatternFly gaps

Lightwell kit fills that close gaps in PatternFly React / CSS until upstream
ships them. Prefer removing a fill when PF adds the equivalent.

| Gap                            | PF today                                                                                                 | Kit fill                                                                                                                                                             | Remove when                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| MenuToggle `size="lg"`         | `size?: 'default' \| 'sm'` only. Button has `'lg'` → `pf-m-display-lg`.                                  | `LwMenu` `toggleProps.size: 'lg'` applies `pf-m-display-lg` on MenuToggle; padding + bold weight in `menu.css` (Button size mechanism; accent color remaps omitted). | PF MenuToggle accepts `size="lg"` and ships matching CSS.             |
| ProgressStepper `isHorizontal` | CSS ships `pf-m-horizontal`; React only has `isVertical`. Default layout is vertical below md (`48rem`). | `LwMetricsStepper` owned `isHorizontal` applies `pf-m-horizontal` (config default `true`).                                                                           | PF ProgressStepper accepts `isHorizontal` (or always-horizontal API). |

## Conventions

- Track every intentional PF gap fill here when it lands in the kit.
- Prefer PF-identical class names (`pf-m-display-lg`) when mirroring an existing PF modifier on a sibling component.
- Do not invent renamed twins (`toggleSize`) — pass PF tokens through passthrough bags (`toggleProps`).
- Kit CSS for gap fills lives co-located on the owning `Lw*` unit.
