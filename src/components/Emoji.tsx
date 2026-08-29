import { fluentEmojiUrl } from '../data/fluentEmoji'

export default function Emoji({
  name,
  size = 20,
  className
}: {
  name: string
  size?: number
  className?: string
}) {
  return (
    <img
      src={fluentEmojiUrl(name)}
      alt=""
      draggable={false}
      loading="lazy"
      crossOrigin="anonymous"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block' }}
      onError={(e) => {
        ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
      }}
    />
  )
}
