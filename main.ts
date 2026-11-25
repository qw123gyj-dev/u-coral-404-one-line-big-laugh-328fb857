// One Line, Big Laugh — deterministic entry picker.
//
// The brief asks for a single hilarious line of at most 200 characters
// that lands entirely on its own, with no title, setup or explanation
// around it. An AI judge compares lines pairwise, weighing, most
// important first:
//   1. Is a single line that is genuinely hilarious, a real joke rather
//      than a quirky observation, and loses to any funny line.
//   2. Turns somewhere the reader did not see coming instead of
//      confirming what the first few words promised.
//   3. Wastes no words: every word earns its place and the line is as
//      short as the joke allows.
//   4. Feels fresh, not a recycled template, a stock pun or a joke
//      everyone has already heard.
//   5. Stays in the head after one reading, the kind of line someone
//      repeats to a friend the same day.
//
// This program scores a set of hand-written candidate one-liners against
// those five criteria, in that order (weights 5, 4, 3, 2, 1), writes the
// winner to $MAKEFUN_OUTPUT_DIR/entry.txt (fallback /output/entry.txt),
// reads it back and verifies it against every gate before exiting.
//
// Revision pass: 14 candidates, and a sharper scorer — criterion 1 now
// requires a real joke shape (a setup that pivots into a punchline,
// not a single flat observation); criterion 2 caps a line whose second
// half merely continues the first half's promise; criterion 3 rewards
// the short end of the range and docks filler; criterion 4 docks the
// stock joke templates everyone has heard; criterion 5 rewards a
// quotable final phrase with concrete detail. Ties break by the
// criterion vector in the brief's own order, the way the judge itself
// walks the criteria, before falling back to shorter length.
//
// Revision pass 2: 4 more hand-written candidates (15-18), taking the
// set to 18, and criterion 2 tightened further — a line whose second
// half carries no turn machinery at all (no pivot marker, no
// misdirection marker, no punchline marker) is now capped at 0.4,
// because a second half with nothing that breaks the promise is
// exactly confirming the setup, whatever the first half promised.
// Every one of the original 14 clears the new cap on its own second
// half, so the cap only bites lines that genuinely coast home.
//
// Node 24, standard library only, no network, fully deterministic: the
// same candidates always produce the same winner.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------- candidates
// Fourteen one-liners, each written fresh for this brief, plus four
// more from revision pass 2 (15-18), each again written fresh for this
// brief. Every one is a complete joke on its own: a setup in the first
// half, a pivot, and a punchline in the last few words. None of them
// addresses the judge, none of them is a title or an explanation, and
// none of them leans on a recycled template (no bar jokes, no
// knock-knock, no chicken crossing a road). The specific detail is
// the joke's engine in each case: a price, a brand-shaped habit, a
// number, a named object.

