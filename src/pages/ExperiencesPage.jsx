import { useState } from 'react'
import ExperienceForm from '../components/ExperienceForm'
import ExperienceTimeline from '../components/ExperienceTimeline'

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState([])

  return (
    <>
      <ExperienceForm
        onAdd={(entry) => setExperiences((prev) => [...prev, entry])}
      />
      <ExperienceTimeline
        experiences={experiences}
        onRemove={(id) =>
          setExperiences((prev) => prev.filter((exp) => exp.id !== id))
        }
      />
    </>
  )
}
