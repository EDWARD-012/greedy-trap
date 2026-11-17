import { MinHeap } from '../heap'
import { InputError, Reader } from '../reader'
import { randInt, range, sample } from '../rng'
import type { Problem } from '../types'

export interface Road {
  a: number
  b: number
  w: number
}

// Towns are numbered from 0. The start is town 0 and the goal is town n - 1.
export interface RouteTest {
  n: number
  roads: Road[]
  // Where to draw each town, in 0..1. Only generated tests have one.
  layout?: [number, number][]
}

// The towns visited in order, start and goal included.
export type RouteAnswer = number[]

type Neighbour = { to: number; w: number }

export function neighbours(test: RouteTest): Neighbour[][] {
  const list: Neighbour[][] = Array.from({ length: test.n }, () => [])
  for (const road of test.roads) {
    list[road.a].push({ to: road.b, w: road.w })
    list[road.b].push({ to: road.a, w: road.w })
  }
  return list
}

function dijkstra(test: RouteTest): { dist: number[]; from: number[] } {
  const next = neighbours(test)
  const dist = new Array<number>(test.n).fill(Infinity)
  const from = new Array<number>(test.n).fill(-1)
  const heap = new MinHeap<[number, number]>((x, y) => x[0] < y[0])
  dist[0] = 0
  heap.push([0, 0])
  while (heap.size > 0) {
    const [d, town] = heap.pop() as [number, number]
    // A stale entry: this town was already settled through a shorter way.
    if (d > dist[town]) continue
    for (const { to, w } of next[town]) {
      if (d + w < dist[to]) {
        dist[to] = d + w
        from[to] = town
        heap.push([dist[to], to])
      }
    }
  }
  return { dist, from }
}

