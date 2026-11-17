import { clash, type GigsAnswer, type GigsTest } from '../../core/problems/gigs'
import { type BoardKit, type BoardProps, plural, pressable } from './kit'

const WIDTH = 640
const PAD = 16
const LANE = 48

// Puts each gig on the first row where it does not overlap an earlier one.
function lanes(test: GigsTest): number[] {
  const order = test.gigs.map((_, i) => i).sort((a, b) => test.gigs[a].s - test.gigs[b].s || a - b)
  const free: number[] = []
  const lane = new Array<number>(test.gigs.length).fill(0)
  for (const i of order) {
    let row = free.findIndex((end) => end <= test.gigs[i].s)
    if (row === -1) row = free.length
    free[row] = test.gigs[i].e
    lane[i] = row
  }
  return lane
}

const pay = (test: GigsTest, answer: GigsAnswer) => answer.reduce((sum, i) => sum + test.gigs[i].v, 0)

function Board({ test, answer, locked, onChange, complain }: BoardProps<GigsTest, GigsAnswer>) {
  const lane = lanes(test)
  const rows = Math.max(...lane) + 1
  const day = Math.max(...test.gigs.map((gig) => gig.e))
  const hour = (WIDTH - 2 * PAD) / day
  const height = rows * LANE + 34

  const toggle = (i: number) => {
    if (locked) return
    if (answer.includes(i)) {
      onChange(answer.filter((k) => k !== i))
    } else if (answer.some((k) => clash(test.gigs[i], test.gigs[k]))) {
      complain('That gig overlaps one you already took.')
    } else {
      onChange([...answer, i].sort((a, b) => a - b))
    }
  }

  return (
    <svg className="gigs" viewBox={`0 0 ${WIDTH} ${height}`} role="group" aria-label="Gig offers on a timeline">
      {Array.from({ length: day + 1 }, (_, h) => (
        <g key={h}>
          <line className="gig-tick" x1={PAD + h * hour} x2={PAD + h * hour} y1={0} y2={rows * LANE + 6} />
          <text className="gig-hour" x={PAD + h * hour} y={height - 8} textAnchor="middle">
            {h}
          </text>
        </g>
      ))}
      {test.gigs.map((gig, i) => {
        const on = answer.includes(i)
        const blocked = !on && answer.some((k) => clash(gig, test.gigs[k]))
        const x = PAD + gig.s * hour + 3
        const y = lane[i] * LANE + 6
        const width = (gig.e - gig.s) * hour - 6
        return (
          <g
            key={i}
            className={`gig${on ? ' on' : ''}${blocked ? ' blocked' : ''}`}
            aria-pressed={on}
            {...pressable(`Gig from ${gig.s} to ${gig.e}, pays ${gig.v}`, () => toggle(i))}
          >
            <rect x={x} y={y} width={width} height={LANE - 12} rx={9} />
            <text x={x + width / 2} y={y + (LANE - 12) / 2 + 6} textAnchor="middle">
              {gig.v}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export const gigsKit: BoardKit<GigsTest, GigsAnswer> = {
  Board,
  status: (test, answer) => `pay ${pay(test, answer)} from ${plural(answer.length, 'gig')}`,
  missing: (_test, answer) => (answer.length ? null : 'Accept at least one gig.'),
}
