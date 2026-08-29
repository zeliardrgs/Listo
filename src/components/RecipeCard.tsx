import RecipeIllustration from './RecipeIllustration'
import { PlusIcon, CalendarIcon, CheckIcon } from './icons'
import type { Recipe } from '../types'

export default function RecipeCard({
  recipe,
  planned,
  onOpen,
  onQuickAdd,
  onPlan
}: {
  recipe: Recipe
  planned: boolean
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
      className="cursor-pointer overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <RecipeIllustration category={recipe.category} className="h-full w-full" />
        )}
        <button
          onClick={quickAdd}
          title="Ajouter les ingrédients à la liste"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-600 shadow-md hover:bg-brand-50"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 py-2.5">
        <p className="truncate text-sm font-bold text-slate-700">{recipe.name}</p>
        {recipe.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                {tag}
              </span>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={plan}
          title={planned ? 'Retirer du planning' : 'Planifier'}
          className={`mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
            planned ? 'bg-brand-50 text-brand-700 hover:bg-red-50 hover:text-red-500' : 'bg-brand-600 text-white hover:bg-brand-700'
          }`}
        >
          {planned ? <CheckIcon className="h-3.5 w-3.5" /> : <CalendarIcon className="h-3.5 w-3.5" />}
          {planned ? 'Planifié' : 'Planifier'}
        </button>
      </div>
    </div>
  )
}
