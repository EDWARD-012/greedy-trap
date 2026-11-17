// Seeded random numbers (FNV-1a hash into mulberry32). A level is defined by
// its seed, so the same seed has to give the same puzzle on every machine.

export type Rng = () => number

export function hashSeed(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function createRng(seed: string): Rng {
  let a = hashSeed(seed)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randInt(rng: Rng, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1))
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function sample<T>(rng: Rng, items: readonly T[], count: number): T[] {
  return shuffle(rng, items).slice(0, count)
}

export function range(lo: number, hi: number): number[] {
  const out: number[] = []
  for (let i = lo; i <= hi; i++) out.push(i)
  return out
}
