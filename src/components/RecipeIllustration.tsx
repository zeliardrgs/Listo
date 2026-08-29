const STROKE = '#7a3b0a'
const ACCENT = '#f5841f'

const BG_BY_CATEGORY: Record<string, string> = {
  Entrée: '#d9f2e3',
  Plat: '#ffe3c2',
  Dessert: '#ffd9e8',
  Apéritif: '#e3e0ff',
  'Petit-déjeuner': '#fff3b0',
  'Sauce/Base': '#d3ecff'
}

function EntreeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="none">
      <path d="M4 13a8 8 0 0 0 16 0Z" fill="#fff" stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 13h18" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 11c0-2 1-3 1-3M12 10c0-2.5 1.2-3.5 1.2-3.5M16 11c0-2 1-3 1-3" stroke={ACCENT} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function PlatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="none">
      <ellipse cx="12" cy="17" rx="8.5" ry="3" fill="#fff" stroke={STROKE} strokeWidth="1.6" />
      <path d="M6 16c0-3.5 2.7-6.5 6-6.5s6 3 6 6.5" fill={ACCENT} stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 7.5c.5-1 .2-1.8-.3-2.5M12 6.5c.4-1.1.1-2-.4-2.7M15 7.5c.5-1 .2-1.8-.3-2.5" stroke={STROKE} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function DessertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="none">
      <path d="M5 19h14M6 19l2-9h8l2 9" fill="#fff" stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 13.5h8M8.7 10h6.6" stroke={STROKE} strokeWidth="1.3" />
      <circle cx="12" cy="7.5" r="1.6" fill={ACCENT} stroke={STROKE} strokeWidth="1.3" />
    </svg>
  )
}

function AperitifIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="none">
      <path d="M5 5h14l-7 8-7-8Z" fill="#fff" stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 13v6M8.5 19h7" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="11" cy="7.5" r="1.1" fill={ACCENT} />
    </svg>
  )
}

function PetitDejIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="none">
      <path d="M5 10h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5v-4Z" fill="#fff" stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M15 11h1.5a2 2 0 0 1 0 4H15" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 8c-.6-.8-.2-1.5.2-2M11.5 8c-.6-.8-.2-1.5.2-2" stroke={ACCENT} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function SauceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="none">
      <rect x="7" y="9" width="10" height="10" rx="2.5" fill="#fff" stroke={STROKE} strokeWidth="1.6" />
      <path d="M9.5 9V6.5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2V9" stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9.5 13.5h5" stroke={ACCENT} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function DefaultIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="none">
      <path d="M7 3v6a2 2 0 0 0 2 2v10M7 3v8M9 3v8" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3c-1.4 0-2.5 1.6-2.5 4.5S14.6 12 16 12v9" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="1" fill={ACCENT} />
    </svg>
  )
}

const ICON_BY_CATEGORY: Record<string, () => JSX.Element> = {
  Entrée: EntreeIcon,
  Plat: PlatIcon,
  Dessert: DessertIcon,
  Apéritif: AperitifIcon,
  'Petit-déjeuner': PetitDejIcon,
  'Sauce/Base': SauceIcon
}

export default function RecipeIllustration({ category, className }: { category: string; className?: string }) {
  const Icon = ICON_BY_CATEGORY[category] || DefaultIcon
  const bg = BG_BY_CATEGORY[category] || '#fde8d0'
  return (
    <div className={className} style={{ background: bg }}>
      <div className="h-full w-full p-3">
        <Icon />
      </div>
    </div>
  )
}