const roadKey = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`

export const route: Problem<RouteTest, RouteAnswer> = {
  id: 'route',
  letter: 'E',
  title: 'Toll roads',
  tags: ['graphs', 'shortest paths', 'heaps'],
  goal: 'min',
  unit: 'toll',
  statement: [
    'Towns are joined by two-way roads, and every road charges a toll. Drive from the start S to the goal T and pay as little as you can in total.',
  ],
  inputFormat: [
    'The first line has two integers n and m: the number of towns and roads. The start is town 1 and the goal is town n.',
    'Each of the next m lines has three integers a, b and w: a road between towns a and b with toll w.',
  ],
  constraints: ['2 ≤ n ≤ 12', '1 ≤ m ≤ 24', '1 ≤ w ≤ 99', 'No road joins a town to itself, no pair is joined twice, and town n is reachable from town 1.'],
  sample: '4 4\n1 2 1\n2 4 9\n1 3 3\n3 4 3',
  greedyRule: 'From the town you are in, take the cheapest road to a town you have not visited.',
  technique: "Dijkstra's algorithm with a binary heap",
  complexity: 'O((n + m) log n) time',
  recurrence: 'dist[S] = 0\ndist[v] = min(dist[u] + w) over roads (u, v, w)',
  editorial: [
    'In the sample the road out of town 1 that costs 1 leads to town 2, and the only way on from there costs 9. Total 10. The road that costs 3 looks worse and reaches the goal for 6.',
    "The funny part is that Dijkstra's algorithm is greedy too. It just makes its choice over the right thing. The walker picks the cheapest next road. Dijkstra picks the unsettled town with the smallest total distance from the start, and that choice can be proved safe: with no negative tolls, no later path can reach that town for less.",
    'A binary heap hands out the closest unsettled town in O(log n). When a town gets a better distance it is pushed again, and the old entry is skipped when it comes out. The numbers in the table below are those final distances.',
  ],

  generate(rng, size) {
    const widths = [
      [1, 2, 2, 1],
      [1, 3, 3, 1],
      [1, 2, 3, 3, 1],
    ][size - 1]
    const columns: number[][] = []
    let n = 0
    for (const width of widths) {
      columns.push(range(n, n + width - 1))
      n += width
    }
    const roads = new Map<string, Road>()
    const join = (a: number, b: number) => {
      const key = roadKey(a, b)
      if (!roads.has(key)) roads.set(key, { a: Math.min(a, b), b: Math.max(a, b), w: randInt(rng, 1, 9) })
    }
    for (let c = 0; c + 1 < columns.length; c++) {
      const here = columns[c]
      const ahead = columns[c + 1]
      for (const a of here) {
        for (const b of sample(rng, ahead, randInt(rng, 1, Math.min(2, ahead.length)))) join(a, b)
      }
      // Nobody in the next column may be left without a way in.
      for (const b of ahead) {
        if (!here.some((a) => roads.has(roadKey(a, b)))) join(here[randInt(rng, 0, here.length - 1)], b)
      }
    }
    for (const column of columns) {
      for (let i = 0; i + 1 < column.length; i++) {
        if (rng() < 0.5) join(column[i], column[i + 1])
      }
    }
    const layout = columns.flatMap((column, c) =>
      column.map((_, r): [number, number] => [c / (columns.length - 1), (r + 1) / (column.length + 1)]),
    )
    return { n, roads: [...roads.values()], layout }
  },

  // The walker can drive into a dead end. Those tests are fine as hacks but
  // make a confusing level, so generated levels skip them.
  fair(test) {
    return this.greedy(test) !== null
  },

  greedy(test) {
    const next = neighbours(test)
    const seen = new Set([0])
    const path = [0]
    let town = 0
    while (town !== test.n - 1) {
      let pick: Neighbour | null = null
      for (const option of next[town]) {
        if (seen.has(option.to)) continue
        if (!pick || option.w < pick.w || (option.w === pick.w && option.to < pick.to)) pick = option
      }
      if (!pick) return null
      town = pick.to
      seen.add(town)
      path.push(town)
    }
    return path
  },

  solve(test) {
    const { from } = dijkstra(test)
    const path: number[] = []
    for (let town = test.n - 1; town !== -1; town = from[town]) path.push(town)
    return path.reverse()
  },

  value(test, answer) {
    if (!Array.isArray(answer) || answer.length < 2 || answer.length > 4 * test.n) return null
    if (answer[0] !== 0 || answer[answer.length - 1] !== test.n - 1) return null
    const tolls = new Map<string, number>()
    for (const road of test.roads) tolls.set(roadKey(road.a, road.b), road.w)
    let total = 0
    for (let i = 0; i + 1 < answer.length; i++) {
      const a = answer[i]
      const b = answer[i + 1]
      if (!Number.isInteger(a) || !Number.isInteger(b)) return null
      const toll = tolls.get(roadKey(a, b))
      if (toll === undefined) return null
      total += toll
    }
    return total
  },

  blank() {
    return [0]
  },

  parse(text) {
    const input = new Reader(text)
    const n = input.int('n', 2, 12)
    const m = input.int('m', 1, 24)
    const roads: Road[] = []
    const seen = new Set<string>()
    for (let i = 0; i < m; i++) {
      const a = input.int(`a of road ${i + 1}`, 1, n) - 1
      const b = input.int(`b of road ${i + 1}`, 1, n) - 1
      const w = input.int(`w of road ${i + 1}`, 1, 99)
      if (a === b) throw new InputError(`Road ${i + 1} joins town ${a + 1} to itself.`)
      if (seen.has(roadKey(a, b))) throw new InputError(`Towns ${a + 1} and ${b + 1} are joined twice.`)
      seen.add(roadKey(a, b))
      roads.push({ a: Math.min(a, b), b: Math.max(a, b), w })
    }
    input.end()
    const test = { n, roads }
    if (dijkstra(test).dist[n - 1] === Infinity) throw new InputError(`Town ${n} cannot be reached from town 1.`)
    return test
  },

  format(test) {
    const lines = test.roads.map((road) => `${road.a + 1} ${road.b + 1} ${road.w}`)
    return [`${test.n} ${test.roads.length}`, ...lines].join('\n')
  },

  trace(test) {
    const { dist } = dijkstra(test)
    return {
      caption: 'dist[v]: cheapest total toll from S to each town',
      head: dist.map((_, town) => (town === 0 ? 'S' : town === test.n - 1 ? 'T' : town + 1)),
      rows: [{ label: 'dist', cells: dist.map((d) => (d === Infinity ? '∞' : d)) }],
    }
  },
}
