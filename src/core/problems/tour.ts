import { InputError, Reader } from '../reader'
import { randInt, range, sample } from '../rng'
import type { Problem } from '../types'

export type Point = [number, number]

// points[0] is the depot, the rest are stops.
export interface TourTest {
  points: Point[]
}

// The stops in visiting order: each of 1..n-1 exactly once.
export type TourAnswer = number[]

export function blocks(a: Point, b: Point): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])
}

// Held-Karp. cost[mask][j] is the shortest drive that starts at the depot,
// visits exactly the stops in mask and ends at stop j (stop j is point j + 1).
function heldKarp(test: TourTest): number[] {
  const stops = test.points.length - 1
  const full = (1 << stops) - 1
  const cost = Array.from({ length: full + 1 }, () => new Array<number>(stops).fill(Infinity))
  const before = Array.from({ length: full + 1 }, () => new Array<number>(stops).fill(-1))
  for (let j = 0; j < stops; j++) cost[1 << j][j] = blocks(test.points[0], test.points[j + 1])
  for (let mask = 1; mask <= full; mask++) {
    for (let j = 0; j < stops; j++) {
      if (cost[mask][j] === Infinity) continue
      for (let k = 0; k < stops; k++) {
        if (mask & (1 << k)) continue
        const next = cost[mask][j] + blocks(test.points[j + 1], test.points[k + 1])
        if (next < cost[mask | (1 << k)][k]) {
          cost[mask | (1 << k)][k] = next
          before[mask | (1 << k)][k] = j
        }
      }
    }
  }
  let end = 0
  for (let j = 1; j < stops; j++) if (cost[full][j] < cost[full][end]) end = j
  const order: number[] = []
  let mask = full
  while (end !== -1) {
    order.push(end + 1)
    const previous = before[mask][end]
    mask ^= 1 << end
    end = previous
  }
  return order.reverse()
}

export const tour: Problem<TourTest, TourAnswer> = {
  id: 'tour',
  letter: 'F',
  title: 'Last mile',
  tags: ['bitmasks', 'dp', 'tsp'],
  goal: 'min',
  unit: 'blocks',
  statement: [
    'A courier leaves the depot and has to visit every stop once. The streets form a grid, so driving between two points costs the blocks between them: |x1 - x2| + |y1 - y2|. The courier does not come back to the depot. Find the shortest route.',
  ],
  inputFormat: [
    'The first line has one integer n, the number of points.',
    'Each of the next n lines has two integers x and y. The first point is the depot, the rest are stops.',
  ],
  constraints: ['2 ≤ n ≤ 9', '0 ≤ x, y ≤ 9', 'All points are distinct.'],
  sample: '4\n4 0\n5 0\n2 0\n9 0',
  greedyRule: 'Always drive to the nearest stop you have not visited. On a tie take the lower-numbered stop.',
  technique: 'Bitmask DP (Held-Karp)',
  complexity: 'O(2^n · n²) time, O(2^n · n) memory',
  recurrence: 'cost[{j}][j] = d(depot, j)\ncost[S ∪ {k}][k] = min(cost[S][j] + d(j, k)) over j in S',
  editorial: [
    'The sample puts everything on one street: the depot at 4, stops at 5, 2 and 9. The nearest stop is at 5, one block away. From there greedy goes back to 2 and then all the way to 9: 1 + 3 + 7 = 11 blocks. Driving to 2 first and then sweeping right is 2 + 3 + 4 = 9.',
    'Nearest neighbour gets pulled back and forth. A stop that is close now can leave a far-away stop stranded for later.',
    'No ordering rule is known to work, so the solver tries every order without repeating work. What matters about a partial route is only which stops are done and where you are standing, so the state is a pair (set of visited stops, last stop). The set fits in the bits of one integer. That gives 2^n · n states and n ways to extend each one, which is easy for n up to about 20. Trying all n! orders would be over two quintillion routes at 20.',
  ],

  generate(rng, size) {
    const stops = size === 1 ? 4 : size === 2 ? randInt(rng, 5, 6) : 7
    const side = [6, 8, 10][size - 1]
    const cells = sample(rng, range(0, side * side - 1), stops + 1)
    return { points: cells.map((cell): Point => [cell % side, Math.floor(cell / side)]) }
  },

  greedy(test) {
    const left = new Set(range(1, test.points.length - 1))
    const order: number[] = []
    let here = 0
    while (left.size > 0) {
      let pick = -1
      for (const stop of left) {
        if (pick === -1 || blocks(test.points[here], test.points[stop]) < blocks(test.points[here], test.points[pick])) {
          pick = stop
        }
      }
      left.delete(pick)
      order.push(pick)
      here = pick
    }
    return order
  },

  solve(test) {
    return heldKarp(test)
  },

  value(test, answer) {
    const stops = test.points.length - 1
    if (!Array.isArray(answer) || answer.length !== stops) return null
    const seen = new Set<number>()
    let total = 0
    let here = 0
    for (const stop of answer) {
      if (!Number.isInteger(stop) || stop < 1 || stop > stops || seen.has(stop)) return null
      seen.add(stop)
      total += blocks(test.points[here], test.points[stop])
      here = stop
    }
    return total
  },

  blank() {
    return []
  },

  parse(text) {
    const input = new Reader(text)
    const n = input.int('n', 2, 9)
    const points: Point[] = []
    const seen = new Set<string>()
    for (let i = 0; i < n; i++) {
      const x = input.int(`x of point ${i + 1}`, 0, 9)
      const y = input.int(`y of point ${i + 1}`, 0, 9)
      if (seen.has(`${x},${y}`)) throw new InputError(`Point ${i + 1} repeats an earlier point.`)
      seen.add(`${x},${y}`)
      points.push([x, y])
    }
    input.end()
    return { points }
  },

  format(test) {
    return [String(test.points.length), ...test.points.map((p) => `${p[0]} ${p[1]}`)].join('\n')
  },

  trace(test) {
    const order = heldKarp(test)
    const running: number[] = []
    let here = 0
    let total = 0
    for (const stop of order) {
      total += blocks(test.points[here], test.points[stop])
      running.push(total)
      here = stop
    }
    return {
      caption: `Best order out of ${1 << (test.points.length - 1)} subsets of stops`,
      head: order.map((stop) => `stop ${stop}`),
      rows: [{ label: 'blocks so far', cells: running }],
    }
  },
}
