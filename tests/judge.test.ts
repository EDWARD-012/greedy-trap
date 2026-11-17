import { describe, expect, it } from 'vitest'
import { hack, judge } from '../src/core/judge'
import { findProblem, problems } from '../src/core/problems'
import type { Problem } from '../src/core/types'

const get = (id: string) => findProblem(id) as Problem
const sampleOf = (id: string) => get(id).parse(get(id).sample)

describe('verdicts', () => {
  it.each(problems)('$id: the optimum is accepted', (problem) => {
    const test = problem.parse(problem.sample)
    const result = judge(problem, test, problem.solve(test))
    expect(result.verdict).toBe('AC')
    expect(result.failedTest).toBeNull()
    expect(result.tests.map((t) => t.passed)).toEqual([true, true, true])
  })

  it.each(problems)('$id: the greedy answer fails test 2', (problem) => {
    const test = problem.parse(problem.sample)
    const result = judge(problem, test, problem.greedy(test))
    expect(result.verdict).toBe('WA')
    expect(result.failedTest).toBe(2)
    expect(result.matchedGreedy).toBe(true)
  })

  it('an answer between greedy and the optimum fails test 3', () => {
    // Coins 1, 5, 6, 9 and target 22. Greedy pays 9 9 1 1 1 1, six coins. The
    // optimum is four (9 6 6 1). The answer below is 9 6 5 1 1, five coins.
    const problem = get('coins')
    const test = { coins: [1, 5, 6, 9], target: 22 }
    const result = judge(problem, test, [2, 1, 1, 1])
    expect(result.yours).toBe(5)
    expect(result.greedy).toBe(6)
    expect(result.optimal).toBe(4)
    expect(result.failedTest).toBe(3)
  })

  it('skips the greedy test when greedy is already optimal', () => {
    const problem = get('coins')
    const test = { coins: [1, 5, 10], target: 16 }
    const result = judge(problem, test, [1, 1, 1])
    expect(result.tests.map((t) => t.name)).toEqual(['answer follows the rules', 'matches the optimum'])
    expect(result.verdict).toBe('AC')
  })
})

// Answers that try to score without playing by the rules. Each one must fail
// on test 1, whatever number it would have scored.
describe('rule-breaking answers are rejected', () => {
  const cheats: [string, string, unknown][] = [
    ['coins', 'total does not reach the target', [0, 1, 0]],
    ['coins', 'total overshoots the target', [0, 0, 2]],
    ['coins', 'negative count to cancel a coin', [-2, 0, 2]],
    ['coins', 'half a coin', [0, 1.5, 0]],
    ['coins', 'wrong number of counts', [0, 2]],
    ['coins', 'not a list', 'two threes'],
    ['knapsack', 'over the weight limit', [0, 1]],
    ['knapsack', 'same item packed twice', [1, 1]],
    ['knapsack', 'item that does not exist', [7]],
    ['gigs', 'two gigs that overlap', [0, 1]],
    ['gigs', 'same gig twice', [0, 0]],
    ['grid', 'too few moves', 'DD'],
    ['grid', 'walks off the bottom edge', 'DDDR'],
    ['grid', 'a diagonal move', 'DXRR'],
    ['route', 'uses a road that is not there', [0, 3]],
    ['route', 'stops before the goal', [0, 1]],
    ['route', 'starts somewhere else', [2, 3]],
    ['route', 'town that does not exist', [0, 9, 3]],
    ['tour', 'skips a stop', [1, 2]],
    ['tour', 'visits a stop twice', [1, 1, 3]],
    ['tour', 'counts the depot as a stop', [0, 1, 2]],
    ['climb', 'cards out of order', [2, 1]],
    ['climb', 'not increasing', [0, 1]],
    ['climb', 'same card twice', [1, 1]],
    ['climb', 'position past the end', [1, 9]],
  ]

  it.each(cheats)('%s: %s', (id, _why, answer) => {
    const problem = get(id)
    const result = judge(problem, sampleOf(id), answer)
    expect(result.yours).toBeNull()
    expect(result.verdict).toBe('WA')
    expect(result.failedTest).toBe(1)
  })
})

describe('hacks', () => {
  it.each(problems)('$id: the sample is a successful hack', (problem) => {
    const result = hack(problem, problem.sample)
    expect(result).toMatchObject({ ok: true, success: true })
  })

  it('fails when greedy handles the test', () => {
    expect(hack(get('coins'), '3 16\n1 5 10')).toMatchObject({ ok: true, success: false, greedy: 3, optimal: 3 })
  })

  it('counts a dead end as a successful hack', () => {
    // Greedy drives 1 → 2 for a toll of 1 and has nowhere left to go.
    const result = hack(get('route'), '3 2\n1 2 1\n1 3 5')
    expect(result).toMatchObject({ ok: true, success: true, greedy: null, optimal: 5 })
  })

  const invalid: [string, string, string][] = [
    ['coins', '3 6\n2 3 4', 'One coin must be worth 1'],
    ['coins', '3 6\n1 3 3', 'distinct'],
    ['coins', '3 600\n1 3 4', 't must be between 1 and 99'],
    ['coins', '3 6\n1 3', 'Input ended early'],
    ['coins', '3 6\n1 3 4 5', 'Unexpected extra input'],
    ['coins', '3 six\n1 3 4', 'must be an integer'],
    ['gigs', '1\n5 5 10', 'e of gig 1 must be between 6 and 24'],
    ['route', '3 1\n1 2 4', 'Town 3 cannot be reached'],
    ['route', '2 1\n1 1 4', 'joins town 1 to itself'],
    ['route', '2 2\n1 2 4\n2 1 4', 'joined twice'],
    ['tour', '2\n1 1\n1 1', 'repeats an earlier point'],
  ]

  it.each(invalid)('%s: rejects %j', (id, text, message) => {
    const result = hack(get(id), text)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain(message)
  })
})
