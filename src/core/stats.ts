import { baseline } from './judge'
import { problems } from './problems'
import { createRng } from './rng'
import type { Problem, Size } from './types'

export interface SizeStats {
  // Share of random playable tests where greedy does not reach the optimum.
  trapRate: number
  // On those tests, how far greedy is from the optimum, as a share of the optimum.
  meanGap: number
  worstGap: number
}

export interface ProblemStats {
  problem: Problem
  sizes: SizeStats[]
}

export const STATS_SEED = '7780'
export const STATS_SAMPLES = 2000

function measure(problem: Problem, size: Size, samples: number, seed: string): SizeStats {
  const rng = createRng(`stats/${seed}/${problem.id}/${size}`)
  let traps = 0
  let gapSum = 0
  let worstGap = 0
  let done = 0
  while (done < samples) {
    const test = problem.generate(rng, size)
    if (problem.fair && !problem.fair(test)) continue
    done++
    const { greedy, optimal } = baseline(problem, test)
    if (greedy === null || greedy === optimal) continue
    traps++
    const gap = Math.abs(greedy - optimal) / optimal
    gapSum += gap
    worstGap = Math.max(worstGap, gap)
  }
  return { trapRate: traps / samples, meanGap: traps ? gapSum / traps : 0, worstGap }
}

export function collectStats(samples = STATS_SAMPLES, seed = STATS_SEED): ProblemStats[] {
  return problems.map((problem) => ({
    problem,
    sizes: ([1, 2, 3] as Size[]).map((size) => measure(problem, size, samples, seed)),
  }))
}

const percent = (share: number) => `${(share * 100).toFixed(1)}%`

export function statsTable(stats: ProblemStats[]): string {
  const lines = [
    '| Problem | Solver | Greedy loses: small | medium | large | Mean gap (medium) | Worst gap (medium) |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const { problem, sizes } of stats) {
    lines.push(
      `| ${problem.letter}. ${problem.title} | ${problem.technique} | ${percent(sizes[0].trapRate)} | ${percent(sizes[1].trapRate)} | ${percent(sizes[2].trapRate)} | ${percent(sizes[1].meanGap)} | ${percent(sizes[1].worstGap)} |`,
    )
  }
  return lines.join('\n')
}
