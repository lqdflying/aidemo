# AI Demo Lab Agent Instructions

These instructions apply to the entire repository and to every coding agent or
CLI, including Cursor, Codex, Claude Code, and similar tools.

## Canonical project rules

Before planning, editing, testing, building, or releasing, read and follow all
applicable files in `.cursor/rules/`. The Cursor rules are the canonical
project instructions even when the current tool does not load them
automatically.

The always-applied rules currently include:

- `.cursor/rules/code-quality.mdc` - architecture, implementation, testing,
  accessibility, and verification standards.
- `.cursor/rules/ui-ux-style.mdc` - visual system, interaction, motion,
  responsive behavior, and UI implementation guardrails.
- `.cursor/rules/release.mdc` - image versioning, validation, Harbor publishing,
  Cosign signing, vulnerability scanning, and GA controls.

Also discover any future `.cursor/rules/*.mdc` files. Apply a rule when its
frontmatter has `alwaysApply: true`, or when its `globs` match files in the
current task.

## Precedence and conflicts

Follow system and user instructions first, then the nearest `AGENTS.md`, then
the applicable `.cursor/rules` files. A nested `AGENTS.md` may add or override
instructions for its subtree.

If project rules conflict, use the more specific rule. Release operations must
always satisfy `.cursor/rules/release.mdc`; frontend decisions must always
satisfy `.cursor/rules/ui-ux-style.mdc`.

## Working agreement

- Work from the repository root unless a command requires another directory.
- Inspect existing code and current changes before editing; preserve unrelated
  user work.
- Use the scripts and verification commands defined by the applicable rules.
- Do not commit, push, publish, tag, or perform destructive operations unless
  the user explicitly requests them and all relevant gates pass.
- Report what changed, what was verified, and any remaining uncertainty.
