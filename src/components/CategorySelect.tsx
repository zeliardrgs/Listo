import { useAppStore } from '../store/useAppStore'
import { useCategoryEmojiName } from '../hooks/useCategoryEmojiName'
import { emojiUnicode } from '../data/emojiUnicode'

export default function CategorySelect({
  value,
  onChange,
  className
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const categories = useAppStore((s) => s.allCategories())
  const emojiFor = useCategoryEmojiName()
  const options = Array.from(new Set([value, ...categories])).filter(Boolean)
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      {options.map((c) => (
        <option key={c} value={c}>
          {emojiUnicode(emojiFor(c))} {c}
        </option>
      ))}
    </select>
  )
}
