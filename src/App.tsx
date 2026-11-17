import { useEffect, useMemo } from 'react'
import { todayUtc } from './core/levels'
import { findProblem } from './core/problems'
import { Daily } from './ui/pages/Daily'
import { Home } from './ui/pages/Home'
import { ProblemPage, type Source } from './ui/pages/ProblemPage'
import { useRoute } from './ui/router'
import { nextUnsolved, startRound, useSave } from './ui/storage'

const REPO = 'https://github.com/EDWARD-012/greedy-trap'

function Page() {
  const route = useRoute()
  const save = useSave()
  const [section, id, levelText] = route
  const problem = id ? findProblem(id) : undefined
  const date = todayUtc()

  // Opening a daily problem directly also starts the round clock.
  const daily = section === 'daily' && problem !== undefined
  useEffect(() => {
    if (daily) startRound(date)
  }, [daily, date])

  const wanted = Math.floor(Number(levelText))
  const level = wanted >= 1 && wanted <= 9999 ? wanted : problem ? nextUnsolved(save, problem.id) : 1
  const source = useMemo<Source>(
    () => (section === 'daily' ? { kind: 'daily', date } : { kind: 'practice', level }),
    [section, date, level],
  )

  if (problem && (section === 'daily' || section === 'p')) {
    return <ProblemPage key={`${section}/${problem.id}/${source.kind === 'daily' ? date : level}`} problem={problem} source={source} />
  }
  if (section === 'daily') return <Daily />
  return <Home />
}

export function App() {
  // The page background has a soft light that follows the pointer.
  useEffect(() => {
    const move = (event: PointerEvent) => {
      document.documentElement.style.setProperty('--mx', `${event.clientX}px`)
      document.documentElement.style.setProperty('--my', `${event.clientY}px`)
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  return (
    <>
      <div className="spotlight" aria-hidden="true" />
      <nav className="topbar">
        <a className="logo" href="#/">
          <span className="logo-mark" aria-hidden="true" />
          greedy trap
        </a>
        <div className="topbar-links">
          <a href="#/daily">Today's round</a>
          <a href="#/">Problems</a>
          <a href={REPO}>GitHub</a>
        </div>
      </nav>
      <Page />
      <footer className="footer">
        <span>Built by Ravi Kumar Gupta (EDWARD7780). MIT licence.</span>
        <a href={REPO}>Source and tests on GitHub</a>
      </footer>
    </>
  )
}
