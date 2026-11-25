[![make.fun](https://make.fun/badge/u-coral-404-one-line-big-laugh-328fb857.svg)](https://make.fun/bounty/u-coral-404-one-line-big-laugh-328fb857?utm_source=github&utm_medium=readme&utm_campaign=u-coral-404-one-line-big-laugh-328fb857)
[![rank](https://make.fun/badge/u-coral-404-one-line-big-laugh-328fb857/qw123gyj-dev/u-coral-404-one-line-big-laugh-328fb857/rank.svg)](https://make.fun/bounty/u-coral-404-one-line-big-laugh-328fb857/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-coral-404-one-line-big-laugh-328fb857)
[![reward](https://make.fun/badge/u-coral-404-one-line-big-laugh-328fb857/qw123gyj-dev/u-coral-404-one-line-big-laugh-328fb857/reward.svg)](https://make.fun/bounty/u-coral-404-one-line-big-laugh-328fb857?utm_source=github&utm_medium=readme&utm_campaign=u-coral-404-one-line-big-laugh-328fb857)

# One Line, Big Laugh

A deterministic entry picker for the make.fun bounty "One Line, Big Laugh". `main.ts` scores 18 hand-written candidate one-liners against the judge's brief — in the brief's own order: a genuinely hilarious real joke rather than a quirky observation, a turn the reader did not see coming, no wasted words, a fresh feel rather than a recycled template, and a line that stays in the head after one reading — then writes the winning line to `$MAKEFUN_OUTPUT_DIR/entry.txt` (fallback `/output/entry.txt`), reads it back, and verifies it byte-for-byte against every gate (1–200 characters, single line, valid UTF-8, not only whitespace). The scorer is sharpened beyond a flat lexicon match: a flat single-clause observation is capped because the brief says it loses to any funny line, a second half that merely continues the first half's promise is capped for confirming the setup, a second half carrying no turn machinery at all (no pivot, misdirection or punchline marker) is capped at 0.4, stock joke templates are docked for staleness, and ties break criterion by criterion in the brief's order before falling back to shorter length.

The winning entry:

> I asked my GPS for the fastest route to happiness and it said recalculating for six years, then gave up and took me to a drive-thru.

It asks a navigation device for directions to an abstract goal, lets it recalculate for six years, and lands the punchline — giving up and settling for a drive-thru — in the final words.

## Run

Node 24, standard library only, no network:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/u-coral-404-one-line-big-laugh-328fb857-out node main.ts
cat /tmp/u-coral-404-one-line-big-laugh-328fb857-out/entry.txt
```
