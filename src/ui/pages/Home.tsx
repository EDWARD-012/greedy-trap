import { type CSSProperties, useRef } from 'react'
import { roundNumber, todayUtc } from '../../core/levels'
import { problems } from '../../core/problems'
import { Balloon } from '../Balloon'
import { HeroLevel } from '../HeroLevel'
import { useSeen } from '../motion'
import { nextUnsolved, standing, useSave } from '../storage'
import { hues } from '../theme'

export function Home() {
  const save = useSave()
  const date = todayUtc()
  const score = standing(save.rounds[date])
  const list = useRef<HTMLDivElement>(null)
  const seen = useSeen(list)

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-text">
          {/* The headline is a greedy rule, and the page marks it wrong. */}
          <div className="judged">
            <h1>Always take the biggest coin.</h1>
            <span className="strike" aria-hidden="true" />
            <span className="stamp wa">Wrong answer on test 2</span>
          </div>
          <p className="lede">
            That rule is greedy, and on these seven problems greedy loses. Find the answer it misses, or write your own
            test that breaks it. An exact solver judges both.
          </p>
          <div className="actions">
            <a className="button primary big" href="#/daily">
              Play round {roundNumber(date)}
            </a>
            <button
              className="button big"
              onClick={() => document.getElementById('problems')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See all seven problems
            </button>
          </div>
          {save.rounds[date] && (
            <p className="muted hero-note">
              Today so far: {score.solved} of {problems.length} solved, penalty {score.penalty}.
            </p>
          )}
        </div>
        <HeroLevel />
      </section>

      <section id="problems" className="problemset">
        <h2>Seven problems, one balloon each</h2>
        <div ref={list} className={seen ? 'problem-list deal seen' : 'problem-list deal'}>
          {problems.map((problem, i) => {
            const solved = (save.practice[problem.id] ?? []).length
            const level = nextUnsolved(save, problem.id)
            return (
              <a
                key={problem.id}
                className="problem-row"
                href={`#/p/${problem.id}/${level}`}
                style={{ '--i': i, '--hue': hues[problem.id] } as CSSProperties}
              >
                <Balloon letter={problem.letter} hue={hues[problem.id]} filled={solved > 0} />
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
                  {solved > 0 && <span className="muted">{solved} solved</span>}
                  <span className="go">Play level {level}</span>
                </span>
              </a>
            )
          })}
        </div>
      </section>

      <section className="how">
        <h2>Every problem has three tabs</h2>
        <dl className="ways">
          <div>
            <dt>Solve</dt>
            <dd>
              Work the level out on the board and submit. Your answer runs through three tests: it follows the rules, it
              beats greedy, it matches the optimum. The verdict names the first test it fails.
            </dd>
          </div>
          <div>
            <dt>Hack</dt>
            <dd>
              Write an input of your own in the problem's input format. A validator checks it, then greedy and the
              exact solver both run. If greedy comes out worse, the hack succeeds and you can play your own test.
            </dd>
          </div>
          <div>
            <dt>Editorial</dt>
            <dd>
              Read why greedy fails and which technique gets it right, with the recurrence and the running time. Once
              you solve a level you also get the solver's table for that exact test.
            </dd>
          </div>
        </dl>
        <p className="muted trust">
          The judge is only as good as its solvers, so each one is checked against a brute-force search on 450 random
          tests in the test suite. A new round starts every day at midnight UTC and is the same for everyone. Solve a
          problem and its balloon fills in, the way a contest hands you one.
        </p>
      </section>
    </main>
  )
}
