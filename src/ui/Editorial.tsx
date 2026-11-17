import type { Problem } from '../core/types'

export function Editorial({
  problem,
  test,
  unlocked,
  onShow,
}: {
  problem: Problem
  test: unknown
  // The solver's work on this exact test stays hidden until the level is done.
  unlocked: boolean
  onShow: (view: 'greedy' | 'optimal') => void
}) {
  const trace = unlocked ? problem.trace(test) : null

  return (
    <div className="editorial">
      <h3>The greedy</h3>
      <p>{problem.greedyRule}</p>

      <h3>Why it fails, and what works</h3>
      {problem.editorial.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      <div className="facts">
        <div>
          <h3>Technique</h3>
          <p>{problem.technique}</p>
        </div>
        <div>
          <h3>Complexity</h3>
          <p>{problem.complexity}</p>
        </div>
      </div>

      <h3>Recurrence</h3>
      <pre className="code">{problem.recurrence}</pre>

      <h3>On this test</h3>
      {trace ? (
        <>
          <p>{trace.caption}.</p>
          <div className="trace-scroll">
            <table className="trace">
              <thead>
                <tr>
                  <th />
                  {trace.head.map((cell, i) => (
                    <th key={i}>{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trace.rows.map((row) => (
                  <tr key={row.label}>
                    <th>{row.label}</th>
                    {row.cells.map((cell, i) => (
                      <td key={i}>{cell === Infinity ? '∞' : cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="actions">
            <button className="button" onClick={() => onShow('greedy')}>
              Show greedy on the board
            </button>
            <button className="button" onClick={() => onShow('optimal')}>
              Show the optimum on the board
            </button>
          </div>
        </>
      ) : (
        <p className="muted">Solve the level, or reveal the answer, to see the solver's table for this test.</p>
      )}
    </div>
  )
}
