export async function GET() {
  const data = { test: 'ok', time: new Date().toISOString() }
  const json = JSON.stringify(data)
  console.log('Returning:', json)
  return new Response(json, {
    headers: { 'Content-Type': 'application/json' },
  })
}
