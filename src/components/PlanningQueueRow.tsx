import RecipeIllustration from './RecipeIllustration'
import { CrossIcon } from './icons'
import type { Recipe } from '../types'

export default function PlanningQueueRow({
  itemId,
  recipe,
  onRemove
}: {
  itemId: string
  recipe: Recipe
  onRemove: () => void
}) {
  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('text/plain', itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <li
      draggable
      onDragStart={onDragStart}
      className="group flex cursor-grab items-start gap-2 rounded-xl border border-brand-100 bg-white p-2 shadow-sm active:cursor-grabbing"
    >
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-brand-50">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <RecipeIllustration category={recipe.category} className="h-full w-full" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-bold leading-tight text-slate-700">{recipe.name}</p>
        {recipe.tags.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1">
            {recipe.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-semibold text-brand-700">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        title="Retirer"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-300 opacity-0 hover:bg-red-50 hover:text-red-400 group-hover:opacity-100"
      >
        <CrossIcon className="h-3 w-3" />
      </button>
    </li>
  )
}
