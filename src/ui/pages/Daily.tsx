import { useEffect, useState } from 'react'
import { roundNumber, todayUtc } from '../../core/levels'
import { problems } from '../../core/problems'
import { standing, startRound, useSave } from '../storage'

function useNow(): number {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  return now
}

function clock(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`
}

export function Daily() {
  const save = useSave()
  const now = useNow()
  const date = todayUtc(new Date(now))
  const round = save.rounds[date]
  const score = standing(round)
  const number = roundNumber(date)
  const [copied, setCopied] = useState(false)
  const nextRound = Date.parse(`${date}T00:00:00Z`) + 86_400_000

  const share = async () => {
    const cells = problems.map((problem, i) => `${problem.letter}${score.cells[i]}`).join(' ')
    const text = [
      `Greedy Trap round ${number} (${date})`,
      cells,
      `${score.solved}/${problems.length} solved, penalty ${score.penalty}`,
      window.location.origin + window.location.pathname,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Some browsers block clipboard writes; a prompt still lets you copy by hand.
      window.prompt('Copy your result', text)
    }
  }

  return (
    <main className="daily">
      <header className="daily-head">
        <p className="eyebrow">{date} · same seven tests for everyone</p>
        <h1>Round {number}</h1>
        <p className="lede">
          One level of each problem, scored like an ICPC contest: most problems solved wins, and ties go to the lower
          penalty. Penalty is the minutes it took to get each problem accepted, plus 20 for every wrong submission
          before that.
        </p>
      </header>

      {!round ? (
        <div className="panel start">
          <p>The clock starts when you do.</p>
          <button className="button primary big" onClick={() => startRound(date)}>
            Start round {number}
          </button>
        </div>
      ) : (
        <>
          <div className="standing panel">
            <table>
              <thead>
                <tr>
                  <th>Solved</th>
                  <th>Penalty</th>
                  {problems.map((problem) => (
                    <th key={problem.id}>{problem.letter}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="big-number">{score.solved}</td>
                  <td className="big-number">{score.penalty}</td>
                  {score.cells.map((cell, i) => (
                    <td key={problems[i].id} className={cell[0] === '+' ? 'cell-ac' : cell[0] === '-' ? 'cell-wa' : ''}>
                      {cell}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <div className="standing-foot">
              <span>Your clock {clock(now - round.startedAt)}</span>
              <span>Next round in {clock(nextRound - now)}</span>
              <button className="button small" onClick={share}>
                {copied ? 'Copied' : 'Copy result'}
              </button>
            </div>
          </div>

          <div className="problem-list">
            {problems.map((problem, i) => (
              <a key={problem.id} className="problem-row" href={`#/daily/${problem.id}`}>
                <span className="letter">{problem.letter}</span>
                <span className="problem-name">
                  <strong>{problem.title}</strong>
                  <span className="muted">{problem.greedyRule}</span>
                </span>
                <span className="problem-tags">
                  {problem.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </span>
                <span className="problem-progress">
                  {score.cells[i][0] === '+' ? (
                    <span className="badge ac">Accepted</span>
                  ) : score.cells[i][0] === '-' ? (
                    <span className="badge wa">{score.cells[i].slice(1)} wrong</span>
                  ) : (
                    <span className="muted">not tried</span>
                  )}
                  <span className="go">Open →</span>
                </span>
              </a>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
