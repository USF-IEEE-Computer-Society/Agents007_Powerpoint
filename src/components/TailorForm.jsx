import { useState } from 'react'
import Field, { inputClass, submitClass } from './FormField'
import FormError from './FormError'

export default function TailorForm({ onGenerate, generating, error }) {
  const [jobDescription, setJobDescription] = useState('')
  const [maxExperiences, setMaxExperiences] = useState(4)

  function handleSubmit(event) {
    event.preventDefault()
    onGenerate(jobDescription, maxExperiences)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded border border-hairline bg-white p-6"
    >
      <h2 className="font-display text-xl font-bold tracking-tight text-navy">
        Tailor your bullets
      </h2>
      <p className="mt-1 text-sm text-muted">
        Paste a posting. The experiences worth putting on this resume come back
        ranked and rewritten for it.
      </p>

      <div className="mt-6 space-y-4">
        <Field label="How many experiences at most">
          <select
            className={inputClass}
            value={maxExperiences}
            onChange={(e) => setMaxExperiences(Number(e.target.value))}
          >
            {[3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} experiences
              </option>
            ))}
          </select>
        </Field>

        <Field label="Job description">
          <textarea
            className={inputClass}
            rows={14}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full posting here."
            required
          />
        </Field>
      </div>

      <FormError message={error} />

      <button type="submit" className={submitClass} disabled={generating}>
        {generating ? 'Generating…' : 'Generate bullets'}
      </button>

      <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted">
        Fewer come back when fewer genuinely fit. Written from what you saved —
        check every bullet before you use it.
      </p>
    </form>
  )
}
