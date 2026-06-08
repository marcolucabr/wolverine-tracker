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

  // Tentativa 2 — busca por EAN no campo correto
  console.log('[2] Busca por GTIN/EAN...')
  const r2 = await fetch(`${ML_API}/sites/MLB/search?q=${EAN}&category=MLB1648&limit=20`)
  const d2 = await r2.json()
  console.log(`    Total: ${d2.paging?.total ?? 0}\n`)

  // Tentativa 3 — busca pelo catalog_product_id
  console.log('[3] Busca no catálogo MLB por EAN...')
  const r3 = await fetch(`${ML_API}/products/search?site_id=MLB&q=${EAN}`)
  const d3 = await r3.json()
  console.log(`    Resposta: ${JSON.stringify(d3).slice(0, 200)}\n`)

  // Tentativa 4 — busca por título + plataforma (fallback confiável)
  console.log('[4] Busca por título (fallback)...')
  const r4 = await fetch(`${ML_API}/sites/MLB/search?q=Marvel+Wolverine+PlayStation+5&limit=20`)
  const d4 = await r4.json()
  const results = d4.results ?? []
  console.log(`    Total: ${d4.paging?.total ?? 0} | Exibindo: ${results.length}\n`)

  const violations = []

  results.forEach((r, i) => {
    const isBelow = r.price < PRICE_FLOOR
    const hasDisc = r.original_price && (r.original_price - r.price) / r.original_price > 0.02
    const status  = isBelow ? '🔴 VIOLACAO' : hasDisc ? '🟡 DESCONTO' : '🟢 OK'

    console.log(`  [${i+1}] ${status}`)
    console.log(`       ${r.title?.slice(0, 55)}`)
    console.log(`       Preço:  ${fmt(r.price)}${r.original_price ? ` (de ${fmt(r.original_price)})` : ''}`)
    console.log(`       Seller: ${r.seller?.id}`)
    console.log(`       Qtd:    ${r.available_quantity ?? '?'}`)
    console.log(`       Tags:   ${(r.tags ?? []).join(', ') || 'nenhuma'}`)
    console.log(`       URL:    ${r.permalink}\n`)

    if (isBelow) violations.push(r)
  })

  console.log('================================================')
  console.log(` Violations: ${violations.length} ${violations.length ? '🔴' : '✓'}`)
  console.log('================================================')
}

run().catch(e => { console.error('Erro:', e); process.exit(1) })
