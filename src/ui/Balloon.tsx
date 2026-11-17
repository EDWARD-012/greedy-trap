import type { CSSProperties } from 'react'

// At ICPC contests every solved problem earns a balloon in that problem's
// colour. Here a problem's balloon is hollow until you solve it.
export function Balloon({
  letter,
  hue,
  filled,
  size = 40,
  className = '',
}: {
  letter: string
  hue: string
  filled: boolean
  size?: number
  className?: string
}) {
  return (
    <svg
      className={`balloon ${filled ? 'filled' : ''} ${className}`}
      style={{ '--hue': hue } as CSSProperties}
      width={size}
      height={size * 1.4}
      viewBox="0 0 40 56"
      aria-hidden="true"
    >
      <path className="balloon-string" d="M20 39 C17 44 23 48 20 55" />
      <path className="balloon-body" d="M20 2 C30 2 36 10 36 19 C36 29 27 36 20 37 C13 36 4 29 4 19 C4 10 10 2 20 2 Z" />
      <path className="balloon-knot" d="M17 40 L20 36 L23 40 Z" />
      <text x="20" y="25" textAnchor="middle">
        {letter}
      </text>
    </svg>
  )
}
