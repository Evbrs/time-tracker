export async function GET() {
  return new Response(
    JSON.stringify({
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      nodeEnv: process.env.NODE_ENV,
      tokenPreview: process.env.BLOB_READ_WRITE_TOKEN ? `${process.env.BLOB_READ_WRITE_TOKEN.substring(0, 20)}...` : 'MISSING',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
