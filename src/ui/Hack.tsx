import { useState } from 'react'
import { hack, type HackResult } from '../core/judge'
import type { Problem } from '../core/types'

// The reverse game: instead of answering a test, write one that breaks greedy.
export function Hack({
  problem,
  current,
  onPlay,
}: {
  problem: Problem
  current: string
  onPlay: (test: unknown) => void
}) {
  const [text, setText] = useState(problem.sample)
  const [result, setResult] = useState<HackResult | null>(null)

  const edit = (next: string) => {
    setText(next)
    setResult(null)
  }

  return (
    <div className="hack">
      <p className="lede">
        Write a test on which this greedy fails: <em>{problem.greedyRule}</em> The validator checks your input, then
        greedy and the exact solver both run on it.
      </p>

      <div className="spec">
        <div>
          <h3>Input format</h3>
          {problem.inputFormat.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div>
          <h3>Constraints</h3>
          <ul>
            {problem.constraints.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <label className="field-label" htmlFor="hack-input">
        Your test
      </label>
      <textarea
        id="hack-input"
        className="hack-input"
        value={text}
        onChange={(event) => edit(event.target.value)}
        rows={Math.min(14, Math.max(4, text.split('\n').length + 1))}
        spellCheck={false}
      />

      <div className="actions">
        <button className="button primary" onClick={() => setResult(hack(problem, text))}>
          Run hack
        </button>
        <button className="button" onClick={() => edit(problem.sample)}>
          Load the sample
        </button>
        <button className="button" onClick={() => edit(current)}>
          Load the current level
        </button>
      </div>

      {result && !result.ok && (
        <div className="hack-result invalid" role="status">
          <strong>Invalid input</strong>
          <span>Validator: {result.error}</span>
        </div>
      )}
      {result && result.ok && result.success && (
        <div className="hack-result success" role="status">
          <strong>Successful hacking attempt</strong>
          <span>
            {result.greedy === null
              ? `Greedy gets stuck. The optimum is ${result.optimal}.`
              : `Greedy scores ${result.greedy}. The optimum is ${result.optimal}.`}
          </span>
          <button className="button" onClick={() => onPlay(result.test)}>
            Play this test
          </button>
        </div>
      )}
      {result && result.ok && !result.success && (
        <div className="hack-result failed" role="status">
          <strong>Unsuccessful hacking attempt</strong>
          <span>Greedy also reaches the optimum here ({result.optimal}). Try another test.</span>
        </div>
      )}
    </div>
  )
}
