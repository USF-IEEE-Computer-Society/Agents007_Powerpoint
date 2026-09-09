import { Outlet } from 'react-router-dom'
import Masthead from './components/Masthead'

export default function App() {
  return (
    <div className="min-h-screen">
      <Masthead />
      <main className="mx-auto grid max-w-5xl gap-10 px-6 py-12 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:py-14">
        <Outlet />
      </main>
    </div>
  )
}
