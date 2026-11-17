import { Reader } from '../reader'
import { randInt } from '../rng'
import { isIndexList, type Problem } from '../types'

export interface Gig {
  s: number
  e: number
  v: number
}

export interface GigsTest {
  gigs: Gig[]
}

// Indices of the gigs accepted.
export type GigsAnswer = number[]

// Back-to-back gigs are fine: one may start the hour another ends.
export function clash(a: Gig, b: Gig): boolean {
  return a.s < b.e && b.s < a.e
}

// Gigs in order of end time, with best[i] = most pay from the first i of them
// and last[i] = how many of them end by the time gig i starts.
function plan(test: GigsTest) {
  const order = test.gigs
    .map((_, i) => i)
    .sort((a, b) => test.gigs[a].e - test.gigs[b].e || test.gigs[a].s - test.gigs[b].s || a - b)
  const ends = order.map((i) => test.gigs[i].e)
  const best = [0]
  const last: number[] = []
  order.forEach((index, i) => {
    const gig = test.gigs[index]
    // Binary search: number of earlier gigs with end ≤ this start.
    let lo = 0
    let hi = i
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (ends[mid] <= gig.s) lo = mid + 1
      else hi = mid
    }
    last.push(lo)
    best.push(Math.max(best[i], best[lo] + gig.v))
  })
  return { order, best, last }
}

export const gigs: Problem<GigsTest, GigsAnswer> = {
  id: 'gigs',
  letter: 'C',
  title: 'Double booked',
  tags: ['dp', 'sortings', 'binary search'],
  goal: 'max',
  unit: 'pay',
  statement: [
    'You have one day and a list of gig offers. Each gig has a start hour, an end hour and a pay. Accept a set of gigs that never overlap and earn as much as you can. A gig may start at the same hour another one ends.',
  ],
  inputFormat: [
    'The first line has one integer n, the number of gigs.',
    'Each of the next n lines has three integers s, e and v: start, end and pay.',
  ],
  constraints: ['1 ≤ n ≤ 10', '0 ≤ s < e ≤ 24', '1 ≤ v ≤ 99'],
  sample: '3\n0 4 10\n3 7 13\n6 10 10',
  greedyRule: 'Take the best-paid gig that does not clash with what you already took, and repeat.',
  technique: 'Weighted interval scheduling: sort by end time, binary search, DP',
  complexity: 'O(n log n) time, O(n) memory',
  recurrence: 'best[i] = max(best[i-1], v_i + best[last(i)])\nlast(i) = number of gigs that end by s_i',
  editorial: [
    'When every gig pays the same, "earliest finish first" is provably right, so greedy feels safe here. Pay changes that. In the sample the middle gig pays 13 and clashes with both others, which pay 10 each. Highest pay first takes 13 and stops. The two outer gigs pay 20.',
    'Ordering by pay ignores what a gig blocks. One long well-paid gig can sit across several shorter ones that are worth more in total.',
    'Sort the gigs by end time. For gig i there are two cases: skip it and keep best[i-1], or take it and add the best you can do with the gigs that end by its start. Those gigs are a prefix of the sorted list, so a binary search on end times finds where the prefix stops. That search is the log n in the running time.',
  ],

  generate(rng, size) {
    const count = [4, 6, 8][size - 1]
    const day = [10, 14, 18][size - 1]
    const list: Gig[] = []
    for (let i = 0; i < count; i++) {
      const length = randInt(rng, 2, Math.ceil(day / 2))
      const s = randInt(rng, 0, day - length)
      // Longer gigs pay more in total, shorter ones more per hour.
      list.push({ s, e: s + length, v: length * randInt(rng, 2, 4) + randInt(rng, 0, 5) })
    }
    return { gigs: list }
  },

  greedy(test) {
    const order = test.gigs
      .map((_, i) => i)
      .sort((a, b) => test.gigs[b].v - test.gigs[a].v || test.gigs[a].e - test.gigs[b].e || a - b)
    const taken: number[] = []
    for (const i of order) {
      if (taken.every((j) => !clash(test.gigs[i], test.gigs[j]))) taken.push(i)
    }
    return taken.sort((a, b) => a - b)
  },

  solve(test) {
    const { order, best, last } = plan(test)
    const taken: number[] = []
    let i = order.length
    while (i > 0) {
      if (best[i] === best[i - 1]) {
        i--
      } else {
        taken.push(order[i - 1])
        i = last[i - 1]
      }
    }
    return taken.sort((a, b) => a - b)
  },

  value(test, answer) {
    if (!isIndexList(answer, test.gigs.length)) return null
    let pay = 0
    for (let a = 0; a < answer.length; a++) {
      for (let b = a + 1; b < answer.length; b++) {
        if (clash(test.gigs[answer[a]], test.gigs[answer[b]])) return null
      }
      pay += test.gigs[answer[a]].v
    }
    return pay
  },

  blank() {
    return []
  },

  parse(text) {
    const input = new Reader(text)
    const count = input.int('n', 1, 10)
    const list: Gig[] = []
    for (let i = 0; i < count; i++) {
      const s = input.int(`s of gig ${i + 1}`, 0, 23)
      const e = input.int(`e of gig ${i + 1}`, s + 1, 24)
      const v = input.int(`v of gig ${i + 1}`, 1, 99)
      list.push({ s, e, v })
    }
    input.end()
    return { gigs: list }
  },

  format(test) {
    const lines = test.gigs.map((gig) => `${gig.s} ${gig.e} ${gig.v}`)
    return [String(test.gigs.length), ...lines].join('\n')
  },

  trace(test) {
    const { order, best } = plan(test)
    return {
      caption: 'Gigs sorted by end time; best[i] is the most pay from the first i',
      head: order.map((i) => `${test.gigs[i].s}-${test.gigs[i].e}`),
      rows: [
        { label: 'pay', cells: order.map((i) => test.gigs[i].v) },
        { label: 'best', cells: best.slice(1) },
      ],
    }
  },
}
