import { type CSSProperties, useCallback, useMemo, useState } from 'react'
import { type Judgement, judge } from '../../core/judge'
import { dailyLevel, practiceLevel, roundNumber } from '../../core/levels'
import type { Problem } from '../../core/types'
import { Balloon } from '../Balloon'
import { boards } from '../boards'
import { Editorial } from '../Editorial'
import { Hack } from '../Hack'
import { go } from '../router'
import { markSolved, recordRun, useSave } from '../storage'
import { hues } from '../theme'
import { Verdict } from '../Verdict'

type Tab = 'solve' | 'hack' | 'editorial'
type View = 'mine' | 'greedy' | 'optimal'

const SIZE_NAMES = ['', 'small', 'medium', 'large']

// How many random tests the generator threw away because greedy solved them.
function drawn(rejected: number): string {
  if (rejected === 0) return 'The first random test drawn was already a trap.'
  return `Greedy solved ${rejected} random ${rejected === 1 ? 'test' : 'tests'} before this one turned up.`
}

export type Source = { kind: 'practice'; level: number } | { kind: 'daily'; date: string }

export function ProblemPage({ problem, source }: { problem: Problem; source: Source }) {
  const save = useSave()
  const level = useMemo(
    () => (source.kind === 'daily' ? dailyLevel(problem, source.date) : practiceLevel(problem, source.level)),
    [problem, source],
  )
  const canReveal = source.kind === 'practice'

  // A test the player wrote in the hack tab. Its results are never saved.
  const [custom, setCustom] = useState<unknown>(null)
  const test = custom ?? level.test
  const kit = boards[problem.id]

  const [tab, setTab] = useState<Tab>('solve')
  const [answer, setAnswer] = useState(() => problem.blank(test))
  const [result, setResult] = useState<Judgement | null>(null)
  const [settled, setSettled] = useState(false)
  const [submissions, setSubmissions] = useState(0)
  const [view, setView] = useState<View>('mine')
  const [revealed, setRevealed] = useState(false)
  const [hint, setHint] = useState<{ text: string; count: number } | null>(null)

  const run = source.kind === 'daily' ? save.rounds[source.date]?.runs[problem.id] : undefined
  const solvedBefore =
    custom === null &&
    (source.kind === 'daily' ? run?.solvedAt != null : (save.practice[problem.id] ?? []).includes(source.level))
  const accepted = settled && result?.verdict === 'AC'
  const judging = result !== null && !settled
  const unlocked = accepted || revealed || solvedBefore
  const greedyAnswer = useMemo(() => problem.greedy(test), [problem, test])

  const complain = (text: string) => setHint((old) => ({ text, count: (old?.count ?? 0) + 1 }))

  const load = (next: unknown) => {
    setCustom(next)
    setAnswer(problem.blank(next ?? level.test))
    setResult(null)
    setSettled(false)
    setView('mine')
    setRevealed(false)
    setHint(null)
    setTab('solve')
  }

  const edit = (next: unknown) => {
    setAnswer(next)
    setHint(null)
    if (result) {
      setResult(null)
      setSettled(false)
    }
  }

  const submit = () => {
    const reason = kit.missing(test, answer)
    if (reason) {
      complain(reason)
      return
    }
    setHint(null)
    setView('mine')
    setSettled(false)
    setSubmissions((count) => count + 1)
    setResult(judge(problem, test, answer))
  }

  const verdict = result?.verdict
  const finish = useCallback(() => {
    setSettled(true)
    if (custom !== null || !verdict) return
    if (source.kind === 'daily') recordRun(source.date, problem.id, verdict === 'AC')
    else if (verdict === 'AC') markSolved(problem.id, source.level)
  }, [custom, verdict, source, problem])

  const shown = view === 'greedy' ? greedyAnswer : view === 'optimal' ? problem.solve(test) : answer
  const locked = view !== 'mine' || accepted || judging
  const Board = kit.Board

  return (
    <main className="problem-page" style={{ '--hue': hues[problem.id] } as CSSProperties}>
      <header className="problem-head">
        <a className="crumb" href={source.kind === 'daily' ? '#/daily' : '#/'}>
          {source.kind === 'daily' ? `Back to round ${roundNumber(source.date)}` : 'Back to all problems'}
        </a>
        <div className="problem-title">
          <Balloon letter={problem.letter} hue={hues[problem.id]} filled={solvedBefore || accepted} size={38} />
          <h1>{problem.title}</h1>
          {solvedBefore && <span className="badge ac">Solved</span>}
        </div>
        <div className="problem-meta">
          {problem.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
          {source.kind === 'practice' && (
            <span className="stepper">
              <button
                className="button small"
                onClick={() => go(`p/${problem.id}/${source.level - 1}`)}
                disabled={source.level <= 1}
                aria-label="Previous level"
              >
                ‹
              </button>
              <span>
                Level {source.level}, {SIZE_NAMES[level.size]}
              </span>
              <button
                className="button small"
                onClick={() => go(`p/${problem.id}/${source.level + 1}`)}
                aria-label="Next level"
              >
                ›
              </button>
            </span>
          )}
        </div>
      </header>

      <div className="problem-body">
        <section className="statement panel">
          <h2>Problem</h2>
          {problem.statement.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <div className="rival">
            <h3>The greedy you have to beat</h3>
            <p>{problem.greedyRule}</p>
          </div>
          <h3 className="judging-title">How it is judged</h3>
          <ol className="judging">
            <li>Your answer has to follow the rules.</li>
            <li>It has to score better than greedy.</li>
            <li>It has to match the optimum from an exact solver.</li>
          </ol>
          <p className="muted seed">
            {custom !== null
              ? 'Custom test'
              : `Seed ${problem.id}/${level.seed}. ${drawn(level.rejected)}`}
          </p>
        </section>

        <section className="play panel">
          <div className="tabs" role="tablist">
            {(['solve', 'hack', 'editorial'] as Tab[]).map((name) => (
              <button
                key={name}
                role="tab"
                aria-selected={tab === name}
                className={tab === name ? 'tab on' : 'tab'}
                onClick={() => setTab(name)}
              >
                {name === 'solve' ? 'Solve' : name === 'hack' ? 'Hack' : 'Editorial'}
              </button>
            ))}
          </div>

          {tab === 'solve' && (
            <div className="solve">
              {custom !== null && (
                <div className="notice">
                  <span>Playing your own test. Nothing here is saved.</span>
                  <button className="button small" onClick={() => load(null)}>
                    Back to the level
                  </button>
                </div>
              )}
              {view !== 'mine' && (
                <div className="notice">
                  <span>Showing {view === 'greedy' ? "greedy's answer" : 'an optimal answer'}.</span>
                  <button className="button small" onClick={() => setView('mine')}>
                    Back to mine
                  </button>
                </div>
              )}

              <div
                className={`board${locked ? ' locked' : ''}${settled && verdict === 'WA' ? ' wrong' : ''}`}
                data-view={view}
              >
                <Board test={test} answer={shown} locked={locked} onChange={edit} complain={complain} />
              </div>

              <p className="status">{kit.status(test, shown)}</p>
              {hint && (
                <p key={hint.count} className="hint" role="alert">
                  {hint.text}
                </p>
              )}

              <div className="actions">
                {!accepted && (
                  <button className="button primary" onClick={submit} disabled={judging}>
                    Submit
                  </button>
                )}
                {!accepted && (
                  <button className="button" onClick={() => edit(problem.blank(test))} disabled={judging}>
                    Reset
                  </button>
                )}
                {accepted && source.kind === 'practice' && custom === null && (
                  <button className="button primary" onClick={() => go(`p/${problem.id}/${source.level + 1}`)}>
                    Next level
                  </button>
                )}
                {accepted && source.kind === 'daily' && (
                  <button className="button primary" onClick={() => go('daily')}>
                    Back to the round
                  </button>
                )}
                {(settled || unlocked) && greedyAnswer !== null && view !== 'greedy' && (
                  <button className="button" onClick={() => setView('greedy')}>
                    Show greedy
                  </button>
                )}
                {unlocked && view !== 'optimal' && (
                  <button className="button" onClick={() => setView('optimal')}>
                    Show optimum
                  </button>
                )}
                {settled && !unlocked && (canReveal || custom !== null) && (
                  <button
                    className="button"
                    onClick={() => {
                      setRevealed(true)
                      setView('optimal')
                    }}
                  >
                    Give up and reveal
                  </button>
                )}
              </div>

              {result && <Verdict key={submissions} problem={problem} result={result} replay={settled} onDone={finish} />}
            </div>
          )}

          {tab === 'hack' && <Hack problem={problem} current={problem.format(level.test)} onPlay={load} />}

          {tab === 'editorial' && (
            <Editorial
              problem={problem}
              test={test}
              unlocked={unlocked}
              onShow={(next) => {
                setView(next === 'greedy' && greedyAnswer === null ? 'mine' : next)
                setTab('solve')
              }}
            />
          )}
        </section>
      </div>
    </main>
  )
}
