// Slow, obviously-correct answers to each problem. They share no code with the
// solvers in src/core/problems: each one tries everything and keeps the best.

import type { ClimbTest } from '../src/core/problems/climb'
import type { CoinsTest } from '../src/core/problems/coins'
import type { GigsTest } from '../src/core/problems/gigs'
import type { GridTest } from '../src/core/problems/grid'
import type { KnapsackTest } from '../src/core/problems/knapsack'
import type { RouteTest } from '../src/core/problems/route'
import type { TourTest } from '../src/core/problems/tour'

function subsets(count: number): number[][] {
  const all: number[][] = []
  for (let mask = 0; mask < 1 << count; mask++) {
    all.push([...Array(count).keys()].filter((i) => mask & (1 << i)))
  }
  return all
}

// Breadth-first search over amounts: the first time the target is reached is
// with the fewest coins.
function coins(test: CoinsTest): number {
  const steps = new Map([[0, 0]])
  const queue = [0]
  while (queue.length) {
    const amount = queue.shift() as number
    if (amount === test.target) return steps.get(amount) as number
    for (const coin of test.coins) {
      const next = amount + coin
      if (next <= test.target && !steps.has(next)) {
        steps.set(next, (steps.get(amount) as number) + 1)
        queue.push(next)
      }
    }
  }
  throw new Error('target cannot be paid')
}

function knapsack(test: KnapsackTest): number {
  let best = 0
  for (const picked of subsets(test.items.length)) {
    const weight = picked.reduce((sum, i) => sum + test.items[i].w, 0)
    const value = picked.reduce((sum, i) => sum + test.items[i].v, 0)
    if (weight <= test.capacity) best = Math.max(best, value)
  }
  return best
}

// Marks every hour a picked gig covers and rejects the set if an hour is
// covered twice.
function gigs(test: GigsTest): number {
  let best = 0
  for (const picked of subsets(test.gigs.length)) {
    const busy = new Array(24).fill(false)
    let pay = 0
    let ok = true
    for (const i of picked) {
      for (let hour = test.gigs[i].s; hour < test.gigs[i].e; hour++) {
        if (busy[hour]) ok = false
        busy[hour] = true
      }
      pay += test.gigs[i].v
    }
    if (ok) best = Math.max(best, pay)
  }
  return best
}

function grid(test: GridTest): number {
  const rows = test.cells.length
  const cols = test.cells[0].length
  const walk = (r: number, c: number): number => {
    if (r === rows - 1 && c === cols - 1) return test.cells[r][c]
    let best = -Infinity
    if (r + 1 < rows) best = Math.max(best, walk(r + 1, c))
    if (c + 1 < cols) best = Math.max(best, walk(r, c + 1))
    return test.cells[r][c] + best
  }
  return walk(0, 0)
}

// Every simple path from the start to the goal.
function route(test: RouteTest): number {
  let best = Infinity
  const seen = new Set([0])
  const go = (town: number, paid: number) => {
    if (town === test.n - 1) {
      best = Math.min(best, paid)
      return
    }
    for (const road of test.roads) {
      if (road.a !== town && road.b !== town) continue
      const other = road.a === town ? road.b : road.a
      if (seen.has(other)) continue
      seen.add(other)
      go(other, paid + road.w)
      seen.delete(other)
    }
  }
  go(0, 0)
  return best
}

function tour(test: TourTest): number {
  const stops = test.points.length - 1
  let best = Infinity
  const used = new Array(stops + 1).fill(false)
  const go = (here: number, visited: number, driven: number) => {
    if (visited === stops) {
      best = Math.min(best, driven)
      return
    }
    for (let stop = 1; stop <= stops; stop++) {
      if (used[stop]) continue
      used[stop] = true
      const [x1, y1] = test.points[here]
      const [x2, y2] = test.points[stop]
      go(stop, visited + 1, driven + Math.abs(x1 - x2) + Math.abs(y1 - y2))
      used[stop] = false
    }
  }
  go(0, 0, 0)
  return best
}

function climb(test: ClimbTest): number {
  let best = 0
  for (const picked of subsets(test.cards.length)) {
    if (picked.every((i, k) => k === 0 || test.cards[picked[k - 1]] < test.cards[i])) {
      best = Math.max(best, picked.length)
    }
  }
  return best
}

export const brute: Record<string, (test: any) => number> = { coins, knapsack, gigs, grid, route, tour, climb }
