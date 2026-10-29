# AI Assistant Skills

Tool-neutral home for agent skills. Files here are picked up by Cursor and
Claude Code via symlinks in `.cursor/skills/` and `.claude/skills/` — same
pattern as [`docs/rules/`](../rules/README.md), one level up (skills vs.
always-on rules).

## Current Skills

- **[kit/](kit/SKILL.md)**: operating perspective for
  Lightwell UI — return-as-spec, Rule 0, config cascade, three-tier kit,
  assembly completeness. Gated via `.cursor/rules/kit-lightwell-skill-gate.mdc`
  for `src/kit/**`, `src/Pages/Lightwell/**`, `styles/lightwell-*`.
- **tenant-ui-config.yaml** / **tenant-ui-config.example.yaml**: tenant
  binding consumed by `kit` (not itself a skill — kept alongside
  so the skill's relative references resolve identically regardless of which
  symlink a tool followed in).

## Adding a New Skill

1. Create `docs/skills/skill-name/SKILL.md` (+ any supporting files) with
   `name` + `description` frontmatter.
2. Create symlinks:
   ```bash
   ln -s ../../docs/skills/skill-name .cursor/skills/skill-name
   ln -s ../../docs/skills/skill-name .claude/skills/skill-name
   ```
3. Update the "Current Skills" list above.

Keep every cross-reference inside a skill **relative** (`../foo.md`, not
`.cursor/skills/foo.md`) — the symlink preserves directory depth, so relative
links resolve the same whether the reader entered through `docs/skills/`,
`.cursor/skills/`, or `.claude/skills/`. Only in-repo documentation that
points *at* a skill from outside it (READMEs, ROADMAPs, rule gates) may use
either path; the canonical one is `docs/skills/...`.

## Why not inline into always-on instructions (AGENTS.md / CLAUDE.md)?

Skills here are long (progressive-disclosure documents, not quick rules) and
only relevant when touching specific paths. Tools without on-demand skill
loading (e.g. VS Code/Copilot via `.github/instructions/*.instructions.md`)
should get a short `applyTo`-scoped pointer at the matching skill file, not
the skill's full body inlined into a context that's always loaded.
