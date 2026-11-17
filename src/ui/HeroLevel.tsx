import { useCallback, useMemo, useRef, useState } from 'react'
import { type Judgement, judge } from '../core/judge'
import { practiceLevel } from '../core/levels'
import { coins, type CoinsAnswer, type CoinsTest } from '../core/problems/coins'
import { Balloon } from './Balloon'
import { coinsKit } from './boards/CoinsBoard'
import { useTilt } from './motion'
import { markSolved, useSave } from './storage'
import { hues } from './theme'
import { Verdict } from './Verdict'

// The first practice level of problem A, playable right on the front page.
// Solving it here counts the same as solving it on its own page.
export function HeroLevel() {
  const save = useSave()
  const test = useMemo(() => practiceLevel(coins, 1).test as CoinsTest, [])
  const [answer, setAnswer] = useState<CoinsAnswer>(() => coins.blank(test))
  const [result, setResult] = useState<Judgement | null>(null)
  const [settled, setSettled] = useState(false)
  const [submissions, setSubmissions] = useState(0)
  const [hint, setHint] = useState<{ text: string; count: number } | null>(null)
  const card = useRef<HTMLDivElement>(null)
  useTilt(card)

  const accepted = settled && result?.verdict === 'AC'
  const solved = accepted || (save.practice.coins ?? []).includes(1)
  const complain = (text: string) => setHint((old) => ({ text, count: (old?.count ?? 0) + 1 }))

  const edit = (next: CoinsAnswer) => {
    setAnswer(next)
    setHint(null)
    setResult(null)
    setSettled(false)
  }

  const submit = () => {
    const reason = coinsKit.missing(test, answer)
    if (reason) {
      complain(reason)
      return
    }
    setHint(null)
    setSettled(false)
    setSubmissions((count) => count + 1)
    setResult(judge(coins, test, answer))
  }

  const verdict = result?.verdict
  const finish = useCallback(() => {
    setSettled(true)
    if (verdict === 'AC') markSolved('coins', 1)
  }, [verdict])

  const locked = accepted || (result !== null && !settled)

  return (
    <div className="hero-level" ref={card}>
      <div className="hero-level-title">
        <Balloon letter="A" hue={hues.coins} filled={solved} size={34} />
        <p>
          <strong>Try it here: pay {test.target} with as few coins as you can.</strong>
          Greedy needs {coins.value(test, coins.greedy(test))} coins. You can do better.
        </p>
      </div>
      <div className={`board${locked ? ' locked' : ''}${settled && verdict === 'WA' ? ' wrong' : ''}`}>
        <coinsKit.Board test={test} answer={answer} locked={locked} onChange={edit} complain={complain} />
      </div>
      <p className="status">{coinsKit.status(test, answer)}</p>
      {hint && (
        <p key={hint.count} className="hint" role="alert">
          {hint.text}
        </p>
      )}
      <div className="actions">
        {accepted ? (
          <a className="button primary" href="#/p/coins/2">
            Play the next level
          </a>
        ) : (
          <>
            <button className="button primary" onClick={submit} disabled={locked}>
              Submit
            </button>
            <button className="button" onClick={() => edit(coins.blank(test))} disabled={locked}>
              Reset
            </button>
          </>
        )}
      </div>
      {result && <Verdict key={submissions} problem={coins} result={result} replay={settled} onDone={finish} />}
    </div>
  )
}
