import type { CSSProperties } from 'react'
import type { RouteAnswer, RouteTest } from '../../core/problems/route'
import { type BoardKit, type BoardProps, pressable } from './kit'

const WIDTH = 640
const HEIGHT = 340
const PAD = 44

// Tests written by hand have no layout, so their towns go on an ellipse with
// S on the left and T on the right. Points on an ellipse are never three in a
// line, so no road can hide behind a town.
function place(test: RouteTest): [number, number][] {
  if (test.layout) return test.layout
  const inner = test.n - 2
  const columns = Math.ceil(inner / 2)
  return Array.from({ length: test.n }, (_, town): [number, number] => {
    if (town === 0) return [0, 0.5]
    if (town === test.n - 1) return [1, 0.5]
    const k = town - 1
    const x = (Math.floor(k / 2) + 1) / (columns + 1)
    const lift = 0.46 * Math.sin(Math.PI * x)
    return [x, k % 2 === 0 ? 0.5 - lift : 0.5 + lift]
  })
}

function toll(test: RouteTest, a: number, b: number): number | undefined {
  return test.roads.find((road) => (road.a === a && road.b === b) || (road.a === b && road.b === a))?.w
}

const paid = (test: RouteTest, answer: RouteAnswer) =>
  answer.slice(1).reduce((sum, town, i) => sum + (toll(test, answer[i], town) ?? 0), 0)

const name = (test: RouteTest, town: number) => (town === 0 ? 'S' : town === test.n - 1 ? 'T' : String(town + 1))

function Board({ test, answer, locked, onChange, complain }: BoardProps<RouteTest, RouteAnswer>) {
  const spots = place(test).map(([x, y]): [number, number] => [PAD + x * (WIDTH - 2 * PAD), PAD + y * (HEIGHT - 2 * PAD)])
  const head = answer[answer.length - 1]
  const arrived = head === test.n - 1

  const click = (town: number) => {
    if (locked) return
    const at = answer.indexOf(town)
    if (at !== -1) onChange(answer.slice(0, at + 1))
    else if (arrived) complain('You are already at T. Click an earlier town to go back.')
    else if (toll(test, head, town) === undefined) complain(`No road joins ${name(test, head)} and ${name(test, town)}.`)
    else onChange([...answer, town])
  }

  return (
    <svg className="route" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="group" aria-label="Map of towns and toll roads">
      {test.roads.map((road) => {
        const [x1, y1] = spots[road.a]
        const [x2, y2] = spots[road.b]
        const at = answer.indexOf(road.a)
        const leftA = at !== -1 && answer[at + 1] === road.b
        const on = leftA || (at !== -1 && answer[at - 1] === road.b)
        // Labels sit a third of the way along, clear of where roads cross.
        // Roads inside one column are short, so theirs go in the middle.
        const along = Math.abs(x2 - x1) < 1 ? 0.5 : 0.3
        const lx = x1 + (x2 - x1) * along
        const ly = y1 + (y2 - y1) * along
        return (
          <g key={`${road.a}-${road.b}`} className={on ? 'road on' : 'road'}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
            {on && (
              <line
                className="trail"
                pathLength={1}
                x1={leftA ? x1 : x2}
                y1={leftA ? y1 : y2}
                x2={leftA ? x2 : x1}
                y2={leftA ? y2 : y1}
              />
            )}
            <rect x={lx - 12} y={ly - 10} width={24} height={20} rx={6} />
            <text x={lx} y={ly + 5} textAnchor="middle">
              {road.w}
            </text>
          </g>
        )
      })}
      {spots.map(([x, y], town) => {
        const classes = ['town']
        if (answer.includes(town)) classes.push('on')
        if (town === head) classes.push('head')
        if (!locked && !arrived && !answer.includes(town) && toll(test, head, town) !== undefined) classes.push('next')
        if (town === 0 || town === test.n - 1) classes.push('end')
        return (
          <g
            key={town}
            className={classes.join(' ')}
            style={{ '--i': town } as CSSProperties}
            {...pressable(`Town ${name(test, town)}`, () => click(town))}
          >
            <circle cx={x} cy={y} r={18} />
            <text x={x} y={y + 5} textAnchor="middle">
              {name(test, town)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export const routeKit: BoardKit<RouteTest, RouteAnswer> = {
  Board,
  status: (test, answer) => `toll ${paid(test, answer)}, now at ${name(test, answer[answer.length - 1])}`,
  missing: (test, answer) => (answer[answer.length - 1] === test.n - 1 ? null : 'Drive all the way to T.'),
}
