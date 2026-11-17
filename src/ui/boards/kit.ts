import type { ComponentType, KeyboardEvent } from 'react'

export interface BoardProps<I, A> {
  test: I
  answer: A
  // True while the board only shows an answer: after AC, or when it is
  // displaying the greedy or optimal answer.
  locked: boolean
  onChange(answer: A): void
  // Tells the player why a move was refused.
  complain(message: string): void
}

export interface BoardKit<I = any, A = any> {
  Board: ComponentType<BoardProps<I, A>>
  // One line under the board, e.g. "2 coins, 6 of 6 paid".
  status(test: I, answer: A): string
  // Why the answer cannot be submitted yet, or null when it can.
  missing(test: I, answer: A): string | null
}

// Makes an SVG group behave like a button for mouse and keyboard.
export function pressable(label: string, onPress: () => void) {
  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    onClick: onPress,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onPress()
      }
    },
  }
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}
