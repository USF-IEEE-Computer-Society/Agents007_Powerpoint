export default function Masthead({ count }) {
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
          <p className="text-sm text-white/70">Resume experiences</p>
        </div>
        <p className="ml-auto hidden pb-4 text-sm text-white/70 sm:block">
          {count} {count === 1 ? 'experience' : 'experiences'}
        </p>
      </div>
    </header>
  )
}
