import { type CSSProperties, useEffect, useRef, useState } from 'react'
import type { Judgement } from '../core/judge'
import type { Problem } from '../core/types'

const STEP_MS = 420

const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Runs the tests one at a time, the way a judge page ticks through them, and
// stops at the first failure. `replay` is for a verdict that was already
// delivered and is only being shown again, e.g. after switching tabs: it
// appears finished and does not report a second time.
export function Verdict({
  problem,
  result,
  replay,
  onDone,
}: {
  problem: Problem
  result: Judgement
  replay: boolean
  onDone: () => void
}) {
  const stopAt = result.failedTest ?? result.tests.length
  const [ran, setRan] = useState(() => (replay || calm() ? stopAt : 0))
  const reported = useRef(replay)
  const box = useRef<HTMLDivElement>(null)
  const finished = ran >= stopAt

  useEffect(() => {
    // On a short screen the verdict lands below the fold, so follow it.
    box.current?.scrollIntoView({ block: 'nearest', behavior: calm() ? 'auto' : 'smooth' })
    if (finished) {
      if (!reported.current) {
        reported.current = true
        onDone()
      }
      return
    }
    const timer = setTimeout(() => setRan((count) => count + 1), STEP_MS)
    return () => clearTimeout(timer)
  }, [ran, finished, onDone])

  const accepted = result.verdict === 'AC'

  return (
    <div ref={box} className={`verdict ${finished ? (accepted ? 'ac' : 'wa') : 'running'}`} aria-live="polite">
      <ol className="tests">
        {result.tests.map((test, i) => {
          const state = i < ran ? (test.passed ? 'ok' : 'failed') : i === ran && !finished ? 'running' : 'skipped'
          return (
            <li key={test.name} className={`test ${state}`}>
              <span className="test-number">Test {i + 1}</span>
              <span className="test-name">{test.name}</span>
              <span className="test-state">
                {state === 'ok' ? 'OK' : state === 'failed' ? 'FAILED' : state === 'running' ? 'running' : 'not run'}
              </span>
            </li>
          )
        })}
      </ol>
      {finished && (
        <div className="stamp-row">
          <div className="stamp">{accepted ? 'Accepted' : `Wrong answer on test ${result.failedTest}`}</div>
          {accepted && <Confetti />}
        </div>
      )}
      {finished && (
        <>
          <dl className="scores">
            <div>
              <dt>You</dt>
              <dd>{result.yours ?? '—'}</dd>
            </div>
            <div>
              <dt>Greedy</dt>
              <dd>{result.greedy ?? 'stuck'}</dd>
            </div>
            <div>
              <dt>Optimum</dt>
              <dd>{result.optimal}</dd>
            </div>
          </dl>
          <p className="verdict-note">{note(problem, result)}</p>
        </>
      )}
    </div>
  )
}

function note(problem: Problem, result: Judgement): string {
  const direction = problem.goal === 'min' ? 'lower is better' : 'higher is better'
  if (result.yours === null) return 'The answer breaks a rule of the problem, so it has no score.'
  if (result.verdict === 'AC') return `Scores are in ${problem.unit}, ${direction}. Nothing beats that.`
  if (result.matchedGreedy) return `Scores are in ${problem.unit}, ${direction}. You matched greedy, which is the trap.`
  if (result.failedTest === 2) return `Scores are in ${problem.unit}, ${direction}. Greedy did better than that.`
  return `Scores are in ${problem.unit}, ${direction}. You beat greedy, and there is still a better answer.`
}

function Confetti() {
  return (
    <span className="confetti" aria-hidden="true">
      {Array.from({ length: 26 }, (_, i) => {
        const angle = (i / 26) * Math.PI * 2
        const reach = 70 + ((i * 37) % 60)
        const style = {
          '--dx': `${Math.cos(angle) * reach}px`,
          '--dy': `${Math.sin(angle) * reach - 30}px`,
          '--spin': `${(i * 67) % 360}deg`,
          '--hue': i % 3,
        } as CSSProperties
        return <i key={i} style={style} />
      })}
    </span>
  )
}
