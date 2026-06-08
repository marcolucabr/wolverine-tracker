const EAN         = '711719028116'
const PRICE_FLOOR = 371.91
const SRP         = 399.90
const ML_API      = 'https://api.mercadolibre.com'

const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

async function run() {
  console.log('================================================')
  console.log(' ML API Test — Wolverine PS5')
  console.log(` EAN: ${EAN} | Piso: ${fmt(PRICE_FLOOR)}`)
  console.log('================================================\n')

  // Tentativa 1 — busca direta por EAN
  console.log('[1] Busca direta por EAN...')
  const r1 = await fetch(`${ML_API}/sites/MLB/search?q=${EAN}&limit=20`)
  const d1 = await r1.json()
  console.log(`    Total: ${d1.paging?.total ?? 0}\n`)

  // Tentativa 2 — busca por EAN na categoria de games
  console.log('[2] Busca por EAN em games...')
  const r2 = await fetch(`${ML_API}/sites/MLB/search?q=${EAN}&category=MLB1648&limit=20`)
  const d2 = await r2.json()
  console.log(`    Total: ${d2.paging?.total ?? 0}\n`)

  // Tentativa 3 — busca no catálogo por EAN
  console.log('[3] Busca no catálogo por EAN...')
  const r3 = await fetch(`${ML_API}/products/search?site_id=MLB&q=${EAN}`)
  const d3 = await r3.json()
  console.log(`    Resposta: ${JSON.stringify(d3).slice(0, 300)}\n`)

  // Tentativa 4 — busca por título
  console.log('[4] Busca por título...')
  const r4 = await fetch(`${ML_API}/sites/MLB/search?q=Marvel+Wolverine+PlayStation+5&limit=20`)
  const d4 = await r4.json()
  const results = d4.results ?? []
  console.log(`    Total: ${d4.paging?.total ?? 0} | Exibindo: ${results.length}\n`)

  results.forEach((r, i) => {
    const isBelow = r.price < PRICE_FLOOR
    const status  = isBelow ? '🔴 VIOLACAO' : '🟢 OK'
    console.log(`  [${i+1}] ${status} | ${fmt(r.price)} | Seller: ${r.seller?.id}`)
    console.log(`       ${r.title?.slice(0, 60)}`)
    console.log(`       ${r.permalink}\n`)
  })

  console.log('================================================')
  console.log(` Listings encontrados: ${results.length}`)
  console.log('================================================')
}

run().catch(e => { console.error('Erro:', e); process.exit(1) })
