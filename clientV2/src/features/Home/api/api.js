export async function fetchAppManagers(worker, apiBase) {
  const response = await fetch(
    `${apiBase}/users?privilege=admin&status=available`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${worker.token}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error('Failed to fetch application managers')
  }

  return response.json()
}
