import JobForm from '../components/JobForm'
import JobList from '../components/JobList'
import { jobsApi } from '../lib/api'
import { useRecords } from '../lib/useRecords'

export default function JobsPage() {
  const { items, loading, error, add, remove } = useRecords(jobsApi, 'postings')

  return (
    <>
      <JobForm onAdd={add} error={error} />
      <JobList jobs={items} loading={loading} onRemove={remove} />
    </>
  )
}