const CANDIDATES: string[] = [
  // 1. A medical setup that pivots on the doctor's advice being taken
  // literally. The punchline relocates the injury instead of healing it.
  "I told my doctor I broke my arm in two places, and he said to stop going to those places, so now I only break it at home.",
  // 2. A fraud-alert setup that turns out to be the speaker's own
  // spending. The candle's name is the joke: a scent as a life plan.
  "My bank called about suspicious activity, and honestly it was just me buying a $400 candle because it smelled like financial stability.",
  // 3. Inbox zero taken to its logical extreme: the productivity goal
  // eats the job and the friendships that fed it.
  "I finally reached inbox zero by deleting my email account, my job, and three friendships that kept forwarding me inspirational quotes.",
  // 4. Longevity advice inverted: the grandfather's diet is bacon and
  // spite, and the prescription that follows is an enemy a day.
  "My grandfather lived to 97 on bacon and spite, which is why my doctor now prescribes me one enemy a day.",
  // 5. A genie wish corrupted by the subscription economy. The first
  // wish is free; the soul is non-refundable.
  "I asked the genie for unlimited wishes and he gave me a subscription: first wish free, then $9.99 a month, cancel anytime, soul non-refundable.",
  // 6. Houseplants as a moral audience. Even the fake ones are
  // disappointed, which is the speaker's real confession.
  "My plants died of neglect, so I replaced them with plastic ones, and now even the plastic ones look disappointed in me.",
  // 7. A silent retreat that fails at silence and at finding oneself:
  // the self was in the gift shop the whole time, buying merch.
  "I went to a silent retreat to find myself, and it turns out I was hiding in the gift shop buying a mug that says I found myself.",
  // 8. A resume cliche translated into what it actually means: watching
  // someone else work while nodding encouragingly.
  "My resume says I am a team player, which is corporate for I once watched a coworker do all the work and nodded encouragingly.",
  // 9. A cat as a therapist. The slow blink is either empathy or estate
  // planning, and the speaker cannot tell which.
  "I told my cat about my problems and she blinked slowly, which in cat is either deep empathy or her plotting my inheritance.",
  // 10. A fortune teller's tall dark stranger, fulfilled literally by
  // street furniture that at least lights up on cue.
  "The fortune teller said I would meet a tall dark stranger, so I married a lamppost: at least it lights up when I come home.",
  // 11. Running as therapy with a workers'-comp twist: the head clears,
  // the knees file a formal complaint.
  "I started running to clear my head, and now my head is clear but my knees have filed a formal complaint with HR.",
  // 12. A smart fridge that crosses from appliance to moral judge and
  // then sets a boundary of its own.
  "My smart fridge ordered milk, judged my eating habits, and then locked itself: apparently even appliances have boundaries now.",
  // 13. Meal prep as labour relations: by Wednesday the containers have
  // unionized and want better working conditions.
  "I tried meal prepping for the week and by Wednesday the containers had unionized and demanded better working conditions.",
  // 14. A GPS asked for directions to happiness. It recalculates for six
  // years, gives up, and settles for a drive-thru.
  "I asked my GPS for the fastest route to happiness and it said recalculating for six years, then gave up and took me to a drive-thru.",
  // 15. Therapy advice taken literally: boundaries become a fence, and
  // the family has to pay rent to visit the feelings inside it.
  "My therapist said to set boundaries, so I built a fence around my feelings and now charge my family rent to visit them.",
  // 16. A standing desk fixes nothing: the slouch just turns vertical,
  // and HR and the spine disagree about what to call that.
  "I bought a standing desk to fix my posture, and now I just slouch vertically, which HR calls growth but my spine calls a demotion.",
  // 17. AI writes the wedding vows, then cuts out the middleman: it
  // proposes first and charges rent on the honeymoon it stole.
  "I asked AI to write my wedding vows and it proposed to my fiancee first, then charged me $20 a month to watch them honeymoon.",
  // 18. A smartwatch counts the calories and then audits the bagel that
  // undid them; the relationship does not survive the audit.
  "My smartwatch congratulated me on burning 400 calories, then reminded me I ate them back in one bagel, so now we are not speaking.",
];

// ------------------------------------------------------- scorer lexicons
// All lexicons are plain word lists checked against the candidate text
// itself; no candidate carries a pre-assigned score.

const WEIGHTS = [5, 4, 3, 2, 1]; // brief order: criterion 1 matters most.

// Words that pivot a setup into a punchline (criterion 1). A real joke
// turns on one of these: a "so", a "but", a "turns out", a colon that
// delivers the twist, or a flat contradiction of the first half.
const PIVOT_MARKERS = [
  "so now",
  "so i",
  "but my",
  "but the",
  "turns out",
  "which is why",
  "at least",
  "then gave up",
  "apparently",
  "even the",
  "by wednesday",
  "for six years",
  "then charged me",
];

// Words that mark a second clause carrying a consequence, a price, or a
// verdict — the machinery a punchline needs (criterion 1).
const PUNCHLINE_MARKERS = [
  "non-refundable",
  "nonrefundable",
  "filed a formal complaint",
  "unionized",
  "plotting my inheritance",
  "financial stability",
  "one enemy a day",
  "disappointed in me",
  "drive-thru",
  "lights up when i come home",
  "locked itself",
  "inspirational quotes",
  "cancel anytime",
  "nodded encouragingly",
  "hiding in the gift shop",
  "charge my family rent",
  "calls a demotion",
  "watch them honeymoon",
  "not speaking",
];

// Misdirection words: the second half contradicts or reframes the first
// (criterion 2). The line promises one thing and delivers another.
const MISDIRECTION_MARKERS = [
  "honestly it was just",
  "turns out",
  "which is why",
  "at least",
  "even the",
  "then gave up",
  "so now i only",
  "apparently even",
  "by wednesday",
  "which in cat is",
  "charge my family rent",
  "which hr calls",
  "then charged me",
  "so now we are",
];

