const EAN         = '711719028116'
const PRICE_FLOOR = 371.91
const ML_API      = 'https://api.mercadolibre.com'
const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

async function run() {
  console.log('=== WOLVERINE PS5 - ML API TEST ===\n')

  console.log('[1] Busca direta por EAN...')
  const r1 = await fetch(`${ML_API}/sites/MLB/search?q=${EAN}&limit=20`)
  const d1 = await r1.json()
  console.log('    Total:', d1.paging?.total ?? 0)

  console.log('[2] Busca EAN em games (MLB1648)...')
  const r2 = await fetch(`${ML_API}/sites/MLB/search?q=${EAN}&category=MLB1648&limit=20`)
  const d2 = await r2.json()
  console.log('    Total:', d2.paging?.total ?? 0)

  console.log('[3] Catalogo por EAN...')
  const r3 = await fetch(`${ML_API}/products/search?site_id=MLB&q=${EAN}`)
  const d3 = await r3.json()
  console.log('    Resposta:', JSON.stringify(d3).slice(0, 200))

  console.log('[4] Busca por titulo...')
  const r4 = await fetch(`${ML_API}/sites/MLB/search?q=Marvel+Wolverine+PS5&limit=20`)
  const d4 = await r4.json()
  const results = d4.results ?? []
  console.log('    Total:', d4.paging?.total ?? 0)

  results.forEach((r, i) => {
    const status = r.price < PRICE_FLOOR ? 'VIOLACAO' : 'OK'
    console.log(`\n  [${i+1}] ${status} | ${fmt(r.price)} | Seller: ${r.seller?.id}`)
    console.log(`       ${r.title?.slice(0, 60)}`)
    console.log(`       ${r.permalink}`)
  })

  console.log('\n=== FIM ===')
  console.log('Listings encontrados:', results.length)
}

run().catch(e => { console.error('ERRO:', e); process.exit(1) })
