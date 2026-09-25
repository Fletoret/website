# Agent skills

Instructions that let an AI agent carry out a Fletoret task from start to
finish, in the open [`SKILL.md`](https://code.claude.com/docs/en/skills) format.

| Skill | What it does |
| --- | --- |
| [`epub`](epub/SKILL.md) | Proofreads a book in `autore/` and ships a Standard Ebooks-quality EPUB of it. Reference: [`epub.md`](../epub.md). |

## Using them

Copy a skill into the folder your agent reads skills from. For Claude Code:

```bash
mkdir -p .claude/skills && cp -r skills/epub .claude/skills/
```

Then ask for the task (for example "convert fishta/lahuta-e-malcis to epub")
or run `/epub fishta/lahuta-e-malcis`.

## These files are generated

The skills are developed in `.claude/skills/`, which is not committed. This
folder is refreshed from it by `npm run skills:sync`, which publishes only
listed skills, leaves out private passages and refuses to write paths, keys
or email addresses. Edits made here are overwritten on the next sync:
propose changes by issue or pull request and they'll be carried back. This
README is maintained by hand.

`npm run skills:check` reports when this folder has fallen behind.