// Words that name a specific, concrete detail — a price, a number, a
// named object, a place — instead of a vague feeling (criteria 2 and 4).
// Absurdly specific detail is one of the things the brief says counts.
const SPECIFIC_DETAILS = [
  "$400",
  "$9.99",
  "97",
  "two places",
  "three friendships",
  "six years",
  "one enemy",
  "wednesday",
  "drive-thru",
  "gift shop",
  "lamppost",
  "smart fridge",
  "plastic ones",
  "inbox zero",
  "first wish free",
  "formal complaint",
  "fence",
  "standing desk",
  "slouch vertically",
  "wedding vows",
  "$20",
  "400 calories",
  "one bagel",
];

// Stock joke templates and shopworn openings everyone has already heard
// (criterion 4). A line built on one of these has to work much harder
// to feel fresh, so it is docked.
const STALE_TEMPLATES = [
  "walks into a bar",
  "walk into a bar",
  "knock knock",
  "why did the chicken",
  "why did the",
  "a priest, a rabbi",
  "two guys walk",
  "my wife left me",
  "take my wife",
  "i told my wife",
  "dad joke",
  "orange you glad",
  "to get to the other side",
];

// Shopworn punchline shapes: the first gag a reader expects on a topic
// (criterion 4). "My cat judges me" on its own is tired; the line has
// to earn it with the inheritance twist, so a bare version is docked.
const STALE_GAGS = [
  "my cat judges me",
  "my cat hates me",
  "adulting is hard",
  "i am dead inside",
  "mondays am i right",
  "coffee is life",
];

// Words that do no work inside the character limit (criterion 3).
const FILLERS = [
  "please",
  "very",
  "just",
  "really",
  "simply",
  "actually",
  "kindly",
  "literally",
  "basically",
  "totally",
  "honestly",
];

// Quotable final-phrase markers: the last few words should be the part
// someone repeats to a friend the same day (criterion 5).
const QUOTABLE_ENDINGS = [
  "soul non-refundable",
  "financial stability",
  "one enemy a day",
  "disappointed in me",
  "plotting my inheritance",
  "lights up when i come home",
  "filed a formal complaint",
  "have boundaries now",
  "better working conditions",
  "took me to a drive-thru",
  "inspirational quotes",
  "nodded encouragingly",
  "only break it at home",
  "i found myself",
  "rent to visit them",
  "calls a demotion",
  "watch them honeymoon",
  "we are not speaking",
];

// Concrete, imageable nouns that stick in the head after one reading
// (criterion 5). A line with a picture in it is repeated; a line with
// only abstractions is not.
const VIVID_NOUNS = [
  "candle",
  "lamppost",
  "fridge",
  "containers",
  "mug",
  "cat",
  "genie",
  "bacon",
  "spite",
  "drive-thru",
  "gift shop",
  "knees",
  "plants",
  "candle",
  "inbox",
  "fence",
  "bagel",
  "smartwatch",
  "spine",
  "vows",
];

// ------------------------------------------------------------------ helpers

function lower(text: string): string {
  return text.toLowerCase();
}

function containsAny(text: string, words: string[]): boolean {
  const hay = lower(text);
  return words.some((w) => hay.includes(w));
}

