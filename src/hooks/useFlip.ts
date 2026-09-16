import { useLayoutEffect, useRef, type RefObject } from 'react'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

// FLIP-animates any descendant carrying a `data-flip-id` attribute when its
// position changes between renders (e.g. a list reordering). `skipId`, if
// given, snaps that one element instantly instead of animating it — used so
// the item currently being dragged doesn't lag behind the pointer while its
// neighbours slide out of the way.
export function useFlip<T extends HTMLElement>(containerRef: RefObject<T>, deps: unknown[], skipId?: string | null) {
  const prevRects = useRef<Map<string, DOMRect>>(new Map())

  useLayoutEffect(() => {
    const container = containerRef.current
    const prev = prevRects.current
    const next = new Map<string, DOMRect>()

    if (container) {
      container.querySelectorAll<HTMLElement>('[data-flip-id]').forEach((node) => {
        const id = node.dataset.flipId!
        const newRect = node.getBoundingClientRect()
        next.set(id, newRect)
        if (id === skipId) return
        const oldRect = prev.get(id)
        if (!oldRect) return
        const dx = oldRect.left - newRect.left
        const dy = oldRect.top - newRect.top
        if (!dx && !dy) return
        node.style.transition = 'none'
        node.style.transform = `translate(${dx}px, ${dy}px)`
        // Force layout so the browser commits the starting transform before
        // the transition below is applied — otherwise it can skip straight
        // to the end state.
        void node.offsetWidth
        requestAnimationFrame(() => {
          node.style.transition = `transform 260ms ${EASE}`
          node.style.transform = ''
        })
      })
    }

    prevRects.current = next
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
