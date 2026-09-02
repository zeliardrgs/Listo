import { useEffect, useMemo, useState } from 'react'
import ListTab from './components/tabs/ListTab'
import RecipesTab from './components/tabs/RecipesTab'
import PlanningTab from './components/tabs/PlanningTab'
import ShoppingModeTab from './components/tabs/ShoppingModeTab'
import SettingsPage from './components/SettingsPage'
import ListoLogo from './components/ListoLogo'
import SettingsIcon from './components/SettingsIcon'
import { ClipboardIcon, CalendarIcon, MoreIcon } from './components/icons'
import { useScrolled } from './hooks/useScrolled'
import { useScrollDirection } from './hooks/useScrollDirection'
import { useHouseholdSync } from './hooks/useHouseholdSync'
import { useAppStore } from './store/useAppStore'
import JoinInvite from './components/JoinInvite'
import InstallBanner from './components/InstallBanner'
import HouseholdRequiredGate from './components/HouseholdRequiredGate'
import HouseholdSwitcher from './components/HouseholdSwitcher'

type Tab = 'list' | 'recipes' | 'planning' | 'shopping'

const ACTIVE_TAB_KEY = 'listo-active-tab'
const VALID_TABS: Tab[] = ['list', 'recipes', 'planning', 'shopping']

function loadActiveTab(): Tab {
  const stored = localStorage.getItem(ACTIVE_TAB_KEY)
  return VALID_TABS.includes(stored as Tab) ? (stored as Tab) : 'list'
}

const TABS: { key: Tab; label: string; icon: JSX.Element }[] = [
  {
    key: 'list',
    label: 'Articles',
    icon: <ClipboardIcon className="h-full w-full" />
  },
  {
    key: 'recipes',
    label: 'Recettes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
      </svg>
    )
  },
  {
    key: 'planning',
    label: 'Planning',
    icon: <CalendarIcon className="h-full w-full" />
  },
  {
    key: 'shopping',
    label: 'Courses',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 7H6" />
      </svg>
    )
  }
]

function TabBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

const Logo = ({ compact }: { compact?: boolean }) => (
  <ListoLogo className={`w-auto transition-all duration-200 ${compact ? 'h-6' : 'h-8 sm:h-9'}`} color="#ffffff" />
)

function SettingsButton({
  onClick,
  className,
  icon: Icon = SettingsIcon
}: {
  onClick: () => void
  className?: string
  icon?: (props: { className?: string }) => JSX.Element
}) {
  return (
    <button
      onClick={onClick}
      title="Paramètres"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 ${className ?? ''}`}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}

function BottomTabBar({
  tab,
  showSettings,
  hidden,
  toBuyCount,
  onSelect
}: {
  tab: Tab
  showSettings: boolean
  hidden: boolean
  toBuyCount: number
  onSelect: (t: Tab) => void
}) {
  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-30 flex min-h-[64px] items-center justify-around bg-brand-600 px-1 pb-[env(safe-area-inset-bottom)] transition-transform duration-200 sm:hidden ${
        hidden ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      {TABS.map((t) => {
        const isActive = !showSettings && tab === t.key
        return (
          <button key={t.key} onClick={() => onSelect(t.key)} className="flex flex-1 items-center justify-center">
            {isActive ? (
              <span className="flex items-center gap-1.5 rounded-full bg-cream px-4 py-2 text-xs font-bold leading-none text-brand-700">
                <span className="relative h-4 w-4 shrink-0">
                  {t.icon}
                  {t.key === 'shopping' && <TabBadge count={toBuyCount} />}
                </span>
                <span className="whitespace-nowrap">{t.label}</span>
              </span>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center text-white/70">
                <span className="relative h-5 w-5">
                  {t.icon}
                  {t.key === 'shopping' && <TabBadge count={toBuyCount} />}
                </span>
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>(loadActiveTab)
  const [showSettings, setShowSettings] = useState(false)
  const scrolled = useScrolled()
  const scrollDirection = useScrollDirection()
  useHouseholdSync()
  const items = useAppStore((s) => s.items)
  const toBuyCount = useMemo(() => items.filter((it) => it.toBuy).length, [items])

  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_KEY, tab)
  }, [tab])

  return (
    <div className="flex h-full flex-col bg-cream">
      <header
        className={`sticky top-0 z-30 bg-brand-600 px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] transition-all duration-200 sm:px-6 ${
          scrolled ? 'sm:pt-1' : 'sm:pt-2'
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:justify-between">
          <div
            className={`relative flex items-center justify-center gap-2 sm:static sm:justify-start ${scrolled ? 'pb-1' : 'pb-2'}`}
          >
            <Logo compact={scrolled} />
            <SettingsButton
              onClick={() => setShowSettings(true)}
              className="absolute right-0 sm:hidden"
              icon={MoreIcon}
            />
          </div>

          <nav
            className={`hidden gap-1 transition-all duration-200 sm:flex ${scrolled ? 'items-center' : 'items-stretch'}`}
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key)
                  setShowSettings(false)
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 px-4 text-xs font-bold leading-none transition-all duration-200 sm:flex-none sm:text-sm ${
                  scrolled ? 'h-7' : 'py-2.5'
                } ${
                  !showSettings && tab === t.key
                    ? `bg-cream text-brand-700 ${scrolled ? 'rounded-full' : 'rounded-t-2xl'}`
                    : 'text-white/85 hover:text-white'
                }`}
              >
                <span
                  className={`relative shrink-0 transition-all duration-200 ${scrolled ? 'h-3.5 w-3.5' : 'h-4 w-4'}`}
                >
                  {t.icon}
                  {t.key === 'shopping' && <TabBadge count={toBuyCount} />}
                </span>
                <span className="whitespace-nowrap">{t.label}</span>
              </button>
            ))}
          </nav>

          <div className={`hidden items-center gap-2 sm:flex ${scrolled ? 'pb-1' : 'pb-2'}`}>
            <HouseholdSwitcher onOpenSettings={() => setShowSettings(true)} />
            <SettingsButton onClick={() => setShowSettings(true)} />
          </div>
        </div>
      </header>

      <InstallBanner />

      <main className="flex-1 overflow-y-auto pb-16 sm:pb-0">
        {showSettings ? (
          <SettingsPage onClose={() => setShowSettings(false)} />
        ) : (
          <>
            {tab === 'list' && <ListTab />}
            {tab === 'recipes' && <RecipesTab />}
            {tab === 'planning' && <PlanningTab />}
            {tab === 'shopping' && <ShoppingModeTab />}
          </>
        )}
      </main>

      <BottomTabBar
        tab={tab}
        showSettings={showSettings}
        hidden={scrollDirection === 'down' && !showSettings}
        toBuyCount={toBuyCount}
        onSelect={(t) => {
          setTab(t)
          setShowSettings(false)
        }}
      />

      <JoinInvite />
      <HouseholdRequiredGate />
    </div>
  )
}
