import { ReactNode } from 'react'

export default function Modal({
  title,
  onClose,
  children,
  footer,
  size = 'md'
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}) {
  const sizeClass = size === 'lg' ? 'max-w-2xl lg:max-w-4xl' : 'max-w-lg lg:max-w-xl'
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white dark:bg-[#241c15] shadow-xl sm:rounded-2xl ${sizeClass}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-brand-100 dark:border-brand-800/50 bg-white dark:bg-[#241c15] px-4 py-3">
          <h2 className="text-base font-bold text-brand-800 dark:text-brand-200">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <div className="shrink-0 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#241c15] px-4 py-3">{footer}</div>}
      </div>
    </div>
  )
}
