import { useSyncExternalStore } from 'react'

// Hash routing, so the site works from any folder on GitHub Pages with no
// server rewrites.
function subscribe(notify: () => void) {
  window.addEventListener('hashchange', notify)
  return () => window.removeEventListener('hashchange', notify)
}

export function useRoute(): string[] {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean)
}

export function go(path: string) {
  window.location.hash = `/${path}`
  window.scrollTo(0, 0)
}
