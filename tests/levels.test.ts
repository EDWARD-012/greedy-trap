import { describe, expect, it } from 'vitest'
import { MinHeap } from '../src/core/heap'
import { isTrap } from '../src/core/judge'
import { dailyLevel, makeLevel, practiceLevel, practiceSize, roundNumber, todayUtc } from '../src/core/levels'
import { problems } from '../src/core/problems'
import { createRng, randInt } from '../src/core/rng'

describe('levels', () => {
  it.each(problems)('$id: every practice level is a trap', (problem) => {
    for (let level = 1; level <= 30; level++) {
      const { test } = practiceLevel(problem, level)
      expect(isTrap(problem, test)).toBe(true)
      expect(problem.fair ? problem.fair(test) : true).toBe(true)
    }
  })

  it.each(problems)('$id: the same seed gives the same level', (problem) => {
    const first = makeLevel(problem, 'repeat-me', 2)
    const second = makeLevel(problem, 'repeat-me', 2)
    expect(second.test).toEqual(first.test)
    expect(second.rejected).toBe(first.rejected)
    expect(makeLevel(problem, 'something-else', 2).test).not.toEqual(first.test)
  })

  // If these change, every published level changes with them. Update the
  // strings only when that is the intent.
  it('practice level 1 of each problem is pinned', () => {
    const pinned = problems.map((problem) => problem.format(practiceLevel(problem, 1).test))
    expect(pinned).toMatchInlineSnapshot(`
      [
        "3 16
      1 5 6",
        "4 11
      8 36
      8 40
      4 15
      6 30",
        "4
      2 6 21
      5 9 15
      5 10 15
      1 3 8",
        "3 3
      5 8 2
      7 3 6
      7 8 4",
        "6 9
      1 2 3
      1 3 1
      2 5 5
      2 4 2
      3 4 8
      3 5 2
      4 6 6
      5 6 5
      4 5 8",
        "5
      5 4
      4 0
      5 5
      5 2
      3 4",
        "6
      13 4 9 16 15 3",
      ]
    `)
  })

  it('daily levels depend on the date', () => {
    for (const problem of problems) {
      const first = dailyLevel(problem, '2026-11-17')
      expect(dailyLevel(problem, '2026-11-17').test).toEqual(first.test)
      expect(dailyLevel(problem, '2026-11-18').test).not.toEqual(first.test)
    }
  })

  it('levels grow with the level number', () => {
    expect([1, 3, 4, 8, 9, 40].map(practiceSize)).toEqual([1, 1, 2, 2, 3, 3])
  })

  it('rounds are numbered from 17 November 2026 in UTC', () => {
    expect(roundNumber('2026-11-17')).toBe(1)
    expect(roundNumber('2026-11-18')).toBe(2)
    expect(roundNumber('2027-11-17')).toBe(366)
    expect(todayUtc(new Date('2026-11-17T23:59:59Z'))).toBe('2026-11-17')
    expect(todayUtc(new Date('2026-11-18T00:00:00Z'))).toBe('2026-11-18')
  })
})

describe('MinHeap', () => {
  it('pops in sorted order', () => {
    const rng = createRng('heap')
    for (let round = 0; round < 50; round++) {
      const values = Array.from({ length: randInt(rng, 0, 40) }, () => randInt(rng, -50, 50))
      const heap = new MinHeap<number>((a, b) => a < b)
      values.forEach((value) => heap.push(value))
      const popped: number[] = []
      while (heap.size > 0) popped.push(heap.pop() as number)
      expect(popped).toEqual(values.slice().sort((a, b) => a - b))
      expect(heap.pop()).toBeUndefined()
    }
  })
})
