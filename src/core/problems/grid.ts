import { Reader } from '../reader'
import { randInt } from '../rng'
import type { Problem } from '../types'

export interface GridTest {
  cells: number[][]
}

// The walk as a string of moves, 'R' for right and 'D' for down.
export type GridAnswer = string

// best[r][c]: the most you can hold when you arrive at cell (r, c).
function fill(test: GridTest): number[][] {
  const best: number[][] = []
  test.cells.forEach((row, r) => {
    best.push([])
    row.forEach((cell, c) => {
      const above = r > 0 ? best[r - 1][c] : -1
      const left = c > 0 ? best[r][c - 1] : -1
      best[r].push(cell + Math.max(above, left, 0))
    })
  })
  return best
}

export const grid: Problem<GridTest, GridAnswer> = {
  id: 'grid',
  letter: 'D',
  title: 'Down and right',
  tags: ['dp', 'grids'],
  goal: 'max',
  unit: 'gold',
  statement: [
    'Walk from the top-left cell to the bottom-right cell. Each step moves one cell right or one cell down. You collect the gold in every cell you stand on, the first and last included. Collect as much as you can.',
  ],
  inputFormat: [
    'The first line has two integers r and c, the number of rows and columns.',
    'Each of the next r lines has c integers, the gold in that row.',
  ],
  constraints: ['2 ≤ r, c ≤ 6', '0 ≤ gold ≤ 99'],
  sample: '3 3\n1 9 1\n2 1 1\n9 9 1',
  greedyRule: 'Step onto whichever neighbour, right or down, holds more gold. On a tie go right.',
  technique: 'DP over the grid',
  complexity: 'O(r · c) time and memory',
  recurrence: 'best[r][c] = gold[r][c] + max(best[r-1][c], best[r][c-1])',
  editorial: [
    'Greedy looks one cell ahead. In the sample it steps right onto the 9, and from there the whole right side is 1s, for a total of 13. Going down first costs a little now and reaches two 9s in the bottom row: 22.',
    'A move here also decides which cells you can still reach. Every step right gives up a column on the left for good, and a one-cell look-ahead cannot see that.',
    'Because you only move right or down, you can only enter a cell from above or from the left. So the best total on arrival at a cell is its own gold plus the better of those two neighbours. Fill the grid row by row and every cell is ready before it is needed. This is usually the first grid DP anyone meets.',
  ],

  generate(rng, size) {
    const side = size + 2
    const cells: number[][] = []
    for (let r = 0; r < side; r++) {
      cells.push([])
      for (let c = 0; c < side; c++) cells[r].push(randInt(rng, 1, 9))
    }
    return { cells }
  },

  greedy(test) {
    const rows = test.cells.length
    const cols = test.cells[0].length
    let r = 0
    let c = 0
    let moves = ''
    while (r < rows - 1 || c < cols - 1) {
      const goRight = r === rows - 1 || (c < cols - 1 && test.cells[r][c + 1] >= test.cells[r + 1][c])
      if (goRight) c++
      else r++
      moves += goRight ? 'R' : 'D'
    }
    return moves
  },

  solve(test) {
    const best = fill(test)
    let r = test.cells.length - 1
    let c = test.cells[0].length - 1
    let moves = ''
    while (r > 0 || c > 0) {
      const fromLeft = r === 0 || (c > 0 && best[r][c - 1] >= best[r - 1][c])
      if (fromLeft) c--
      else r--
      moves = (fromLeft ? 'R' : 'D') + moves
    }
    return moves
  },

  value(test, answer) {
    const rows = test.cells.length
    const cols = test.cells[0].length
    if (typeof answer !== 'string' || answer.length !== rows + cols - 2) return null
    let r = 0
    let c = 0
    let gold = test.cells[0][0]
    for (const move of answer) {
      if (move === 'R') c++
      else if (move === 'D') r++
      else return null
      if (r >= rows || c >= cols) return null
      gold += test.cells[r][c]
    }
    return gold
  },

  blank() {
    return ''
  },

  parse(text) {
    const input = new Reader(text)
    const rows = input.int('r', 2, 6)
    const cols = input.int('c', 2, 6)
    const cells: number[][] = []
    for (let r = 0; r < rows; r++) {
      cells.push([])
      for (let c = 0; c < cols; c++) cells[r].push(input.int(`gold at row ${r + 1}, column ${c + 1}`, 0, 99))
    }
    input.end()
    return { cells }
  },

  format(test) {
    const lines = test.cells.map((row) => row.join(' '))
    return [`${test.cells.length} ${test.cells[0].length}`, ...lines].join('\n')
  },

  trace(test) {
    const best = fill(test)
    return {
      caption: 'best[r][c]: most gold on arrival at each cell',
      head: best[0].map((_, c) => `c${c + 1}`),
      rows: best.map((row, r) => ({ label: `r${r + 1}`, cells: row })),
    }
  },
}
