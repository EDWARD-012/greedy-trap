import { InputError, Reader } from '../reader'
import { randInt, range, sample } from '../rng'
import type { Problem } from '../types'

export interface CoinsTest {
  coins: number[]
  target: number
}

// How many of each coin, in the same order as test.coins.
export type CoinsAnswer = number[]

function fewest(test: CoinsTest): { best: number[]; pick: number[] } {
  const best = [0]
  const pick = [-1]
  for (let amount = 1; amount <= test.target; amount++) {
    best[amount] = Infinity
    pick[amount] = -1
    test.coins.forEach((coin, i) => {
      if (coin <= amount && best[amount - coin] + 1 < best[amount]) {
        best[amount] = best[amount - coin] + 1
        pick[amount] = i
      }
    })
  }
  return { best, pick }
}

export const coins: Problem<CoinsTest, CoinsAnswer> = {
  id: 'coins',
  letter: 'A',
  title: 'Exact change',
  tags: ['dp', 'greedy'],
  goal: 'min',
  unit: 'coins',
  statement: [
    'You have an unlimited supply of each coin shown. Pay the target amount exactly, using as few coins as you can.',
  ],
  inputFormat: [
    'The first line has two integers k and t: the number of coin types and the target.',
    'The second line has k distinct integers, the coin values. One of them must be 1.',
  ],
  constraints: ['1 ≤ k ≤ 6', '1 ≤ t ≤ 99', '1 ≤ coin ≤ 50'],
  sample: '3 6\n1 3 4',
  greedyRule: 'Keep taking the largest coin that still fits.',
  technique: 'Dynamic programming over amounts',
  complexity: 'O(k · t) time, O(t) memory',
  recurrence: 'best[0] = 0\nbest[a] = 1 + min(best[a - c]) over coins c ≤ a',
  editorial: [
    'Largest-first works for money like 1, 5, 10, 25 because each coin is worth at least twice the next one down, and that habit is what the trap relies on. With coins 1, 3, 4 and a target of 6, largest-first pays 4 + 1 + 1. Two 3s do it in two coins.',
    'The big coin is not wrong by itself. Taking it leaves a remainder that is expensive to pay, and greedy never looks at the remainder before it commits.',
    'So solve every remainder. best[a] is the fewest coins that make a. To make a, the last coin is some c, and before it you had made a - c in the best way. Try each c and keep the smallest. Fill the table from 0 up to t and read the answer off the end.',
  ],

  generate(rng, size) {
    const kinds = size === 1 ? 3 : size === 2 ? randInt(rng, 3, 4) : randInt(rng, 4, 5)
    const top = [9, 15, 25][size - 1]
    const others = sample(rng, range(2, top), kinds - 1).sort((a, b) => a - b)
    const target = randInt(rng, [6, 10, 20][size - 1], [20, 40, 60][size - 1])
    return { coins: [1, ...others], target }
  },

  // Nobody wants to tap a 1 coin fifteen times.
  fair(test) {
    const counts = this.greedy(test) as CoinsAnswer
    return counts.reduce((a, b) => a + b, 0) <= 10
  },

  greedy(test) {
    const counts = test.coins.map(() => 0)
    const order = test.coins.map((_, i) => i).sort((a, b) => test.coins[b] - test.coins[a])
    let left = test.target
    for (const i of order) {
      counts[i] = Math.floor(left / test.coins[i])
      left -= counts[i] * test.coins[i]
    }
    return counts
  },

  solve(test) {
    const { pick } = fewest(test)
    const counts = test.coins.map(() => 0)
    for (let amount = test.target; amount > 0; amount -= test.coins[pick[amount]]) {
      counts[pick[amount]]++
    }
    return counts
  },

  value(test, answer) {
    if (!Array.isArray(answer) || answer.length !== test.coins.length) return null
    let total = 0
    let used = 0
    for (let i = 0; i < answer.length; i++) {
      const count = answer[i]
      if (!Number.isInteger(count) || count < 0) return null
      total += count * test.coins[i]
      used += count
    }
    return total === test.target ? used : null
  },

  blank(test) {
    return test.coins.map(() => 0)
  },

  parse(text) {
    const input = new Reader(text)
    const kinds = input.int('k', 1, 6)
    const target = input.int('t', 1, 99)
    const values: number[] = []
    for (let i = 0; i < kinds; i++) values.push(input.int(`coin ${i + 1}`, 1, 50))
    input.end()
    if (new Set(values).size !== values.length) throw new InputError('Coin values must be distinct.')
    if (!values.includes(1)) throw new InputError('One coin must be worth 1, so every target can be paid.')
    return { coins: values.sort((a, b) => a - b), target }
  },

  format(test) {
    return `${test.coins.length} ${test.target}\n${test.coins.join(' ')}`
  },

  trace(test) {
    const { best } = fewest(test)
    return {
      caption: 'best[a]: fewest coins that make amount a',
      head: best.map((_, amount) => amount),
      rows: [{ label: 'best', cells: best }],
    }
  },
}
