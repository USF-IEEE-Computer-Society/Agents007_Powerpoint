import { useState } from 'react'
import Field, { inputClass, submitClass } from './FormField'

const BLANK = { title: '', company: '', link: '', description: '' }

export default function JobForm({ onAdd }) {
  const [form, setForm] = useState(BLANK)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onAdd({ ...form, id: crypto.randomUUID(), savedAt: new Date().toISOString() })
    setForm(BLANK)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded border border-hairline bg-white p-6"
    >
      <h2 className="font-display text-xl font-bold tracking-tight text-navy">
        Save a job description
      </h2>
      <p className="mt-1 text-sm text-muted">
        Paste the posting from Handshake, LinkedIn, or a company careers page.
      </p>

      <div className="mt-6 space-y-4">
        <Field label="Job title">
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Software Engineer, University Grad"
            required
          />
        </Field>

        <Field label="Company">
          <input
            className={inputClass}
            value={form.company}
            onChange={(e) => update('company', e.target.value)}
            placeholder="Jabil"
            required
          />
        </Field>

        <Field label="Link to the posting">
          <input
            type="url"
            className={inputClass}
            value={form.link}
            onChange={(e) => update('link', e.target.value)}
            placeholder="https://careers.example.com/job/1234"
          />
        </Field>

        <Field label="Job description">
          <textarea
            className={inputClass}
            rows={12}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Paste the full posting here — responsibilities, qualifications, everything."
            required
          />
        </Field>
      </div>

      <button type="submit" className={submitClass}>
        Save job description
      </button>
    </form>
  )
}
