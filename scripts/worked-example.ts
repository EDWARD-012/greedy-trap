import { judge } from '../src/core/judge'
import { practiceLevel } from '../src/core/levels'
import { coins, type CoinsAnswer, type CoinsTest } from '../src/core/problems/coins'

// Writes counts out as the coins themselves, biggest first: "6 5 5".
function spell(test: CoinsTest, counts: CoinsAnswer): string {
  return test.coins
    .flatMap((coin, i) => new Array<number>(counts[i]).fill(coin))
    .reverse()
    .join(' ')
}

// The worked example in the README: one level, greedy against the solver,
// then four answers through the judge.
export function workedExample(): string {
  const level = practiceLevel(coins, 1)
  const test = level.test as CoinsTest
  const greedy = coins.greedy(test) as CoinsAnswer
  const best = coins.solve(test)

  const lines = [
    `Problem ${coins.letter}. ${coins.title}, practice level 1 (seed ${coins.id}/${level.seed})`,
    '',
    'Input',
    ...coins.format(test).split('\n').map((line) => `  ${line}`),
    '',
    `Greedy pays  ${spell(test, greedy)}  (${coins.value(test, greedy)} coins)`,
    `Solver pays  ${spell(test, best)}  (${coins.value(test, best)} coins)`,
    '',
    'Four answers through the judge',
  ]

  // Counts of the 1, 5 and 6 coins.
  const answers: CoinsAnswer[] = [best, greedy, [1, 3, 0], [0, 0, 3]]
  for (const answer of answers) {
    const result = judge(coins, test, answer)
    const verdict =
      result.verdict === 'AC'
        ? 'Accepted'
        : `Wrong answer on test ${result.failedTest} (${result.tests[(result.failedTest as number) - 1].name})`
    lines.push(`  ${spell(test, answer).padEnd(12)} ${verdict}`)
  }
  return lines.join('\n')
}
