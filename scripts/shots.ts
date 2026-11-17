// Takes the screenshots and the GIF frames the README uses, by playing the
// built site in a headless browser. Run with: npm run shots
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { chromium, devices, type Page } from '@playwright/test'
import { preview } from 'vite'
import { play } from '../e2e/play'
import { dailyLevel, practiceLevel, todayUtc } from '../src/core/levels'
import { findProblem, problems } from '../src/core/problems'
import type { Problem } from '../src/core/types'

const OUT = 'docs'
const FRAMES = 'node_modules/.cache/shots'
const get = (id: string) => findProblem(id) as Problem

const server = await preview({ preview: { port: 4174, strictPort: true } })
const base = 'http://localhost:4174/'
const browser = await chromium.launch({ channel: process.env.E2E_CHROME_CHANNEL })

// Jumps every one-off animation to its end so a still shows the settled page.
async function settle(page: Page, wait = 400) {
  await page.waitForTimeout(wait)
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      if (animation.effect?.getComputedTiming().iterations !== Infinity) animation.finish()
    }
  })
}

async function open(page: Page, path: string) {
  await page.goto(base + path)
  await page.waitForSelector('main')
}

// The top bar sticks to the top of the window, which puts it across the
// middle of a close-up of something further down the page.
const unstick = (page: Page) => page.addStyleTag({ content: '.topbar { position: static !important; }' })

async function solve(page: Page, problem: Problem, level: number) {
  await open(page, `#/p/${problem.id}/${level}`)
  const test = practiceLevel(problem, level).test
  await play(page, problem, test, problem.solve(test))
  return test
}

const submit = (page: Page) => page.getByRole('button', { name: 'Submit' }).click()

mkdirSync(OUT, { recursive: true })

// Stills at double density.
{
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2 })
  const page = await context.newPage()

  const coins = get('coins')
  await solve(page, coins, 1)
  await submit(page)
  await page.waitForSelector('.stamp.ac')
  await settle(page, 1300)
  await unstick(page)
  await page.locator('.verdict').screenshot({ path: `${OUT}/verdict-accepted.png` })

  await page.reload()
  const first = practiceLevel(coins, 1).test
  await play(page, coins, first, coins.greedy(first))
  await submit(page)
  await page.waitForSelector('.stamp.wa')
  await settle(page, 1500)
  await unstick(page)
  await page.locator('.verdict').screenshot({ path: `${OUT}/verdict-wrong.png` })

  await open(page, '#/p/route/1')
  await page.getByRole('tab', { name: 'Hack' }).click()
  await page.getByRole('button', { name: 'Run hack' }).click()
  await settle(page)
  await unstick(page)
  await page.locator('.play').screenshot({ path: `${OUT}/hack.png` })

  await solve(page, get('grid'), 4)
  await submit(page)
  await page.waitForSelector('.stamp.ac')
  await page.getByRole('tab', { name: 'Editorial' }).click()
  await settle(page)
  await unstick(page)
  await page.locator('.play').screenshot({ path: `${OUT}/editorial.png` })

  // A daily round with two solves and one wrong try.
  await open(page, '#/daily')
  await page.getByRole('button', { name: /Start round/ }).click()
  for (const [id, wrongFirst] of [['coins', false], ['gigs', true], ['route', false]] as const) {
    const problem = get(id)
    const test = dailyLevel(problem, todayUtc()).test
    await open(page, `#/daily/${id}`)
    if (wrongFirst) {
      await play(page, problem, test, problem.greedy(test))
      await submit(page)
      await page.waitForSelector('.stamp.wa')
      await page.getByRole('button', { name: 'Reset' }).click()
    }
    await play(page, problem, test, problem.solve(test))
    await submit(page)
    await page.waitForSelector('.stamp.ac')
  }
  const knapsack = get('knapsack')
  const bag = dailyLevel(knapsack, todayUtc()).test
  await open(page, '#/daily/knapsack')
  await play(page, knapsack, bag, knapsack.greedy(bag))
  await submit(page)
  await page.waitForSelector('.stamp.wa')
  await open(page, '#/daily')
  await settle(page)
  await page.screenshot({ path: `${OUT}/daily.png`, clip: { x: 0, y: 0, width: 1200, height: 640 } })
  await context.close()
}

// One board per problem, with an optimal answer on it, and the front page at
// the size link previews use.
{
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  await open(page, '')
  await settle(page, 2600)
  await page.screenshot({ path: 'public/og.jpg', type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1200, height: 630 } })
  for (const problem of problems) {
    await solve(page, problem, 5)
    await settle(page)
    await page.locator('.board').screenshot({ path: `${OUT}/board-${problem.id}.png` })
  }
  await context.close()
}

// The same game at phone size.
{
  const phone = devices['iPhone 13']
  const context = await browser.newContext({
    viewport: phone.viewport,
    userAgent: phone.userAgent,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  await solve(page, get('tour'), 5)
  await submit(page)
  await page.waitForSelector('.stamp.ac')
  await settle(page, 1300)
  // Put the board just under the top bar, with the verdict below it.
  await page.locator('.board').evaluate((board) => window.scrollTo(0, board.getBoundingClientRect().top + window.scrollY - 70))
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}/phone.png` })
  await context.close()
}

// Frames for the GIF: the front page loading and its level being solved,
// captured in real time. scripts/make_gif.py turns them into docs/play.gif.
{
  rmSync(FRAMES, { recursive: true, force: true })
  mkdirSync(FRAMES, { recursive: true })
  // Tall enough that the verdict fits under the level without the page scrolling.
  const context = await browser.newContext({ viewport: { width: 1200, height: 860 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const coins = get('coins')
  const test = practiceLevel(coins, 1).test as { coins: number[] }
  const frames: { file: string; at: number }[] = []
  let filming = true
  await page.goto(base)
  const started = Date.now()
  const camera = (async () => {
    while (filming) {
      const file = `frame-${String(frames.length).padStart(3, '0')}.png`
      const at = Date.now() - started
      writeFileSync(`${FRAMES}/${file}`, await page.screenshot())
      frames.push({ file, at })
    }
  })()

  await page.waitForTimeout(2900)
  const answer = coins.solve(test) as number[]
  for (let i = answer.length - 1; i >= 0; i--) {
    for (let k = 0; k < answer[i]; k++) {
      await page.locator('.hero-level').getByLabel(`Add a ${test.coins[i]} coin`).click()
      await page.waitForTimeout(420)
    }
  }
  await page.waitForTimeout(300)
  await page.locator('.hero-level button', { hasText: 'Submit' }).click()
  await page.waitForSelector('.hero-level .stamp.ac')
  await page.waitForTimeout(2600)
  filming = false
  await camera
  writeFileSync(`${FRAMES}/frames.json`, JSON.stringify({ frames, end: Date.now() - started }))
  console.log(`${frames.length} frames`)
  await context.close()
}

await browser.close()
server.httpServer.close()
