import { useEffect, useMemo, useRef } from 'react'
import { todayUtc } from './core/levels'
import { findProblem } from './core/problems'
import { Logo } from './ui/Logo'
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

  // Links are plain anchors, so a new page would otherwise open wherever the
  // last one was scrolled to.
  const path = route.join('/')
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

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
  // A soft light follows the pointer. Only its own transform changes, once a
  // frame at most.
  const light = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let frame = 0
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (light.current) light.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`
      })
    }
    window.addEventListener('pointermove', move)
    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <>
      <div ref={light} className="spotlight" aria-hidden="true" />
      <nav className="topbar">
        <a className="logo" href="#/">
          <Logo size={34} className="snap" />
          greedy trap
        </a>
        <div className="topbar-links">
          <a href="#/daily">Today's round</a>
          <a href="#/">Problems</a>
          <a className="wide-only" href={REPO}>
            GitHub
          </a>
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
