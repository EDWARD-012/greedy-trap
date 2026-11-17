import { useSyncExternalStore } from 'react'
import { problems } from '../core/problems'

// Progress lives in the browser only. There is no account and no server.
const KEY = 'greedy-trap/v1'
const WRONG_PENALTY = 20

export interface Run {
  wrong: number
  solvedAt: number | null
}

export interface Round {
  startedAt: number
  runs: Record<string, Run>
}

export interface Save {
  // Solved practice levels per problem id.
  practice: Record<string, number[]>
  // Daily rounds by date.
  rounds: Record<string, Round>
}

function load(): Save {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (saved && typeof saved.practice === 'object' && typeof saved.rounds === 'object') return saved
  } catch {
    // Unreadable storage is treated as a fresh start.
  }
  return { practice: {}, rounds: {} }
}

let save = load()
const listeners = new Set<() => void>()

function update(change: (draft: Save) => void) {
  const draft = structuredClone(save)
  change(draft)
  save = draft
  try {
    localStorage.setItem(KEY, JSON.stringify(save))
  } catch {
    // Private windows may refuse to store; the game still works for the session.
  }
  listeners.forEach((notify) => notify())
}

export function useSave(): Save {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify)
      return () => listeners.delete(notify)
    },
    () => save,
  )
}

export function markSolved(id: string, level: number) {
  update((draft) => {
    const solved = (draft.practice[id] ??= [])
    if (!solved.includes(level)) solved.push(level)
  })
}

export function nextUnsolved(current: Save, id: string): number {
  const solved = current.practice[id] ?? []
  let level = 1
  while (solved.includes(level)) level++
  return level
}

export function startRound(date: string) {
  update((draft) => {
    draft.rounds[date] ??= { startedAt: Date.now(), runs: {} }
  })
}

export function recordRun(date: string, id: string, accepted: boolean) {
  update((draft) => {
    const round = (draft.rounds[date] ??= { startedAt: Date.now(), runs: {} })
    const run = (round.runs[id] ??= { wrong: 0, solvedAt: null })
    if (run.solvedAt !== null) return
    if (accepted) run.solvedAt = Date.now()
    else run.wrong++
  })
}

export interface Standing {
  solved: number
  // ICPC scoring: minutes to each accepted answer plus 20 per wrong try before it.
  penalty: number
  // One cell per problem: "+", "+2", "-1" or ".".
  cells: string[]
}

export function standing(round: Round | undefined): Standing {
  let solved = 0
  let penalty = 0
  const cells = problems.map((problem) => {
    const run = round?.runs[problem.id]
    if (!round || !run) return '.'
    if (run.solvedAt === null) return `-${run.wrong}`
    solved++
    penalty += Math.floor((run.solvedAt - round.startedAt) / 60_000) + WRONG_PENALTY * run.wrong
    return run.wrong ? `+${run.wrong}` : '+'
  })
  return { solved, penalty, cells }
}
