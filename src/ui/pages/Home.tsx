import { roundNumber, todayUtc } from '../../core/levels'
import { problems } from '../../core/problems'
import { nextUnsolved, standing, useSave } from '../storage'

export function Home() {
  const save = useSave()
  const date = todayUtc()
  const score = standing(save.rounds[date])

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">Seven problems, exact judges, no sign-up</p>
          <h1>
            Seven problems where the <span className="signal">greedy</span> answer is wrong.
          </h1>
          <p className="lede">
            Every level is a small optimisation problem picked because the obvious strategy fails on it. Find the
            answer greedy misses, or write your own test that breaks it. An exact solver judges both.
          </p>
          <div className="actions">
            <a className="button primary big" href="#/daily">
              Play round {roundNumber(date)}
            </a>
            <button
              className="button big"
              onClick={() => document.getElementById('problems')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Pick a problem
            </button>
          </div>
          {save.rounds[date] && (
            <p className="muted">
              Today so far: {score.solved} of {problems.length} solved, penalty {score.penalty}.
            </p>
          )}
        </div>

        <div className="trap-demo" aria-label="Example: coins 1, 3 and 4, pay 6">
          <p className="trap-caption">A. Exact change: coins 1, 3, 4, pay 6</p>
          <div className="trap-row">
            <span className="trap-who">greedy</span>
            <span className="trap-coins">
              <i className="coin coin-small d1">4</i>
              <i className="coin coin-small d2">1</i>
              <i className="coin coin-small d3">1</i>
            </span>
            <span className="badge wa d4">WA · 3 coins</span>
          </div>
          <div className="trap-row">
            <span className="trap-who">optimum</span>
            <span className="trap-coins">
              <i className="coin coin-small d5">3</i>
              <i className="coin coin-small d6">3</i>
            </span>
            <span className="badge ac d7">AC · 2 coins</span>
          </div>
        </div>
      </section>

      <section id="problems" className="problemset">
        <h2>Problems</h2>
        <div className="problem-list">
          {problems.map((problem) => {
            const solved = (save.practice[problem.id] ?? []).length
            const level = nextUnsolved(save, problem.id)
            return (
              <a key={problem.id} className="problem-row" href={`#/p/${problem.id}/${level}`}>
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
                  {solved > 0 ? <span className="badge ac">{solved} solved</span> : <span className="muted">new</span>}
                  <span className="go">Level {level} →</span>
                </span>
              </a>
            )
          })}
        </div>
      </section>

      <section className="how">
        <h2>Three ways to play a problem</h2>
        <div className="how-grid">
          <article className="panel">
            <h3>Solve</h3>
            <p>
              Work the level out on the board and submit. Your answer runs through three tests: it follows the rules, it
              beats greedy, it matches the optimum. The verdict names the first test it fails.
            </p>
          </article>
          <article className="panel">
            <h3>Hack</h3>
            <p>
              Write an input of your own in the problem's input format. A validator checks it, then greedy and the
              exact solver both run. If greedy comes out worse, the hack succeeds and you can play your own test.
            </p>
          </article>
          <article className="panel">
            <h3>Editorial</h3>
            <p>
              Each problem explains why greedy fails and which technique gets it right, with the recurrence and the
              running time. Once you solve a level you also get the solver's table for that exact test.
            </p>
          </article>
        </div>
        <p className="muted trust">
          The judge is only as good as its solvers, so each one is checked against a brute-force search on 450 random
          tests in the test suite. A new round starts every day at midnight UTC and is the same for everyone.
        </p>
      </section>
    </main>
  )
}
