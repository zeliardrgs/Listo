import { useState } from 'react'
import RecipeIllustration from './RecipeIllustration'
import { CrossIcon, PlusIcon } from './icons'
import { MAX_PER_PLANNING_SLOT } from '../data/constants'
import type { PlanningItem, Recipe } from '../types'

export default function PlanningCell({
  items,
  note,
  recipesById,
  onDropItem,
  onRemoveItem,
  onSetNote
}: {
  items: PlanningItem[]
  note?: string
  recipesById: Map<string, Recipe>
  onDropItem: (itemId: string) => void
  onRemoveItem: (itemId: string) => void
  onSetNote: (note: string) => void
}) {
  const [dragOver, setDragOver] = useState(false)
  const [editingNote, setEditingNote] = useState(false)
  const [noteDraft, setNoteDraft] = useState(note ?? '')
  const validItems = items.filter((item) => recipesById.has(item.recipeId))

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const id = e.dataTransfer.getData('text/plain')
    if (id) onDropItem(id)
  }

  function commitNote() {
    onSetNote(noteDraft)
    setEditingNote(false)
  }

  function startEditingNote() {
    setNoteDraft(note ?? '')
    setEditingNote(true)
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`group/cell flex min-h-[64px] flex-col gap-1 border border-brand-50 p-1.5 transition-colors ${
        dragOver ? 'bg-brand-50 ring-2 ring-inset ring-brand-300' : 'bg-white'
      }`}
    >
      {validItems.map((item) => {
        const recipe = recipesById.get(item.recipeId)!
        return (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', item.id)
              e.dataTransfer.effectAllowed = 'move'
            }}
            className="group/chip flex cursor-grab items-start gap-1.5 rounded-lg border border-brand-100 bg-brand-50/60 p-1 active:cursor-grabbing"
          >
            <div className="h-6 w-6 shrink-0 overflow-hidden rounded-md bg-white">
              {recipe.imageUrl ? (
                <img src={recipe.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <RecipeIllustration category={recipe.category} className="h-full w-full" />
              )}
            </div>
            <span className="min-w-0 flex-1 break-words text-[11px] font-bold leading-tight text-slate-700">
              {recipe.name}
            </span>
            <button
              type="button"
              onClick={() => onRemoveItem(item.id)}
              title="Retirer"
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-slate-300 opacity-0 hover:bg-red-50 hover:text-red-400 group-hover/chip:opacity-100"
            >
              <CrossIcon className="h-2.5 w-2.5" />
            </button>
          </div>
        )
      })}

      {editingNote ? (
        <input
          autoFocus
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={commitNote}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitNote()
            } else if (e.key === 'Escape') {
              setEditingNote(false)
            }
          }}
          placeholder="Note…"
          className="w-full rounded-md border border-brand-200 px-1.5 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      ) : note ? (
        <button
          type="button"
          onClick={startEditingNote}
          title="Cliquer pour modifier la note"
          className="w-full rounded-md bg-slate-50 px-1.5 py-1 text-left text-[11px] font-medium text-slate-500 hover:bg-slate-100"
        >
          {note}
        </button>
      ) : (
        validItems.length < MAX_PER_PLANNING_SLOT && (
          <button
            type="button"
            onClick={startEditingNote}
            className="flex w-full items-center justify-center gap-1 rounded-md py-1 text-[10px] font-semibold text-slate-300 opacity-0 hover:bg-slate-50 hover:text-slate-400 group-hover/cell:opacity-100"
          >
            <PlusIcon className="h-2.5 w-2.5" />
            Note
          </button>
        )
      )}
    </div>
  )
}
