import JobForm from '../components/JobForm'
import JobList from '../components/JobList'
import { jobStore } from '../lib/storage'
import { useStoredList } from '../lib/useStoredList'

export default function JobsPage() {
  const { items, add, remove } = useStoredList(jobStore)

  return (
    <>
      <JobForm onAdd={add} />
      <JobList jobs={items} onRemove={remove} />
    </>
  )
}
