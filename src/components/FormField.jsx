export const inputClass =
  'w-full rounded border border-hairline bg-white px-3 py-2 text-[0.9375rem] text-ink ' +
  'placeholder:text-muted/50 focus:border-ieee focus:outline-none focus:ring-2 ' +
  'focus:ring-ieee/25 disabled:bg-ground disabled:text-muted/60'

export const submitClass =
  'mt-6 w-full rounded bg-ieee px-4 py-2.5 font-semibold text-white transition-colors ' +
  'hover:bg-ieee-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-ieee/40 ' +
  'focus-visible:ring-offset-2'

export default function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.8125rem] font-medium text-muted">
        {label}
      </span>
      {children}
    </label>
  )
}
