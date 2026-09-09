import { useEffect, useState } from 'react'
import Masthead from './components/Masthead'
import ExperienceForm from './components/ExperienceForm'
import ExperienceTimeline from './components/ExperienceTimeline'
import { loadExperiences, saveExperiences } from './lib/storage'

export default function App() {
  // Read once on the first render, before anything paints.
  const [experiences, setExperiences] = useState(loadExperiences)

  useEffect(() => {
    saveExperiences(experiences)
  }, [experiences])

  return (
    <div className="min-h-screen">
      <Masthead count={experiences.length} />

      <main className="mx-auto grid max-w-5xl gap-10 px-6 py-12 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:py-14">
        <ExperienceForm
          onAdd={(entry) => setExperiences((prev) => [...prev, entry])}
        />
        <ExperienceTimeline
          experiences={experiences}
          onRemove={(id) =>
            setExperiences((prev) => prev.filter((exp) => exp.id !== id))
          }
        />
      </main>
    </div>
  )
}
