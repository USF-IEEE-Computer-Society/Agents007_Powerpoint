import ExperienceForm from '../components/ExperienceForm'
import ExperienceTimeline from '../components/ExperienceTimeline'
import { experiencesApi } from '../lib/api'
import { useRecords } from '../lib/useRecords'

export default function ExperiencesPage() {
  const { items, loading, error, add, remove } = useRecords(
    experiencesApi,
    'experiences',
  )

  return (
    <>
      <ExperienceForm onAdd={add} error={error} />
      <ExperienceTimeline
        experiences={items}
        loading={loading}
        onRemove={remove}
      />
    </>
  )
}
