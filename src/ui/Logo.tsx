// The mark: a trap seen head-on, jaws open around a coin. Add the class "snap"
// to make the jaws bite once. The top bar does it on hover and the verdict
// does it when an answer falls for the greedy.
export function Logo({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={`logo-mark ${className}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g className="coin-bit">
        <circle cx="32" cy="32" r="6.5" fill="var(--gold)" stroke="var(--gold-deep)" strokeWidth="1.5" />
      </g>
      <path
        className="jaw jaw-top"
        d="M5 22 A27 14 0 0 1 59 22 L52.25 29 L45.5 22 L38.75 29 L32 22 L25.25 29 L18.5 22 L11.75 29 Z"
      />
      <path
        className="jaw jaw-bottom"
        d="M5 42 A27 14 0 0 0 59 42 L52.25 35 L45.5 42 L38.75 35 L32 42 L25.25 35 L18.5 42 L11.75 35 Z"
      />
    </svg>
  )
}
