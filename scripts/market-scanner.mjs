const EAN         = '711719028116'
const PRICE_MIN   = 290
const PRICE_MAX   = 400
const PRICE_FLOOR = 371.91
const ML_API      = 'https://api.mercadolibre.com'
const ML_CATALOG_IDS = ['MLB70334827', 'MLB66764100']
const KEYWORDS = [
  'Wolverine PS5',
  'Wolverine PlayStation 5',
  'Marvel Wolverine PS5',
  'Marvel Wolverine PlayStation 5',
  'Wolverine da Marvel PlayStation',
  '711719028116',
]
const VALID_CATEGORY_HINTS = [
  'jogo', 'game', 'ps5', 'playstation', 'midia fisica', 'fisico',
  'standard edition', 'blu-ray', 'videogame'
]
const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

function isRelevant(item) {
  const title = (item.title ?? '').toLowerCase()
  const price = item.price ?? 0
  if (price < PRICE_MIN || price > PRICE_MAX) return false
  const hasCategory = VALID_CATEGORY_HINTS.some(hint => title.includes(hint))
  return item._source === 'ean' || item._source === 'catalog' || item._source === 'catalog_items' || hasCategory
}

async function scanMercadoLivre() {
  const results = []

  // 1. EAN direto
  try {
    const r = await fetch(`${ML_API}/sites/MLB/search?q=${EAN}&limit=50`)
    const d = await r.json()
    console.log(`  [EAN] Total: ${d.paging?.total ?? 0}`)
    ;(d.results ?? []).forEach(item => results.push({ ...item, _source: 'ean' }))
  } catch(e) { console.log('[EAN] error:', e.message) }

  // 2. Itens vinculados ao catálogo (endpoint correto)
  for (const catId of ML_CATALOG_IDS) {
    try {
      const r = await fetch(`${ML_API}/products/${catId}/items`)
      const d = await r.json()
      console.log(`  [Catálogo ${catId}] Resposta:`, JSON.stringify(d).slice(0, 150))
      const items = d.results ?? d.items ?? []
      items.forEach(item => results.push({ ...item, _source: 'catalog_items' }))
    } catch(e) { console.log(`[Catálogo ${catId}] error:`, e.message) }
    await new Promise(r => setTimeout(r, 300))
  }

  // 3. Search pelo ID do catálogo
  for (const catId of ML_CATALOG_IDS) {
    try {
      const r = await fetch(`${ML_API}/sites/MLB/search?q=${catId}&limit=50`)
      const d = await r.json()
      console.log(`  [Search ${catId}] Total: ${d.paging?.total ?? 0}`)
      ;(d.results ?? []).forEach(item => results.push({ ...item, _source: 'catalog' }))
    } catch(e) { console.log(`[Search ${catId}] error:`, e.message) }
    await new Promise(r => setTimeout(r, 300))
  }

  // 4. Por palavras-chave
  for (const kw of KEYWORDS) {
    try {
      const r = await fetch(`${ML_API}/sites/MLB/search?q=${encodeURIComponent(kw)}&category=MLB1648&limit=20`)
      const d = await r.json()
      if ((d.paging?.total ?? 0) > 0) {
        console.log(`  [KW "${kw}"] Total: ${d.paging.total}`)
      }
      ;(d.results ?? []).forEach(item => results.push({ ...item, _source: 'keyword' }))
    } catch(e) { console.log(`[KW] error:`, e.message) }
    await new Promise(r => setTimeout(r, 300))
  }

  return results
}

function normalize(item) {
  return {
    id:          item.id ?? '',
    title:       item.title ?? '',
    price:       item.price ?? 0,
    seller_id:   String(item.seller?.id ?? item.seller_id ?? ''),
    seller_name: item.seller?.nickname ?? item.seller_name ?? '',
    url:         item.permalink ?? item.url ?? '',
    available:   (item.available_quantity ?? 1) > 0,
    is_presale:  (item.tags ?? []).includes('pre_release'),
    source:      item._source ?? 'keyword',
    below_floor: (item.price ?? 0) < PRICE_FLOOR,
  }
}

function deduplicate(items) {
  const seen = new Set()
  return items.filter(item => {
    const key = item.url || item.id
    if (seen.has(key)) return false
    seen.add(key); return true
  })
}

async function run() {
  console.log('=== WOLVERINE PS5 — MARKET SCANNER ===')
  console.log(`EAN: ${EAN} | Range: ${fmt(PRICE_MIN)}-${fmt(PRICE_MAX)} | Piso: ${fmt(PRICE_FLOOR)}\n`)

  console.log('Varrendo Mercado Livre...')
  const raw = await scanMercadoLivre()
  console.log(`\nBrutos coletados: ${raw.length}`)

  const relevant = deduplicate(raw.filter(isRelevant).map(normalize))
  console.log(`Listings relevantes: ${relevant.length}\n`)
