const EAN         = '711719028116'
const PRICE_FLOOR = 371.91
const SRP         = 399.90
const ML_API      = 'https://api.mercadolibre.com'

const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

async function run() {
  console.log('================================================')
  console.log(' ML API Test — Wolverine PS5')
  console.log(` EAN: ${EAN} | SRP: ${fmt(SRP)} | Piso: ${fmt(PRICE_FLOOR)}`)
  console.log('================================================\n')

  console.log('Buscando listings...')
  const res  = await fetch(`${ML_API}/sites/MLB/search?q=${EAN}&limit=50`)
  const data = await res.json()
  const total   = data.paging?.total ?? 0
  const results = data.results ?? []

  console.log(`Total encontrado: ${total} | Exibindo: ${results.length}\n`)

  if (!results.length) {
    console.log('Nenhum listing ainda. Tentando por título...')
    const r2   = await fetch(`${ML_API}/sites/MLB/search?q=Wolverine+PS5&limit=5`)
    const d2   = await r2.json()
    console.log(`Por título: ${d2.paging?.total ?? 0} resultados`)
    d2.results?.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i+1}. ${r.title}`)
      console.log(`     Preço: ${fmt(r.price)} | Seller: ${r.seller?.id} | ID: ${r.id}`)
    })
    return
  }

  const violations = []
  const warnings   = []

  for (const [i, item] of results.entries()) {
    const price   = item.price
    const orig    = item.original_price
    const isBelow = price < PRICE_FLOOR
    const hasDisc = orig && (orig - price) / orig > 0.02

    const status = isBelow ? '🔴 VIOLACAO' : hasDisc ? '🟡 DESCONTO' : '🟢 OK'

    console.log(`[${i+1}] ${status}`)
    console.log(`     Título:  ${item.title?.slice(0, 55)}`)
    console.log(`     Preço:   ${fmt(price)}${orig ? ` (de ${fmt(orig)})` : ''}`)
    console.log(`     Seller:  ${item.seller?.id}`)
    console.log(`     Qtd:     ${item.available_quantity ?? '?'}`)
    console.log(`     Pré-venda: ${(item.tags ?? []).includes('pre_release') ? 'SIM' : 'não'}`)
    console.log(`     URL:     ${item.permalink}\n`)

    if (isBelow)  violations.push({ price, seller: item.seller?.id, url: item.permalink })
    if (hasDisc)  warnings.push({ price, orig, seller: item.seller?.id })
  }

  console.log('================================================')
  console.log(` Listings:   ${results.length}`)
  console.log(` Violações:  ${violations.length} ${violations.length ? '🔴' : '✓'}`)
  console.log(` Descontos:  ${warnings.length}   ${warnings.length   ? '🟡' : '✓'}`)
  console.log('================================================')

  if (violations.length) {
    console.log('\nViolações:')
    violations.forEach(v => console.log(`  → Seller ${v.seller}: ${fmt(v.price)} | ${v.url}`))
  }
}

run().catch(e => { console.error('Erro:', e); process.exit(1) })
