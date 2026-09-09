import { useState } from 'react'
import ExperienceForm from '../components/ExperienceForm'
import ExperienceTimeline from '../components/ExperienceTimeline'
import { api } from '../lib/api'

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState([])
  const [error, setError] = useState('')

  async function add(entry) {
    try {
      const saved = await api.createExperience(entry)
      setExperiences((prev) => [...prev, saved])
      setError('')
      return true
    } catch {
      setError("Couldn't save that experience. Is the API running?")
      return false
    }
  }

  async function remove(id) {
    try {
      await api.deleteExperience(id)
      setExperiences((prev) => prev.filter((exp) => exp.id !== id))
      setError('')
    } catch {
      setError("Couldn't remove that experience. Is the API running?")
    }
  }

  return (
    <>
      <ExperienceForm onAdd={add} error={error} />
      <ExperienceTimeline experiences={experiences} onRemove={remove} />
    </>
  )
}
