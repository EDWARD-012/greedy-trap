// Binary min-heap. Dijkstra in the route problem is its only user.

export class MinHeap<T> {
  private items: T[] = []

  constructor(private before: (a: T, b: T) => boolean) {}

  get size(): number {
    return this.items.length
  }

  push(item: T): void {
    const items = this.items
    items.push(item)
    let i = items.length - 1
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (!this.before(items[i], items[parent])) break
      ;[items[i], items[parent]] = [items[parent], items[i]]
      i = parent
    }
  }

  pop(): T | undefined {
    const items = this.items
    if (items.length === 0) return undefined
    const top = items[0]
    const last = items.pop() as T
    if (items.length > 0) {
      items[0] = last
      let i = 0
      for (;;) {
        const left = 2 * i + 1
        const right = left + 1
        let smallest = i
        if (left < items.length && this.before(items[left], items[smallest])) smallest = left
        if (right < items.length && this.before(items[right], items[smallest])) smallest = right
        if (smallest === i) break
        ;[items[i], items[smallest]] = [items[smallest], items[i]]
        i = smallest
      }
    }
    return top
  }
}
