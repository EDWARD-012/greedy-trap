import type { Page } from '@playwright/test'
import type { Problem } from '../src/core/types'

// Enters an answer by clicking the board, the way a player would. The browser
// tests and the README screenshot script both use it.
export async function play(page: Page, problem: Problem, level: unknown, answer: any, scope = '') {
  const board = page.locator(`${scope} .board`)
  const t = level as any
  switch (problem.id) {
    case 'coins':
      for (let i = 0; i < answer.length; i++) {
        for (let k = 0; k < answer[i]; k++) await board.getByLabel(`Add a ${t.coins[i]} coin`).click()
      }
      break
    case 'knapsack':
      for (const i of answer) await board.locator('.item').nth(i).click()
      break
    case 'gigs':
      for (const i of answer) await board.locator('.gig').nth(i).click()
      break
    case 'grid': {
      const cols = t.cells[0].length
      let r = 0
      let c = 0
      for (const move of answer) {
        if (move === 'R') c++
        else r++
        await board.locator('.cell').nth(r * cols + c).click()
      }
      break
    }
    case 'route':
      for (const town of answer.slice(1)) await board.locator('.town').nth(town).click()
      break
    case 'tour':
      for (const stop of answer) await board.locator('.stop').nth(stop - 1).click()
      break
    case 'climb':
      for (const i of answer) await board.locator('.card').nth(i).click()
      break
  }
}
