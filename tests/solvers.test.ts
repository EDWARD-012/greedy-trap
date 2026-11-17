import { describe, expect, it } from 'vitest'
import { baseline, isBetter } from '../src/core/judge'
import { problems } from '../src/core/problems'
import { createRng } from '../src/core/rng'
import type { Size } from '../src/core/types'
import { brute } from './brute'

const SIZES: Size[] = [1, 2, 3]
const TESTS_PER_SIZE = 150

describe.each(problems)('$letter. $title', (problem) => {
  it('solver agrees with brute force on random tests', () => {
    for (const size of SIZES) {
      const rng = createRng(`solver-check/${problem.id}/${size}`)
      for (let i = 0; i < TESTS_PER_SIZE; i++) {
        const test = problem.generate(rng, size)
        const answer = problem.solve(test)
        expect(problem.value(test, answer), problem.format(test)).toBe(brute[problem.id](test))
      }
    }
  })

  it('greedy gives a legal answer that never beats the optimum', () => {
    for (const size of SIZES) {
      const rng = createRng(`greedy-check/${problem.id}/${size}`)
      for (let i = 0; i < TESTS_PER_SIZE; i++) {
        const test = problem.generate(rng, size)
        const greedyAnswer = problem.greedy(test)
        if (greedyAnswer === null) continue
        const greedy = problem.value(test, greedyAnswer)
        expect(greedy, problem.format(test)).not.toBeNull()
        expect(isBetter(problem, greedy as number, baseline(problem, test).optimal)).toBe(false)
      }
    }
  })

  it('a test survives being written out and read back', () => {
    const rng = createRng(`round-trip/${problem.id}`)
    for (const size of SIZES) {
      const test = problem.generate(rng, size)
      const again = problem.parse(problem.format(test))
      expect(problem.format(again)).toBe(problem.format(test))
      expect(baseline(problem, again)).toEqual(baseline(problem, test))
    }
  })

  it('the sample in the statement is a trap', () => {
    const { greedy, optimal } = baseline(problem, problem.parse(problem.sample))
    expect(greedy).not.toBe(optimal)
  })

  it('the trace table has one cell per column', () => {
    const trace = problem.trace(problem.parse(problem.sample))
    for (const row of trace.rows) expect(row.cells).toHaveLength(trace.head.length)
  })
})

// The editorials quote these numbers, so they are pinned here.
describe('numbers quoted in the editorials', () => {
  const quoted: Record<string, [number, number]> = {
    coins: [3, 2],
    knapsack: [30, 40],
    gigs: [13, 20],
    grid: [13, 22],
    route: [10, 6],
    tour: [11, 9],
    climb: [1, 4],
  }

  it.each(problems)('$id', (problem) => {
    const { greedy, optimal } = baseline(problem, problem.parse(problem.sample))
    expect([greedy, optimal]).toEqual(quoted[problem.id])
  })
})
