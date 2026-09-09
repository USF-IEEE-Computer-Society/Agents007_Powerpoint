import ExperienceForm from '../components/ExperienceForm'
import ExperienceTimeline from '../components/ExperienceTimeline'
import { experienceStore } from '../lib/storage'
import { useStoredList } from '../lib/useStoredList'

export default function ExperiencesPage() {
  const { items, add, remove } = useStoredList(experienceStore)

  return (
    <>
      <ExperienceForm onAdd={add} />
      <ExperienceTimeline experiences={items} onRemove={remove} />
    </>
  )
}
