import { type RefObject, useEffect, useState } from 'react'

export const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const mouse = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

// Leans an element a few degrees toward the pointer. Mouse only: on a touch
// screen there is no pointer to lean toward.
export function useTilt(ref: RefObject<HTMLElement | null>, degrees = 4) {
  useEffect(() => {
    const el = ref.current
    if (!el || !mouse() || calm()) return
    const lean = (event: PointerEvent) => {
      const box = el.getBoundingClientRect()
      const x = (event.clientX - box.left) / box.width - 0.5
      const y = (event.clientY - box.top) / box.height - 0.5
      el.style.transform = `perspective(900px) rotateX(${(-y * degrees).toFixed(2)}deg) rotateY(${(x * degrees).toFixed(2)}deg)`
    }
    const settle = () => {
      el.style.transform = ''
    }
    el.addEventListener('pointermove', lean)
    el.addEventListener('pointerleave', settle)
    return () => {
      el.removeEventListener('pointermove', lean)
      el.removeEventListener('pointerleave', settle)
    }
  }, [ref, degrees])
}

// Turns true the first time the element scrolls into view, and stays true.
export function useSeen(ref: RefObject<Element | null>): boolean {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const watcher = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setSeen(true)
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    watcher.observe(el)
    return () => watcher.disconnect()
  }, [ref, seen])
  return seen
}
