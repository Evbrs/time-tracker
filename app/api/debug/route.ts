export async function GET() {
  try {
    const { list } = await import('@vercel/blob')
    const { blobs } = await list({ prefix: 'time-tracker/' })

    // Try to fetch the employees.json file
    const empBlob = blobs.find(b => b.pathname === 'time-tracker/employees.json')
    let employees = null
    let fetchError = null

    if (empBlob) {
      try {
        const res = await fetch(empBlob.downloadUrl)
        employees = res.ok ? await res.json() : `fetch failed with ${res.status}`
      } catch (e) {
        fetchError = e instanceof Error ? e.message : String(e)
      }
    }

    return new Response(
      JSON.stringify({
        hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
        blobCount: blobs.length,
        blobFiles: blobs.map(b => b.pathname),
        fetchedEmployees: employees,
        fetchError,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
