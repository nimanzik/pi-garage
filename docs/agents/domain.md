# Domain docs

## Before exploring

Read `GLOSSARY-MAP.md` at the repo root, then the `GLOSSARY.md` of the
extension you are working on and relevant decisions in `docs/adr/`.

If a file does not exist, proceed silently. The domain-modeling skill
creates them when terms or decisions are resolved.

## Layout

Use a multi-context layout, with one context per extension:

- `GLOSSARY-MAP.md` lists each extension's glossary.
- `extensions/<name>/GLOSSARY.md` contains that extension's vocabulary.
- `docs/adr/` contains decisions that affect the whole repo.
- `extensions/<name>/docs/adr/` contains decisions for one extension.

## Vocabulary

Use glossary terms in issue titles, proposals, hypotheses, and test names.
If a needed concept is missing, reconsider the term or note the gap for
domain-modeling.

## Decision conflicts

Explicitly flag proposals that contradict an existing ADR, and explain
why the decision should be reconsidered.
