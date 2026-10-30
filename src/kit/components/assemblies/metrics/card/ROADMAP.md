# LwMetricsCard — roadmap

**Scope:** this unit only — `LwCard` shell, body passthrough.
**Not here:** `LwMetricsCount`, family inventory, stepper.
Link: [`../count/ROADMAP.md`](../count/ROADMAP.md), [`../ROADMAP.md`](../ROADMAP.md).

---

## Job

Generic metrics card: `LwCard` + composable body (`children` / `items`).
Configured once; call sites pass `LwMetricsCount` nodes. Count-row layout lives
in unit CSS — no call-site Flex.

| Priority | Condition  | Behavior     |
| -------- | ---------- | ------------ |
| 1        | `children` | Body content |
| 2        | `items`    | Body content |
| 3        | neither    | Empty body   |

---

## Phases

| Phase | Deliverable                      | Done when  |
| ----- | -------------------------------- | ---------- |
| M0    | README + roadmap                 | Consensus  |
| M1    | Shell + body passthrough         | Unit tests |
| M2    | Barrel; Beacon + Lens call sites | Wired      |

**Progress:** M0–M2 — body is content; layout stays at the call site.
