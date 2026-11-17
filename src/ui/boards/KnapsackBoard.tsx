import type { KnapsackAnswer, KnapsackTest } from '../../core/problems/knapsack'
import { type BoardKit, type BoardProps, plural } from './kit'

const weight = (test: KnapsackTest, answer: KnapsackAnswer) => answer.reduce((sum, i) => sum + test.items[i].w, 0)
const worth = (test: KnapsackTest, answer: KnapsackAnswer) => answer.reduce((sum, i) => sum + test.items[i].v, 0)

function Board({ test, answer, locked, onChange, complain }: BoardProps<KnapsackTest, KnapsackAnswer>) {
  const packed = weight(test, answer)

  const toggle = (i: number) => {
    if (locked) return
    if (answer.includes(i)) {
      onChange(answer.filter((k) => k !== i))
    } else if (packed + test.items[i].w > test.capacity) {
      complain(`That needs ${test.items[i].w} kg and only ${test.capacity - packed} kg is free.`)
    } else {
      onChange([...answer, i].sort((a, b) => a - b))
    }
  }

  return (
    <div className="knapsack">
      <div className="bag">
        <div className="bag-bar" style={{ gridTemplateColumns: `repeat(${test.capacity}, 1fr)` }}>
          {answer.map((i) => (
            <div key={i} className="bag-item" style={{ gridColumn: `span ${test.items[i].w}` }}>
              {test.items[i].v}
            </div>
          ))}
        </div>
        <div className="bag-label">
          {packed} / {test.capacity} kg
        </div>
      </div>
      <div className="items">
        {test.items.map((item, i) => (
          <button
            key={i}
            className={answer.includes(i) ? 'item on' : 'item'}
            style={{ flexGrow: item.w, flexBasis: `${item.w * 16}px` }}
            onClick={() => toggle(i)}
            aria-pressed={answer.includes(i)}
            aria-label={`Item worth ${item.v}, ${item.w} kg`}
          >
            <span className="item-value">{item.v}</span>
            <span className="item-weight">{item.w} kg</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export const knapsackKit: BoardKit<KnapsackTest, KnapsackAnswer> = {
  Board,
  status: (test, answer) =>
    `value ${worth(test, answer)}, ${plural(answer.length, 'item')}, ${weight(test, answer)} of ${test.capacity} kg`,
  missing: (_test, answer) => (answer.length ? null : 'Pack at least one item.'),
}
