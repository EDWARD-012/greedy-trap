import type { CSSProperties } from 'react'
import type { CoinsAnswer, CoinsTest } from '../../core/problems/coins'
import { type BoardKit, type BoardProps, plural } from './kit'

const paid = (test: CoinsTest, answer: CoinsAnswer) => answer.reduce((sum, count, i) => sum + count * test.coins[i], 0)
const used = (answer: CoinsAnswer) => answer.reduce((sum, count) => sum + count, 0)

function Board({ test, answer, locked, onChange, complain }: BoardProps<CoinsTest, CoinsAnswer>) {
  const total = paid(test, answer)

  const change = (i: number, by: number) => {
    if (locked) return
    if (by > 0 && total + test.coins[i] > test.target) {
      complain(`A ${test.coins[i]} would take you past ${test.target}.`)
      return
    }
    onChange(answer.map((count, k) => (k === i ? count + by : count)))
  }

  // Biggest coins first, the way you would lay them on a counter.
  const tray = test.coins.flatMap((_, i) => new Array<number>(answer[i]).fill(i)).reverse()
  const biggest = test.coins[test.coins.length - 1]

  return (
    <div className="coins">
      <div className="meter" role="img" aria-label={`${total} of ${test.target} paid`}>
        <div className="meter-fill" style={{ transform: `scaleX(${total / test.target})` }} />
        <span className="meter-text">
          {total} / {test.target}
        </span>
      </div>
      <div className="coin-row">
        {test.coins.map((coin, i) => (
          <button
            key={coin}
            className="coin"
            style={{ '--grow': Math.sqrt(coin / biggest), '--i': i } as CSSProperties}
            onClick={() => change(i, 1)}
            aria-label={`Add a ${coin} coin`}
          >
            {coin}
          </button>
        ))}
      </div>
      <div className="tray">
        {tray.length === 0 && <span className="tray-empty">Tap a coin to pay with it</span>}
        {tray.map((i, k) => (
          <button
            key={`${i}-${k}`}
            className="coin coin-small"
            onClick={() => change(i, -1)}
            aria-label={`Take back a ${test.coins[i]} coin`}
          >
            {test.coins[i]}
          </button>
        ))}
      </div>
    </div>
  )
}

export const coinsKit: BoardKit<CoinsTest, CoinsAnswer> = {
  Board,
  status: (test, answer) => `${plural(used(answer), 'coin')}, ${paid(test, answer)} of ${test.target} paid`,
  missing: (test, answer) =>
    paid(test, answer) === test.target ? null : `Pay exactly ${test.target} first. You are at ${paid(test, answer)}.`,
}
