import RecipeIllustration from './RecipeIllustration'
import { PlusIcon, CalendarIcon, CheckIcon } from './icons'
import type { Recipe } from '../types'

export default function RecipeCard({
  recipe,
  planned,
  selected,
  onOpen,
  onQuickAdd,
  onPlan
}: {
  recipe: Recipe
  planned: boolean
  selected?: boolean
  onOpen: () => void
  onQuickAdd: () => void
  onPlan: () => void
}) {
  function quickAdd(e: React.MouseEvent) {
    e.stopPropagation()
    onQuickAdd()
  }

  function plan(e: React.MouseEvent) {
    e.stopPropagation()
    onPlan()
  }

  return (
    <div
      onClick={onOpen}
      className={`flex cursor-pointer gap-3 overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md sm:block sm:gap-0 ${
        selected ? 'border-brand-500 ring-2 ring-brand-200' : 'border-brand-100'
      }`}
    >
      <div className="relative h-24 w-24 shrink-0 sm:aspect-[4/3] sm:h-auto sm:w-full">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <RecipeIllustration category={recipe.category} className="h-full w-full" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-2 pr-3 sm:justify-start sm:px-3 sm:py-2.5">
        <p className="truncate text-sm font-bold text-slate-700">{recipe.name}</p>
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:mt-1.5">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-1 flex items-center gap-1.5 sm:mt-2.5">
          <button
            type="button"
            onClick={plan}
            title={planned ? 'Retirer du planning' : 'Planifier'}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
              planned ? 'bg-brand-50 text-brand-700 hover:bg-red-50 hover:text-red-500' : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            {planned ? <CheckIcon className="h-3.5 w-3.5" /> : <CalendarIcon className="h-3.5 w-3.5" />}
            {planned ? 'Planifié' : 'Planifier'}
          </button>
          <button
            type="button"
            onClick={quickAdd}
            title="Ajouter les ingrédients à la liste"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