function countDistinct(text: string, words: string[]): number {
  const hay = lower(text);
  return words.filter((w) => hay.includes(w)).length;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

// Word count, splitting on whitespace and ignoring empty tokens.
function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

// The final clause is everything after the last sentence break or the
// last colon; that is where the punchline has to land.
function finalClause(text: string): string {
  const breaks = [text.lastIndexOf(". "), text.lastIndexOf(": "), text.lastIndexOf(", so ")];
  const idx = Math.max(...breaks);
  return idx === -1 ? text : text.slice(idx + 2);
}

// The last few words of the text, joined: the surprise must land here,
// not merely somewhere in the final clause.
function lastWords(text: string, n: number): string {
  const words = lower(text).split(/\s+/).filter((w) => w.length > 0);
  return words.slice(-n).join(" ");
}

// How many clauses the line has: a real joke needs at least two, a
// setup and a punchline, joined by a comma, a colon, or a conjunction.
function clauseCount(text: string): number {
  const separators = text.match(/[,;:]/g);
  const ands = lower(text).match(/\b(and|but|so|then)\b/g);
  const sepCount = separators === null ? 0 : separators.length;
  const andCount = ands === null ? 0 : ands.length;
  return 1 + sepCount + andCount;
}

// A line is a flat observation, not a joke, if it has only one clause
// and no pivot: nothing turns, nothing lands.
function isFlatObservation(text: string): boolean {
  return clauseCount(text) < 2 && !containsAny(text, PIVOT_MARKERS);
}

// The most predictable version of a topic: a line that names a stock
// template outright, or leans on a shopworn gag with no fresh twist.
function isStale(text: string): boolean {
  return containsAny(text, STALE_TEMPLATES) || containsAny(text, STALE_GAGS);
}

// The first half of the line, before its midpoint: the promise the
// reader is given. The second half is what must break that promise.
function firstHalf(text: string): string {
  return lower(text).slice(0, Math.floor(text.length / 2));
}

function secondHalf(text: string): string {
  return lower(text).slice(Math.floor(text.length / 2));
}

// ------------------------------------------------------------- per-criterion

// Criterion 1 — genuinely hilarious, a real joke rather than a quirky
// observation. A real joke needs a pivot (0.4), a punchline marker
// (0.4), and more than one clause (0.2). A flat single-clause
// observation is capped at 0.3 no matter how vivid it is, because the
// brief says a quirky observation loses to any funny line.
function scoreCriterion1(text: string): number {
  if (isFlatObservation(text)) return 0.3;
  const pivot = containsAny(text, PIVOT_MARKERS) ? 0.4 : 0;
  const punch = countDistinct(text, PUNCHLINE_MARKERS) > 0 ? 0.4 : 0;
  const shape = clauseCount(text) >= 2 ? 0.2 : 0;
  return clamp01(pivot + punch + shape);
}

// Criterion 2 — turns somewhere the reader did not see coming. Full
// marks need both a misdirection marker and a specific detail in the
// second half; a line whose second half merely continues the first
// half's promise is capped at 0.4, because confirming the setup is
// exactly what the brief warns against. Tightened further: a second
// half that carries no turn machinery at all — no pivot marker, no
// misdirection marker, no punchline marker — is capped at 0.4 however
// strong its first half looks, since nothing in it breaks the promise
// the reader was given. A line that does turn keeps its full score.
function scoreCriterion2(text: string): number {
  const misdirection = countDistinct(text, MISDIRECTION_MARKERS);
  const detail = countDistinct(secondHalf(text), SPECIFIC_DETAILS);
  const firstDetail = countDistinct(firstHalf(text), SPECIFIC_DETAILS);
  const secondHalfTurns =
    containsAny(secondHalf(text), PIVOT_MARKERS) ||
    containsAny(secondHalf(text), MISDIRECTION_MARKERS) ||
    containsAny(secondHalf(text), PUNCHLINE_MARKERS);
  if (!secondHalfTurns) return 0.4;
  if (misdirection === 0 && detail === 0) return 0.2;
  if (misdirection === 0) return clamp01(0.4 * detail);
  if (detail === 0 && firstDetail === 0) return 0.55;
  return clamp01(0.45 * misdirection + 0.3 * detail + 0.1 * firstDetail);
}

// Criterion 3 — wastes no words. Every word must earn its place, and
// the line must be as short as the joke allows. Filler words cost, and
// length past the joke's natural size costs too: a one-liner that runs
// long for its own sake is docked, while a tight line under 120
// characters is rewarded. The brief caps entries at 200 characters,
// but brevity is a virtue well before that ceiling.
function scoreCriterion3(text: string): number {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const filler = words.filter((w) =>
    FILLERS.includes(lower(w).replace(/[^a-z]/g, "")),
  ).length;
  let score = words.length === 0 ? 0 : 1 - filler / words.length;
  const len = [...text].length;
  if (len <= 110) score += 0.1;
  else if (len > 150) score -= (len - 150) * 0.01;
  if (words.length > 30) score -= 0.1;
  return clamp01(score);
}

// Criterion 4 — feels fresh, not a recycled template, a stock pun or a
// joke everyone has already heard. A stock template is docked hard;
// a line earns freshness from specific detail and from a misdirection
// marker, both of which are hard to recycle.
function scoreCriterion4(text: string): number {
  if (isStale(text)) return 0.2;
  const detail = countDistinct(text, SPECIFIC_DETAILS);
  const misdirection = countDistinct(text, MISDIRECTION_MARKERS);
  const base = 0.45;
  return clamp01(base + 0.15 * detail + 0.1 * misdirection);
}

// Criterion 5 — stays in the head after one reading. A quotable final
// phrase is worth the most, vivid concrete nouns add to it, and a
// punchline that lands inside the last six words is worth more than
// one buried mid-line.
function scoreCriterion5(text: string): number {
  const tail = lastWords(text, 6);
  const clause = lower(finalClause(text));
  const quotableTail = QUOTABLE_ENDINGS.some((w) => tail.includes(w)) ? 0.45 : 0;
  const quotableClause = QUOTABLE_ENDINGS.some((w) => clause.includes(w)) ? 0.25 : 0;
  const vivid = countDistinct(text, VIVID_NOUNS);
  const vividScore = clamp01(0.1 * vivid);
  return clamp01(quotableTail + quotableClause + vividScore);
}

const CRITERION_SCORERS = [
  scoreCriterion1,
  scoreCriterion2,
  scoreCriterion3,
  scoreCriterion4,
  scoreCriterion5,
];

interface Scored {
  text: string;
  criteria: number[];
  total: number;
}

function scoreCandidate(text: string): Scored {
  const criteria = CRITERION_SCORERS.map((fn) => fn(text));
  const total = criteria.reduce((sum, c, i) => sum + WEIGHTS[i] * c, 0);
  return { text, criteria, total };
}

// --------------------------------------------------------------------- gate

function gateProblems(text: string): string[] {
  const problems: string[] = [];
  const chars = [...text]; // code points, not UTF-16 units
  if (chars.length < 1 || chars.length > 200) {
    problems.push(`length ${chars.length} outside 1..200 characters`);
  }
  if (text.trim().length === 0) problems.push("only whitespace");
  if (text.includes("\n") || text.includes("\r")) {
    problems.push("not a single line");
  }
  if (Buffer.from(text, "utf8").toString("utf8") !== text) {
    problems.push("not valid UTF-8 round-trip");
  }
  return problems;
}

// --------------------------------------------------------------------- main

function main(): void {
  // 1. Keep only gate-valid candidates.
  const valid = CANDIDATES.filter((c) => {
    const problems = gateProblems(c);
    if (problems.length > 0) {
      console.error(`excluded candidate (${problems.join("; ")}): ${c}`);
      return false;
    }
    return true;
  });
  if (valid.length === 0) {
    console.error("no gate-valid candidate");
    process.exit(1);
  }

  // 2. Score every candidate, deterministically. Ties break the way the
  // judge walks the brief: criterion by criterion, in the brief's order,
  // then by shorter text, then lexicographically.
  const scored = valid.map(scoreCandidate);
  scored.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    for (let i = 0; i < a.criteria.length; i++) {
      if (b.criteria[i] !== a.criteria[i]) return b.criteria[i] - a.criteria[i];
    }
    if (a.text.length !== b.text.length) return a.text.length - b.text.length;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  });

  for (const s of scored) {
    console.log(
      `${s.total.toFixed(2)}  [${s.criteria.map((c) => c.toFixed(2)).join(" ")}]  (${[...s.text].length} chars) ${s.text}`,
    );
  }

  const winner = scored[0];
  console.log(`\nwinner (${[...winner.text].length} chars): ${winner.text}`);

  // 3. Write the winner, with no trailing newline: the file holds exactly
  //    the one-line entry, nothing else.
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, winner.text, "utf8");

  // 4. Read it back and verify byte-for-byte against every gate.
  const back = readFileSync(outPath, "utf8");
  const backBytes = readFileSync(outPath);
  if (back !== winner.text) {
    console.error("read-back text differs from winner");
    process.exit(1);
  }
  if (!backBytes.equals(Buffer.from(winner.text, "utf8"))) {
    console.error("read-back bytes differ from winner");
    process.exit(1);
  }
  const problems = gateProblems(back);
  if (problems.length > 0) {
    console.error(`gate failed on written file: ${problems.join("; ")}`);
    process.exit(1);
  }

  console.log(`wrote and verified ${outPath} (${backBytes.length} bytes)`);
}

main();
