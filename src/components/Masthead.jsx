import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'Experiences', end: true },
  { to: '/jobs', label: 'Job descriptions', end: false },
]

export default function Masthead() {
  return (
    <header className="border-b-[3px] border-usf-gold bg-navy">
      <div className="mx-auto flex max-w-5xl items-end gap-4 px-6 pt-5">
        <img
          src="/nybbles.png"
          alt="Nybbles, the IEEE-CS at USF mascot"
          className="relative z-10 -mb-5 h-20 w-auto drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]"
        />
        <div className="pb-4">
          <p className="font-display text-lg font-bold tracking-tight text-white">
            IEEE-CS at USF
          </p>
          <p className="text-sm text-white/70">Resume kit</p>
        </div>

        <nav className="ml-auto flex gap-5 pb-4 text-sm">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `border-b-2 pb-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-usf-gold/60 ${
                  isActive
                    ? 'border-usf-gold text-white'
                    : 'border-transparent text-white/70 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
