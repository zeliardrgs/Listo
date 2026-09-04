import { useState } from 'react'
import { CrossIcon, PlusIcon } from './icons'
import { MAX_PER_PLANNING_SLOT } from '../data/constants'
import type { PlanningItem, Recipe } from '../types'

export default function PlanningCell({
  items,
  note,
  recipesById,
  armed,
  onDropItem,
  onTapPlace,
  onRemoveItem,
  onSetNote
}: {
  items: PlanningItem[]
  note?: string
  recipesById: Map<string, Recipe>
  armed: boolean
  onDropItem: (itemId: string) => void
  onTapPlace: () => void
  onRemoveItem: (itemId: string) => void
  onSetNote: (note: string) => void
}) {
  const [dragOver, setDragOver] = useState(false)
  const [editingNote, setEditingNote] = useState(false)
  const [noteDraft, setNoteDraft] = useState(note ?? '')
  const validItems = items.filter((item) => recipesById.has(item.recipeId))
  const hasRoom = validItems.length < MAX_PER_PLANNING_SLOT

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

  function onCellClick() {
    if (armed && hasRoom) onTapPlace()
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
      onClick={onCellClick}
      className={`group/cell flex min-h-[64px] flex-col gap-1 border border-brand-50 dark:border-brand-800/40 p-1.5 transition-colors ${
        dragOver ? 'bg-brand-50 dark:bg-brand-900/40 ring-2 ring-inset ring-brand-300' : armed && hasRoom ? 'cursor-pointer bg-brand-50/40 ring-1 ring-inset ring-brand-200' : 'bg-white dark:bg-[#241c15]'
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
            className="group/chip flex cursor-grab items-center gap-1 rounded-lg border border-brand-100 dark:border-brand-800/50 bg-brand-50/60 p-1 active:cursor-grabbing"
          >
            <span className="min-w-0 flex-1 truncate text-[11px] font-bold leading-tight text-slate-700 dark:text-slate-200" title={recipe.name}>
              {recipe.name}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemoveItem(item.id)
              }}
              title="Retirer"
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-slate-300 dark:text-slate-600 opacity-100 hover:bg-red-50 hover:text-red-400 sm:opacity-0 sm:group-hover/chip:opacity-100"
            >
              <CrossIcon className="h-2.5 w-2.5" />
            </button>
          </div>
        )
      })}

      {editingNote ? (
        <input
          autoFocus
          onClick={(e) => e.stopPropagation()}
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
          className="w-full rounded-md border border-brand-200 dark:border-brand-700/50 px-1.5 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      ) : note ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            startEditingNote()
          }}
          title="Cliquer pour modifier la note"
          className="w-full rounded-md bg-slate-50 dark:bg-white/5 px-1.5 py-1 text-left text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
        >
          {note}
        </button>
      ) : (
        hasRoom && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              startEditingNote()
            }}
            className="flex w-full items-center justify-center gap-1 rounded-md py-1 text-[10px] font-semibold text-slate-300 dark:text-slate-600 opacity-100 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-400 sm:opacity-0 sm:group-hover/cell:opacity-100"
          >
            <PlusIcon className="h-2.5 w-2.5" />
            Note
          </button>
        )
      )}
    </div>
  )
}
