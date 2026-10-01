import React from 'react'
import { Home, Sun, Moon, Settings, ShieldCheck } from 'lucide-react'

// Dark top bar (logo + section tabs on computers) and a bottom icon bar on phones.
// `items` = [{ key, short, Icon }], `colors` = { key: accent colour readable on the dark bar }.

export function TopBar({ items, colors, active, onGo, dark, onToggleDark, onSettings, adminMode, badge }) {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-[#0f172a] text-white dark:bg-[#0a0f1c]">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:px-6">
        <button
          type="button"
          onClick={() => onGo('home')}
          className="nav-press flex min-w-0 items-center gap-2.5 cursor-pointer text-left"
          aria-label="Medical Guidance — go to home"
        >
          <img src="/icons/pcis-128.png" alt="" className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
          <span className="font-display truncate text-lg font-extrabold tracking-tight sm:text-xl">Medical Guidance</span>
        </button>

        {/* Computers: sections as tabs in the bar */}
        <nav className="ml-4 hidden h-full items-stretch gap-1 lg:flex" aria-label="Sections">
          {[{ key: 'home', short: 'Home', Icon: Home }, ...items].map(({ key, short, Icon }) => {
            const on = key === active
            return (
              <button
                key={key}
                type="button"
                onClick={() => onGo(key)}
                aria-current={on ? 'page' : undefined}
                className={`nav-tab flex items-center gap-2 border-b-2 px-3 text-sm font-semibold cursor-pointer transition-colors ${on ? 'text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
                style={on ? { borderBottomColor: colors[key] } : undefined}
              >
                <Icon className="h-4 w-4" style={on ? { color: colors[key] } : undefined} />
                {short}
              </button>
            )
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {adminMode && (
            <span className="hidden items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 sm:inline-flex">
              <ShieldCheck className="h-3 w-3" /> Admin
            </span>
          )}
          <button
            type="button"
            onClick={onToggleDark}
            className="nav-icon flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white cursor-pointer"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Light mode' : 'Dark mode'}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onSettings}
            className="nav-icon relative flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white cursor-pointer"
            aria-label="Settings"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
            {badge > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

export function BottomBar({ items, colors, active, onGo }) {
  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0f172a] pb-[env(safe-area-inset-bottom)] dark:bg-[#0a0f1c] lg:hidden"
      aria-label="Sections"
    >
      <div className="mx-auto grid h-16 max-w-xl grid-cols-6">
        {[{ key: 'home', short: 'Home', Icon: Home }, ...items].map(({ key, short, Icon }) => {
          const on = key === active
          return (
            <button
              key={key}
              type="button"
              onClick={() => onGo(key)}
              aria-current={on ? 'page' : undefined}
              className={`nav-press flex flex-col items-center justify-center gap-1 text-[10.5px] font-semibold cursor-pointer ${on ? 'text-white' : 'text-slate-400'}`}
            >
              <span
                className="flex h-7 w-12 items-center justify-center rounded-full transition-colors"
                style={on ? { background: colors[key] + '2e' } : undefined}
              >
                <Icon className="h-[19px] w-[19px]" style={on ? { color: colors[key] } : undefined} />
              </span>
              {short}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
