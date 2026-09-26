import { CheckIcon } from './icons'

export default function RecipeSteps({
  steps,
  size = 'normal',
  done,
  onToggle
}: {
  steps: string[]
  size?: 'normal' | 'large'
  done?: Set<number>
  onToggle?: (index: number) => void
}) {
  if (steps.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-400">Aucune instruction.</p>
  }

  const large = size === 'large'

  return (
    <ol>
      {steps.map((step, i) => {
        const isDone = done?.has(i) ?? false
        const isLast = i === steps.length - 1
        const Wrapper = onToggle ? 'button' : 'div'
        return (
          <li key={i} className={`relative flex ${large ? 'gap-5' : 'gap-3.5'} ${isLast ? '' : large ? 'pb-8' : 'pb-5'}`}>
            {!isLast && (
              <span
                aria-hidden
                className={`absolute w-0.5 rounded-full bg-brand-100 dark:bg-white/20 ${
                  large ? 'left-[21px] top-12 bottom-2' : 'left-[15px] top-9 bottom-1'
                }`}
              />
            )}
            <span
              className={`relative flex shrink-0 items-center justify-center rounded-full font-extrabold transition-colors ${
                large ? 'h-11 w-11 text-lg' : 'h-8 w-8 text-sm'
              } ${isDone ? 'bg-green-500 text-white' : 'bg-brand-600 text-white shadow-sm'}`}
            >
              {isDone ? <CheckIcon className={large ? 'h-5 w-5' : 'h-4 w-4'} /> : i + 1}
            </span>
            <Wrapper
              {...(onToggle ? { type: 'button' as const, onClick: () => onToggle(i) } : {})}
              className={`min-w-0 flex-1 text-left transition-opacity ${
                large ? 'pt-2 text-lg leading-relaxed sm:text-xl' : 'pt-1 text-sm leading-relaxed'
              } ${isDone ? 'text-slate-400 opacity-70' : 'text-slate-700 dark:text-slate-200'}`}
            >
              {step}
            </Wrapper>
          </li>
        )
      })}
    </ol>
  )
}
