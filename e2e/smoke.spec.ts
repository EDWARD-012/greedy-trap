import { expect, type Page, test } from '@playwright/test'
import { dailyLevel, practiceLevel, todayUtc } from '../src/core/levels'
import { findProblem, problems } from '../src/core/problems'
import type { Problem } from '../src/core/types'
import { play } from './play'

// These tests play the game the way a person would, by clicking the board.
// The answers come from the same solvers the judge uses, so a test only has
// to know how each board is clicked.

const coins = findProblem('coins') as Problem

const submit = (page: Page, scope = '') => page.locator(`${scope} button`, { hasText: 'Submit' }).click()

test.beforeEach(async ({ page }) => {
  // Any script error or console error fails the test that caused it.
  page.on('pageerror', (error) => {
    throw error
  })
  page.on('console', (message) => {
    if (message.type() === 'error') throw new Error(`console error: ${message.text()}`)
  })
})

test('the level on the front page can be solved', async ({ page }) => {
  await page.goto('./')
  await expect(page.locator('.judged .stamp')).toHaveText('Wrong answer on test 2')
  const level = practiceLevel(coins, 1).test
  await play(page, coins, level, coins.solve(level), '.hero-level')
  await submit(page, '.hero-level')
  await expect(page.locator('.hero-level .verdict .stamp')).toHaveText('Accepted')
  await expect(page.locator('.hero-level .balloon.rise')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Play the next level' })).toBeVisible()
  await expect(page.locator('.problem-row').first()).toContainText('1 solved')
})

test('the greedy answer is a wrong answer on test 2, and the trap snaps', async ({ page }) => {
  await page.goto('./#/p/coins/1')
  const level = practiceLevel(coins, 1).test
  await play(page, coins, level, coins.greedy(level))
  await submit(page)
  await expect(page.locator('.verdict .stamp')).toHaveText('Wrong answer on test 2')
  await expect(page.locator('.verdict-note')).toContainText('You matched greedy')
  await expect(page.locator('.stamp-row .logo-mark')).toBeVisible()

  await page.getByRole('button', { name: 'Show greedy' }).click()
  await expect(page.locator('.board')).toHaveAttribute('data-view', 'greedy')
  await page.getByRole('button', { name: 'Back to mine' }).click()

  // A move the rules do not allow is refused with a reason.
  await page.getByRole('button', { name: 'Reset' }).click()
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.locator('.hint')).toContainText('Pay exactly')
})

for (const problem of problems) {
  test(`${problem.letter}. ${problem.title}: the optimum is accepted and remembered`, async ({ page }) => {
    await page.goto(`./#/p/${problem.id}/4`)
    await expect(page.locator('h1')).toHaveText(problem.title)
    const level = practiceLevel(problem, 4).test
    await play(page, problem, level, problem.solve(level))
    await submit(page)
    await expect(page.locator('.verdict .stamp')).toHaveText('Accepted')
    await expect(page.locator('.verdict .balloon.rise')).toBeVisible()

    await page.getByRole('tab', { name: 'Editorial' }).click()
    await expect(page.locator('.trace')).toBeVisible()

    await page.reload()
    await expect(page.locator('.problem-title .badge')).toHaveText('Solved')
  })
}

test('hack: a test that breaks greedy succeeds, a bad one is rejected', async ({ page }) => {
  await page.goto('./#/p/route/1')
  await page.getByRole('tab', { name: 'Hack' }).click()
  const input = page.locator('.hack-input')

  await page.getByRole('button', { name: 'Run hack' }).click()
  await expect(page.locator('.hack-result')).toContainText('Successful hacking attempt')

  await input.fill('3 2\n1 2 1\n2 3 1')
  await page.getByRole('button', { name: 'Run hack' }).click()
  await expect(page.locator('.hack-result')).toContainText('Unsuccessful hacking attempt')

  await input.fill('3 1\n1 2 4')
  await page.getByRole('button', { name: 'Run hack' }).click()
  await expect(page.locator('.hack-result')).toContainText('Town 3 cannot be reached from town 1')

  await input.fill('5 6\n1 2 1\n2 5 9\n1 3 2\n3 4 2\n4 5 2\n2 3 7')
  await page.getByRole('button', { name: 'Run hack' }).click()
  await page.getByRole('button', { name: 'Play this test' }).click()
  await expect(page.locator('.board .town')).toHaveCount(5)
  await expect(page.locator('.notice')).toContainText('Playing your own test')
})

test('daily round: a wrong try and then a solve show up in the standings', async ({ page }) => {
  await page.goto('./#/daily')
  await page.getByRole('button', { name: /Start round/ }).click()
  await page.locator('.problem-row').first().click()
  await expect(page.locator('h1')).toHaveText(coins.title)

  const level = dailyLevel(coins, todayUtc()).test
  await play(page, coins, level, coins.greedy(level))
  await submit(page)
  await expect(page.locator('.verdict .stamp')).toHaveText('Wrong answer on test 2')

  await page.getByRole('button', { name: 'Reset' }).click()
  await play(page, coins, level, coins.solve(level))
  await submit(page)
  await expect(page.locator('.verdict .stamp')).toHaveText('Accepted')

  await page.getByRole('button', { name: 'Back to the round' }).click()
  await expect(page.locator('.standing .cell-ac')).toHaveText('+1')
  await expect(page.locator('.standing .big-number').first()).toHaveText('1')
})

test('pages do not scroll sideways', async ({ page }) => {
  for (const path of ['./', './#/daily', './#/p/route/9', './#/p/gigs/9', './#/p/tour/9']) {
    await page.goto(path)
    await expect(page.locator('main')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})
