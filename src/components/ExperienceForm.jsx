import { useState } from 'react'

const BLANK = {
  role: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
}

const inputClass =
  'w-full rounded border border-hairline bg-white px-3 py-2 text-[0.9375rem] text-ink ' +
  'placeholder:text-muted/50 focus:border-ieee focus:outline-none focus:ring-2 ' +
  'focus:ring-ieee/25 disabled:bg-ground disabled:text-muted/60'

export default function ExperienceForm({ onAdd }) {
  const [form, setForm] = useState(BLANK)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onAdd({ ...form, id: crypto.randomUUID() })
    setForm(BLANK)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded border border-hairline bg-white p-6"
    >
      <h2 className="font-display text-xl font-bold tracking-tight text-navy">
        Add an experience
      </h2>
      <p className="mt-1 text-sm text-muted">
        Internships, research, projects, officer roles — anything you would put
        on a resume.
      </p>

      <div className="mt-6 space-y-4">
        <Field label="Role">
          <input
            className={inputClass}
            value={form.role}
            onChange={(e) => update('role', e.target.value)}
            placeholder="Software Engineering Intern"
            required
          />
        </Field>

        <Field label="Organization">
          <input
            className={inputClass}
            value={form.company}
            onChange={(e) => update('company', e.target.value)}
            placeholder="IEEE-CS at USF"
            required
          />
        </Field>

        <Field label="Location">
          <input
            className={inputClass}
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="Tampa, FL"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Started">
            <input
              type="month"
              className={inputClass}
              value={form.startDate}
              onChange={(e) => update('startDate', e.target.value)}
              required
            />
          </Field>
          <Field label="Ended">
            <input
              type="month"
              className={inputClass}
              value={form.current ? '' : form.endDate}
              onChange={(e) => update('endDate', e.target.value)}
              disabled={form.current}
              required={!form.current}
            />
          </Field>
        </div>

        <label className="flex w-fit items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            className="size-4 accent-usf-green"
            checked={form.current}
            onChange={(e) => update('current', e.target.checked)}
          />
          I&rsquo;m still in this role
        </label>

        <Field label="What you did">
          <textarea
            className={inputClass}
            rows={4}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Built the chapter's event check-in system in React, used by 300+ students at TechX."
          />
        </Field>
      </div>

      <button
        type="submit"
        className="mt-6 w-full rounded bg-ieee px-4 py-2.5 font-semibold text-white
                   transition-colors hover:bg-ieee-dark focus:outline-none
                   focus-visible:ring-2 focus-visible:ring-ieee/40 focus-visible:ring-offset-2"
      >
        Add experience
      </button>
    </form>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.8125rem] font-medium text-muted">
        {label}
      </span>
      {children}
    </label>
  )
}
