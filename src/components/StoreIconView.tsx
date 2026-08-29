import Emoji from './Emoji'
import type { StoreIconValue } from '../types'

export default function StoreIconView({
  icon,
  size = 20,
  className
}: {
  icon: StoreIconValue
  size?: number
  className?: string
}) {
  if (icon.type === 'image' && icon.value) {
    return (
      <img
        src={icon.value}
        alt=""
        draggable={false}
        loading="lazy"
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, objectFit: 'cover', borderRadius: '9999px', display: 'inline-block' }}
        onError={(e) => {
          ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
        }}
      />
    )
  }
  return <Emoji name={icon.value} size={size} className={className} />
}
