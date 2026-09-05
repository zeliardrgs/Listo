import { useEffect, useRef, useState } from 'react'
import { COLOR_SWATCHES, colorByKey } from '../data/categoryColors'

export default function ColorPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  function toggleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, left: rect.left })
    }
    setOpen((v) => !v)
  }

  const current = colorByKey(value) || COLOR_SWATCHES[0].color
  const currentSwatch = COLOR_SWATCHES.find((c) => c.key === value)?.swatch || COLOR_SWATCHES[0].swatch

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        title="Changer la couleur"
        className={`flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 dark:border-brand-700/50 ${current.iconBg}`}
      >
        <span className="h-5 w-5 rounded-full" style={{ background: currentSwatch }} />
      </button>
      {open && pos && (
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left }}
          className="z-50 w-48 rounded-xl border border-brand-100 dark:border-brand-800/50 bg-white dark:bg-[#5b3d94] p-2 shadow-lg"
        >
          <div className="grid grid-cols-5 gap-1.5">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c.key}
                type="button"
                title={c.label}
                onClick={() => {
                  onChange(c.key)
                  setOpen(false)
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-full hover:ring-2 hover:ring-brand-200 ${
                  c.key === value ? 'ring-2 ring-brand-500' : ''
                }`}
              >
                <span className="h-6 w-6 rounded-full" style={{ background: c.swatch }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
