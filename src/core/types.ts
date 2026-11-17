import type { Rng } from './rng'

export type Size = 1 | 2 | 3
export type Goal = 'min' | 'max'

// A small table the editorial shows, such as a DP array for the current test.
export interface Trace {
  caption: string
  head: (string | number)[]
  rows: { label: string; cells: (string | number)[] }[]
}

// One problem of the set. I is a test (an instance), A is an answer to it.
//
// greedy() and solve() are kept apart on purpose: greedy is the opponent,
// solve is the reference the judge trusts, and value() is the only code that
// decides whether an answer is legal and what it scores.
export interface Problem<I = any, A = any> {
  id: string
  letter: string
  title: string
  tags: string[]
  goal: Goal
  unit: string
  statement: string[]
  inputFormat: string[]
  constraints: string[]
  sample: string
  greedyRule: string
  technique: string
  complexity: string
  recurrence: string
  editorial: string[]

  generate(rng: Rng, size: Size): I
  // Optional playability filter, e.g. "greedy must at least finish".
  fair?(test: I): boolean
  // The greedy answer, or null if greedy gets stuck.
  greedy(test: I): A | null
  solve(test: I): A
  // Score of an answer, or null if the answer breaks a rule. Takes unknown
  // because the judge must not trust where the answer came from.
  value(test: I, answer: unknown): number | null
  blank(test: I): A
  parse(text: string): I
  format(test: I): string
  trace(test: I): Trace
}

export function isIndexList(answer: unknown, length: number): answer is number[] {
  if (!Array.isArray(answer)) return false
  const seen = new Set<number>()
  for (const item of answer) {
    if (!Number.isInteger(item) || item < 0 || item >= length || seen.has(item)) return false
    seen.add(item)
  }
  return true
}
