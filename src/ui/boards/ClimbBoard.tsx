import type { ClimbAnswer, ClimbTest } from '../../core/problems/climb'
import { type BoardKit, type BoardProps, plural } from './kit'

function Board({ test, answer, locked, onChange, complain }: BoardProps<ClimbTest, ClimbAnswer>) {
  const tallest = Math.max(...test.cards)

  const toggle = (i: number) => {
    if (locked) return
    if (answer.includes(i)) {
      onChange(answer.filter((k) => k !== i))
      return
    }
    const next = [...answer, i].sort((a, b) => a - b)
    const rising = next.every((pos, k) => k === 0 || test.cards[next[k - 1]] < test.cards[pos])
    if (rising) onChange(next)
    else complain('Picked cards have to keep rising from left to right.')
  }

  return (
    <div className="climb">
      {test.cards.map((card, i) => (
        <button
          key={i}
          className={answer.includes(i) ? 'card on' : 'card'}
          onClick={() => toggle(i)}
          aria-pressed={answer.includes(i)}
          aria-label={`Card ${card}`}
        >
          <span className="card-bar" style={{ height: `${20 + (120 * card) / tallest}px` }} />
          <span className="card-number">{card}</span>
        </button>
      ))}
    </div>
  )
}

export const climbKit: BoardKit<ClimbTest, ClimbAnswer> = {
  Board,
  status: (_test, answer) => `${plural(answer.length, 'card')} picked`,
  missing: (_test, answer) => (answer.length ? null : 'Pick at least one card.'),
}
