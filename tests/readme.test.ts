import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { workedExample } from '../scripts/worked-example'
import { problems } from '../src/core/problems'
import { collectStats, statsTable } from '../src/core/stats'

// The README quotes output from the scripts. These tests rerun the scripts'
// code and fail if the README has drifted from what they print.
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')

describe('README', () => {
  it('quotes the current stats table', () => {
    expect(readme).toContain(statsTable(collectStats()))
  })

  it('quotes the current worked example', () => {
    expect(readme).toContain(workedExample())
  })

  it('lists every problem with its greedy rule and technique', () => {
    for (const problem of problems) {
      expect(readme).toContain(`| ${problem.letter} | ${problem.title} | ${problem.greedyRule} | ${problem.technique} |`)
    }
  })
})
