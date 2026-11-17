import { Reader } from '../reader'
import { randInt } from '../rng'
import { isIndexList, type Problem } from '../types'

export interface Item {
  w: number
  v: number
}

export interface KnapsackTest {
  capacity: number
  items: Item[]
}

// Indices of the items taken.
export type KnapsackAnswer = number[]

// table[i][c]: best value using only the first i items with capacity c.
function fill(test: KnapsackTest): number[][] {
  const table = [new Array<number>(test.capacity + 1).fill(0)]
  test.items.forEach((item, i) => {
    const row = table[i].slice()
    for (let c = item.w; c <= test.capacity; c++) {
      row[c] = Math.max(table[i][c], table[i][c - item.w] + item.v)
    }
    table.push(row)
  })
  return table
}

export const knapsack: Problem<KnapsackTest, KnapsackAnswer> = {
  id: 'knapsack',
  letter: 'B',
  title: 'Carry-on',
  tags: ['dp', 'knapsack'],
  goal: 'max',
  unit: 'value',
  statement: [
    'Each item has a weight and a value. Pack the bag so the total weight stays within the limit and the total value is as large as possible. Every item is taken whole or left behind.',
  ],
  inputFormat: [
    'The first line has two integers n and c: the number of items and the weight limit.',
    'Each of the next n lines has two integers w and v, the weight and value of one item.',
  ],
  constraints: ['1 ≤ n ≤ 10', '1 ≤ c ≤ 60', '1 ≤ w ≤ 60', '1 ≤ v ≤ 99'],
  sample: '3 10\n6 30\n5 20\n5 20',
  greedyRule: 'Sort by value per unit of weight and take every item that still fits.',
  technique: '0/1 knapsack DP',
  complexity: 'O(n · c) time and memory',
  recurrence: 'f[i][c] = max(f[i-1][c], f[i-1][c - w_i] + v_i)',
  editorial: [
    'Value per weight is the right rule when you may cut items into pieces. Here you cannot, and that is where it breaks. With a limit of 10, an item of weight 6 and value 30 has the best ratio, so greedy takes it and the other two items of weight 5 no longer fit. Those two together are worth 40.',
    'What greedy wastes is the leftover space. A dense item that leaves an awkward gap can lose to two plainer items that fill the bag.',
    'The DP asks one question per item: with capacity c, is it better to skip item i or to take it and solve the rest with capacity c - w_i? f[i][c] holds the answer for the first i items. The last cell is the best value, and walking the table backwards tells you which items were taken.',
  ],

  generate(rng, size) {
    const count = size === 1 ? 4 : size === 2 ? randInt(rng, 5, 6) : randInt(rng, 7, 8)
    const heaviest = [8, 10, 12][size - 1]
    const items: Item[] = []
    for (let i = 0; i < count; i++) {
      const w = randInt(rng, 2, heaviest)
      // Value follows weight loosely, so no item is an obvious throwaway.
      items.push({ w, v: w * randInt(rng, 2, 5) + randInt(rng, 0, 4) })
    }
    const total = items.reduce((sum, item) => sum + item.w, 0)
    const capacity = Math.max(heaviest, Math.floor(total * (0.4 + 0.2 * rng())))
    return { capacity, items }
  },

  greedy(test) {
    const order = test.items
      .map((_, i) => i)
      .sort((a, b) => {
        const x = test.items[a]
        const y = test.items[b]
        // Compare v/w as cross products to stay in integers.
        return y.v * x.w - x.v * y.w || y.v - x.v || a - b
      })
    const taken: number[] = []
    let room = test.capacity
    for (const i of order) {
      if (test.items[i].w <= room) {
        taken.push(i)
        room -= test.items[i].w
      }
    }
    return taken.sort((a, b) => a - b)
  },

  solve(test) {
    const table = fill(test)
    const taken: number[] = []
    let c = test.capacity
    for (let i = test.items.length; i > 0; i--) {
      if (table[i][c] !== table[i - 1][c]) {
        taken.push(i - 1)
        c -= test.items[i - 1].w
      }
    }
    return taken.reverse()
  },

  value(test, answer) {
    if (!isIndexList(answer, test.items.length)) return null
    let weight = 0
    let value = 0
    for (const i of answer) {
      weight += test.items[i].w
      value += test.items[i].v
    }
    return weight <= test.capacity ? value : null
  },

  blank() {
    return []
  },

  parse(text) {
    const input = new Reader(text)
    const count = input.int('n', 1, 10)
    const capacity = input.int('c', 1, 60)
    const items: Item[] = []
    for (let i = 0; i < count; i++) {
      const w = input.int(`w of item ${i + 1}`, 1, 60)
      const v = input.int(`v of item ${i + 1}`, 1, 99)
      items.push({ w, v })
    }
    input.end()
    return { capacity, items }
  },

  format(test) {
    const lines = test.items.map((item) => `${item.w} ${item.v}`)
    return [`${test.items.length} ${test.capacity}`, ...lines].join('\n')
  },

  trace(test) {
    const table = fill(test)
    return {
      caption: 'f[n][c]: best value with all n items and capacity c',
      head: table[0].map((_, c) => c),
      rows: [{ label: 'f', cells: table[test.items.length] }],
    }
  },
}
