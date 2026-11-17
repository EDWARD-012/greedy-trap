import { InputError } from './reader'
import type { Problem } from './types'

export interface TestResult {
  name: string
  passed: boolean
}

export interface Judgement {
  verdict: 'AC' | 'WA'
  // 1-based number of the first failed test, or null on AC.
  failedTest: number | null
  tests: TestResult[]
  yours: number | null
  greedy: number | null
  optimal: number
  matchedGreedy: boolean
}

export function isBetter(problem: Problem, a: number, b: number): boolean {
  return problem.goal === 'min' ? a < b : a > b
}

// Scores of the greedy answer and the reference answer on one test. Both go
// through value(), the same check a player's answer gets.
export function baseline(problem: Problem, test: unknown): { greedy: number | null; optimal: number } {
  const greedyAnswer = problem.greedy(test)
  const greedy = greedyAnswer === null ? null : problem.value(test, greedyAnswer)
  const optimal = problem.value(test, problem.solve(test))
  if (optimal === null) throw new Error(`${problem.id}: the reference solver produced an invalid answer`)
  if (greedy !== null && isBetter(problem, greedy, optimal)) {
    throw new Error(`${problem.id}: greedy beat the reference solver, so the solver is wrong`)
  }
  return { greedy, optimal }
}

// Greedy loses if it gets stuck or ends up with a worse score than the optimum.
export function isTrap(problem: Problem, test: unknown): boolean {
  const { greedy, optimal } = baseline(problem, test)
  return greedy === null || greedy !== optimal
}

// An answer runs through up to three tests, in order, and the verdict names
// the first one it fails:
//   1. the answer obeys the rules
//   2. it scores better than greedy (only on tests where greedy loses)
//   3. it matches the optimum
export function judge(problem: Problem, test: unknown, answer: unknown): Judgement {
  const { greedy, optimal } = baseline(problem, test)
  const yours = problem.value(test, answer)
  if (yours !== null && isBetter(problem, yours, optimal)) {
    throw new Error(`${problem.id}: an answer beat the reference solver, so the solver is wrong`)
  }

  const tests: TestResult[] = [{ name: 'answer follows the rules', passed: yours !== null }]
  if (greedy === null || greedy !== optimal) {
    const beats = yours !== null && (greedy === null || isBetter(problem, yours, greedy))
    tests.push({ name: 'beats the greedy answer', passed: beats })
  }
  tests.push({ name: 'matches the optimum', passed: yours === optimal })

  const failed = tests.findIndex((result) => !result.passed)
  return {
    verdict: failed === -1 ? 'AC' : 'WA',
    failedTest: failed === -1 ? null : failed + 1,
    tests,
    yours,
    greedy,
    optimal,
    matchedGreedy: yours !== null && yours === greedy,
  }
}

export type HackResult =
  | { ok: false; error: string }
  | { ok: true; success: boolean; test: unknown; greedy: number | null; optimal: number }

// A hack is a test written by the player. It succeeds when the input is valid
// and greedy does worse than the optimum on it.
export function hack(problem: Problem, text: string): HackResult {
  let test: unknown
  try {
    test = problem.parse(text)
  } catch (error) {
    if (error instanceof InputError) return { ok: false, error: error.message }
    throw error
  }
  const { greedy, optimal } = baseline(problem, test)
  return { ok: true, success: greedy === null || greedy !== optimal, test, greedy, optimal }
}
