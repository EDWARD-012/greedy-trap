import { isTrap } from './judge'
import { createRng } from './rng'
import type { Problem, Size } from './types'

export interface Level {
  problem: Problem
  seed: string
  size: Size
  test: unknown
  // Random tests thrown away before this one because greedy solved them.
  rejected: number
}

// Draws random tests from the seed until one is a trap. Most problems need
// only a few draws; the cap is there so a bug cannot hang the page.
export function makeLevel(problem: Problem, seed: string, size: Size): Level {
  const rng = createRng(`${problem.id}/${seed}`)
  let rejected = 0
  for (let draw = 0; draw < 5000; draw++) {
    const test = problem.generate(rng, size)
    if (problem.fair && !problem.fair(test)) continue
    if (isTrap(problem, test)) return { problem, seed, size, test, rejected }
    rejected++
  }
  throw new Error(`${problem.id}: no trap found for seed "${seed}"`)
}

export function practiceSize(level: number): Size {
  return level <= 3 ? 1 : level <= 8 ? 2 : 3
}

export function practiceLevel(problem: Problem, level: number): Level {
  return makeLevel(problem, `practice/${level}`, practiceSize(level))
}

export function dailyLevel(problem: Problem, date: string): Level {
  return makeLevel(problem, `daily/${date}`, 2)
}

const FIRST_ROUND = Date.UTC(2026, 10, 17)

// Rounds change at midnight UTC so everyone gets the same one.
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

export function roundNumber(date: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - FIRST_ROUND) / 86_400_000) + 1
}
