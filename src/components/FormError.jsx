export default function FormError({ message }) {
  if (!message) return null

  return (
    <p
      role="alert"
      className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-[0.8125rem] text-red-800"
    >
      {message}
    </p>
  )
}
