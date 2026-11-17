// Prints the table that the README quotes. Run with: npm run stats
import { collectStats, STATS_SAMPLES, STATS_SEED, statsTable } from '../src/core/stats'

console.log(`${STATS_SAMPLES} random tests per problem and size, seed ${STATS_SEED}\n`)
console.log(statsTable(collectStats()))
