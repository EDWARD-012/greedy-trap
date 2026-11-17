import { Reader } from '../reader'
import { range, sample } from '../rng'
import type { Problem } from '../types'

export interface ClimbTest {
  cards: number[]
}

// Positions of the picked cards, left to right.
export type ClimbAnswer = number[]

// Patience sorting. tails[k] is the position of the smallest card that can end
// a climb of length k + 1; a binary search finds where each new card goes.
function patience(test: ClimbTest): { length: number[]; before: number[]; tails: number[] } {
  const { cards } = test
  const tails: number[] = []
  const before: number[] = []
  const length: number[] = []
  cards.forEach((card, i) => {
    let lo = 0
    let hi = tails.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cards[tails[mid]] < card) lo = mid + 1
      else hi = mid
    }
    before.push(lo > 0 ? tails[lo - 1] : -1)
    length.push(lo + 1)
    tails[lo] = i
  })
  return { length, before, tails }
}

export const climb: Problem<ClimbTest, ClimbAnswer> = {
  id: 'climb',
  letter: 'G',
  title: 'Staircase',
  tags: ['binary search', 'dp', 'lis'],
  goal: 'max',
  unit: 'cards',
  statement: [
    'Cards lie in a row. Pick some of them, keeping their order, so that every picked card is larger than the one picked before it. Pick as many cards as you can.',
  ],
  inputFormat: ['The first line has one integer n.', 'The second line has n integers, the cards from left to right.'],
  constraints: ['1 ≤ n ≤ 12', '1 ≤ card ≤ 99'],
  sample: '5\n9 1 2 3 4',
  greedyRule: 'Take the first card, then every later card that is larger than your last pick.',
  technique: 'Longest increasing subsequence with binary search',
  complexity: 'O(n log n) time, O(n) memory',
  recurrence: 'len[i] = 1 + max(len[j]) over j < i with card[j] < card[i]',
  editorial: [
    'In the sample greedy grabs the 9 and can never pick again. Skipping it gives 1, 2, 3, 4.',
    'A large card early on is a bad thing to be holding, because it rules out everything smaller that follows. Greedy has no way to give a card back.',
    'The plain DP asks, for each card, what the longest climb ending on it is, by looking at every smaller card to its left. That is O(n²). The faster version keeps one number per climb length: the smallest card that can end a climb of that length. Those numbers are always sorted, so each new card finds its place by binary search and either extends the longest climb or lowers one of the ends. A lower end is easier to build on later, which is the choice greedy refuses to make.',
  ],

  generate(rng, size) {
    const count = [6, 8, 10][size - 1]
    return { cards: sample(rng, range(1, [20, 40, 60][size - 1]), count) }
  },

  greedy(test) {
    const picked = [0]
    for (let i = 1; i < test.cards.length; i++) {
      if (test.cards[i] > test.cards[picked[picked.length - 1]]) picked.push(i)
    }
    return picked
  },

  solve(test) {
    const { before, tails } = patience(test)
    const picked: number[] = []
    for (let i = tails[tails.length - 1]; i !== -1; i = before[i]) picked.push(i)
    return picked.reverse()
  },

  value(test, answer) {
    if (!Array.isArray(answer)) return null
    for (let k = 0; k < answer.length; k++) {
      const i = answer[k]
      if (!Number.isInteger(i) || i < 0 || i >= test.cards.length) return null
      if (k > 0 && (i <= answer[k - 1] || test.cards[i] <= test.cards[answer[k - 1]])) return null
    }
    return answer.length
  },

  blank() {
    return []
  },

  parse(text) {
    const input = new Reader(text)
    const count = input.int('n', 1, 12)
    const cards: number[] = []
    for (let i = 0; i < count; i++) cards.push(input.int(`card ${i + 1}`, 1, 99))
    input.end()
    return { cards }
  },

  format(test) {
    return `${test.cards.length}\n${test.cards.join(' ')}`
  },

  trace(test) {
    const { length } = patience(test)
    return {
      caption: 'len[i]: longest climb that ends on each card',
      head: test.cards,
      rows: [{ label: 'len', cells: length }],
    }
  },
}
