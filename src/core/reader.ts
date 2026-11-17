// Reads a hack input the way a contest validator would: whitespace-separated
// integers, every one range-checked, nothing left over at the end.

export class InputError extends Error {}

export class Reader {
  private tokens: string[]
  private at = 0

  constructor(text: string) {
    this.tokens = text.split(/\s+/).filter(Boolean)
  }

  int(name: string, lo: number, hi: number): number {
    const token = this.tokens[this.at]
    if (token === undefined) throw new InputError(`Input ended early: expected ${name}.`)
    if (!/^-?\d{1,9}$/.test(token)) throw new InputError(`${name} must be an integer, got "${token}".`)
    const value = Number(token)
    if (value < lo || value > hi) {
      throw new InputError(`${name} must be between ${lo} and ${hi}, got ${value}.`)
    }
    this.at++
    return value
  }

  end(): void {
    if (this.at < this.tokens.length) {
      throw new InputError(`Unexpected extra input starting at "${this.tokens[this.at]}".`)
    }
  }
}
