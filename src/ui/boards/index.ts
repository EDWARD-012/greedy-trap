import { climbKit } from './ClimbBoard'
import { coinsKit } from './CoinsBoard'
import { gigsKit } from './GigsBoard'
import { gridKit } from './GridBoard'
import type { BoardKit } from './kit'
import { knapsackKit } from './KnapsackBoard'
import { routeKit } from './RouteBoard'
import { tourKit } from './TourBoard'

export const boards: Record<string, BoardKit> = {
  coins: coinsKit,
  knapsack: knapsackKit,
  gigs: gigsKit,
  grid: gridKit,
  route: routeKit,
  tour: tourKit,
  climb: climbKit,
}
