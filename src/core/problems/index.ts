import type { Problem } from '../types'
import { climb } from './climb'
import { coins } from './coins'
import { gigs } from './gigs'
import { grid } from './grid'
import { knapsack } from './knapsack'
import { route } from './route'
import { tour } from './tour'

export const problems: Problem[] = [coins, knapsack, gigs, grid, route, tour, climb]

export function findProblem(id: string): Problem | undefined {
  return problems.find((problem) => problem.id === id)
}
