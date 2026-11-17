import type { CSSProperties, KeyboardEvent } from 'react'
import type { GridAnswer, GridTest } from '../../core/problems/grid'
import type { BoardKit, BoardProps } from './kit'

// Cells the walk stands on, the start included.
function walk(moves: GridAnswer): [number, number][] {
  const cells: [number, number][] = [[0, 0]]
  let r = 0
  let c = 0
  for (const move of moves) {
    if (move === 'R') c++
    else r++
    cells.push([r, c])
  }
  return cells
}

const gold = (test: GridTest, moves: GridAnswer) => walk(moves).reduce((sum, [r, c]) => sum + test.cells[r][c], 0)
const steps = (test: GridTest) => test.cells.length + test.cells[0].length - 2

function Board({ test, answer, locked, onChange, complain }: BoardProps<GridTest, GridAnswer>) {
  const rows = test.cells.length
  const cols = test.cells[0].length
  const path = walk(answer)
  const [headRow, headCol] = path[path.length - 1]

  const step = (move: 'R' | 'D') => {
    if (locked) return
    const fits = move === 'R' ? headCol + 1 < cols : headRow + 1 < rows
    if (fits) onChange(answer + move)
  }

  const click = (r: number, c: number) => {
    if (locked) return
    const at = path.findIndex(([pr, pc]) => pr === r && pc === c)
    if (at !== -1) onChange(answer.slice(0, at))
    else if (r === headRow && c === headCol + 1) step('R')
    else if (r === headRow + 1 && c === headCol) step('D')
    else complain('You can only step right or down from where you are.')
  }

  const keys = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') step('R')
    else if (event.key === 'ArrowDown') step('D')
    else if (event.key === 'Backspace' && !locked) onChange(answer.slice(0, -1))
    else return
    event.preventDefault()
  }

  return (
    <div className="gridboard" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} onKeyDown={keys}>
      {test.cells.map((row, r) =>
        row.map((cell, c) => {
          const at = path.findIndex(([pr, pc]) => pr === r && pc === c)
          const next = !locked && ((r === headRow && c === headCol + 1) || (r === headRow + 1 && c === headCol))
          const classes = ['cell']
          if (at !== -1) classes.push('on')
          if (at === path.length - 1) classes.push('head')
          if (next) classes.push('next')
          if (r === rows - 1 && c === cols - 1) classes.push('goal')
          return (
            <button
              key={`${r}-${c}`}
              className={classes.join(' ')}
              style={{ '--i': r + c } as CSSProperties}
              onClick={() => click(r, c)}
              aria-label={`Row ${r + 1}, column ${c + 1}, gold ${cell}${at !== -1 ? ', on your path' : ''}`}
            >
              {cell}
              {at !== -1 && at < answer.length && <span className="cell-arrow">{answer[at] === 'R' ? '→' : '↓'}</span>}
            </button>
          )
        }),
      )}
    </div>
  )
}

export const gridKit: BoardKit<GridTest, GridAnswer> = {
  Board,
  status: (test, answer) => `gold ${gold(test, answer)}, step ${answer.length} of ${steps(test)}`,
  missing: (test, answer) => (answer.length === steps(test) ? null : 'Walk all the way to the bottom-right cell.'),
}
