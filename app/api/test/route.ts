export async function GET() {
  return new Response(JSON.stringify({ test: 'ok', time: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
