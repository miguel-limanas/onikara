# PM Brain — Onikara

A markdown-native second brain for Onikara: a pre-PMF/prototype-to-MVP RPG platform with a dark fantasy/Oni identity, Supabase-backed admin/player separation, and a tactical turn-based gameplay direction.

## What this is

- One repo. Markdown files. Versioned with git.
- One `CLAUDE.md` operating manual the agent reads at the start of every session.
- Pre-task load, post-task update — every task. No silent drift.

No vector database. No embeddings. No auto-tagging. The system is inspectable, editable, and auditable.

## How to start a session

1. Open this repo in Claude Code, Codex, or any agentic IDE.
2. The agent reads [`CLAUDE.md`](./CLAUDE.md) automatically.
3. Start a task. The agent routes through [`INDEX.md`](./INDEX.md) to the relevant area.

## First-week priorities

1. **Ingest one real playtest/reference artifact** — paste the next sketch review, visual reference, or tester notes with `/ingest`.
2. **Prep the next founder review** — `/prep fundador-criador` before the next weekly progress/identity review.
3. **Run `/review` on Friday.** The maintenance sweep keeps strategy, roadmap, hypotheses, and `.planning/` aligned.

## How the system thinks

- **Working memory vs durable knowledge.** Raw ingestion lives in `ingestion/`. Only recurring, decision-relevant, strategy-relevant signals get promoted into `knowledge/`.
- **Hypotheses vs decisions.** Bets being tested live in `hypotheses/`. Commitments made live in `decisions/`. They behave differently and stay queryable separately.
- **Flag, never gate.** The system surfaces conflicts, missing hypotheses, and strategy tensions. The PM resolves them. This is a reasoning system, not a compliance system.
- **Contradictions are preserved.** When evidence genuinely conflicts, the system writes the conflict down instead of flattening it into false consensus.

Full positioning and the five structural differentiators: [docs/overview.md](./docs/overview.md).

## Folder map

```text
CLAUDE.md           Operating manual. Read every session.
INDEX.md            Master routing.
source/             Immutable evidence copied from existing artifacts.
knowledge/          Durable, synthesized — strategy, product, users, market, org.
stakeholders/       One file per person or stakeholder group.
hypotheses/         Feature-scoped, 5 risk areas.
decisions/          Append-only log. Status: pending | decided | superseded.
rules/              How this PM runs discovery, prioritization, shipping, writing, data.
ingestion/          Working memory — interviews, meetings, market, adhoc.
maintenance/        Weekly sweep reports.
docs/               Workflows, schemas, overview, evolution guide.
Temp/               Scratch. Gitignored. Created on demand the first time you need it.
```

## Reference docs

- **[docs/overview.md](./docs/overview.md)** — What this is, what makes it different, what it's not.
- **[docs/workflows.md](./docs/workflows.md)** — Every slash command, what it loads, what it updates.
- **[docs/schemas.md](./docs/schemas.md)** — Cross-index of all schemas.
- **[docs/system-evolution.md](./docs/system-evolution.md)** — How to keep the system useful over time.
