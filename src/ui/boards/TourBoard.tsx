import type { CSSProperties } from 'react'
import { blocks, type TourAnswer, type TourTest } from '../../core/problems/tour'
import { type BoardKit, type BoardProps, pressable } from './kit'

const SIDE = 420
const PAD = 30

function driven(test: TourTest, answer: TourAnswer): number {
  let here = 0
  let total = 0
  for (const stop of answer) {
    total += blocks(test.points[here], test.points[stop])
    here = stop
  }
  return total
}

function Board({ test, answer, locked, onChange }: BoardProps<TourTest, TourAnswer>) {
  const lines = Math.max(5, ...test.points.flat()) + 1
  const gap = (SIDE - 2 * PAD) / (lines - 1)
  const at = (i: number): [number, number] => [PAD + test.points[i][0] * gap, PAD + test.points[i][1] * gap]

  const click = (stop: number) => {
    if (locked) return
    const visited = answer.indexOf(stop)
    onChange(visited === -1 ? [...answer, stop] : answer.slice(0, visited + 1))
  }

  // Streets are a grid, so each leg is drawn along them: across, then up or
  // down. One path per leg, so a new leg draws itself when it is added.
  const legs = answer.map((stop, k) => {
    const [fromX, fromY] = at(k === 0 ? 0 : answer[k - 1])
    const [x, y] = at(stop)
    return { key: `${k}-${stop}`, d: `M ${fromX} ${fromY} H ${x} V ${y}` }
  })

  return (
    <svg className="tour" viewBox={`0 0 ${SIDE} ${SIDE}`} role="group" aria-label="Street grid with the depot and stops">
      {Array.from({ length: lines }, (_, i) => (
        <g key={i} className="street">
          <line x1={PAD} x2={SIDE - PAD} y1={PAD + i * gap} y2={PAD + i * gap} />
          <line y1={PAD} y2={SIDE - PAD} x1={PAD + i * gap} x2={PAD + i * gap} />
        </g>
      ))}
      {legs.map((leg) => (
        <path key={leg.key} className="leg" pathLength={1} d={leg.d} />
      ))}
      <g
        className="depot"
        {...pressable('Depot. Click to clear the route', () => {
          if (!locked) onChange([])
        })}
      >
        <rect x={at(0)[0] - 14} y={at(0)[1] - 14} width={28} height={28} rx={7} />
        <text x={at(0)[0]} y={at(0)[1] + 5} textAnchor="middle">
          D
        </text>
      </g>
      {test.points.slice(1).map((_, k) => {
        const stop = k + 1
        const order = answer.indexOf(stop)
        const [x, y] = at(stop)
        const classes = ['stop']
        if (order !== -1) classes.push('on')
        if (order !== -1 && order === answer.length - 1) classes.push('head')
        return (
          <g
            key={stop}
            className={classes.join(' ')}
            style={{ '--i': stop } as CSSProperties}
            {...pressable(`Stop ${stop}${order !== -1 ? `, visited ${order + 1}` : ''}`, () => click(stop))}
          >
            <circle cx={x} cy={y} r={16} />
            <text x={x} y={y + 5} textAnchor="middle">
              {stop}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export const tourKit: BoardKit<TourTest, TourAnswer> = {
  Board,
  status: (test, answer) => `${driven(test, answer)} blocks, ${answer.length} of ${test.points.length - 1} stops`,
  missing: (test, answer) => (answer.length === test.points.length - 1 ? null : 'Visit every stop first.'),
}
