export async function GET() {
  try {
    const { list } = await import('@vercel/blob')
    const { blobs } = await list({ prefix: 'time-tracker/' })

    return new Response(
      JSON.stringify({
        hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
        blobCount: blobs.length,
        blobs: blobs.map(b => ({
          pathname: b.pathname,
          size: b.size,
          downloadUrl: b.downloadUrl?.substring(0, 60) + '...',
        })),
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
