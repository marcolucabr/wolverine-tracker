const EAN = '711719028116'
const PRICE_MIN = 290
const PRICE_MAX = 400
const PRICE_FLOOR = 371.91
const ML_API = 'https://api.mercadolibre.com'
const ML_CATALOG_IDS = ['MLB70334827', 'MLB66764100']
const KEYWORDS = ['Wolverine PS5','Wolverine PlayStation 5','Marvel Wolverine PS5','Wolverine da Marvel PlayStation','711719028116']
const HINTS = ['jogo','game','ps5','playstation','fisico','standard','blu-ray','videogame']
const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}`

function isRelevant(item) {
  const title = (item.title ?? '').toLowerCase()
  const price = item.price ?? 0
  if (price < PRICE_MIN || price > PRICE_MAX) return false
  if (['ean','catalog','catalog_items'].includes(item._source)) return true
  return HINTS.some(h => title.includes(h))
}

async function get(url) {
  try {
    const r = await fetch(url)
    return await r.json()
  } catch(e) {
    console.log('  fetch error:', e.message)
    return {}
  }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function scan() {
  const all = []

  console.log('[1] EAN direto...')
  const d1 = await get(`${ML_API}/sites/MLB/search?q=${EAN}&limit=50`)
  console.log('    total:', d1.paging?.total ?? 0)
  ;(d1.results ?? []).forEach(i => all.push({...i, _source:'ean'}))

  for (const catId of ML_CATALOG_IDS) {
    console.log(`[2] Catalogo ${catId} items...`)
    const d2 = await get(`${ML_API}/products/${catId}/items`)
    console.log('    resposta:', JSON.stringify(d2).slice(0,120))
    const items = d2.results ?? d2.items ?? []
    items.forEach(i => all.push({...i, _source:'catalog_items'}))
    await sleep(300)

    console.log(`[3] Search ${catId}...`)
    const d3 = await get(`${ML_API}/sites/MLB/search?q=${catId}&limit=50`)
    console.log('    total:', d3.paging?.total ?? 0)
    ;(d3.results ?? []).forEach(i => all.push({...i, _source:'catalog'}))
    await sleep(300)
  }

  for (const kw of KEYWORDS) {
    const d4 = await get(`${ML_API}/sites/MLB/search?q=${encodeURIComponent(kw)}&category=MLB1648&limit=20`)
    const total = d4.paging?.total ?? 0
    if (total > 0) console.log(`[KW] "${kw}" total: ${total}`)
    ;(d4.results ?? []).forEach(i => all.push({...i, _source:'keyword'}))
    await sleep(300)
  }

  return all
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
    source:      item._source ?? '',
    below_floor: (item.price ?? 0) < PRICE_FLOOR,
  }
}

function dedup(items) {
  const seen = new Set()
  return items.filter(i => {
    const k = i.url || i.id
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

async function run() {
  console.log('=== WOLVERINE PS5 MARKET SCANNER ===')
  console.log(`EAN: ${EAN} | Range: ${fmt(PRICE_MIN)}-${fmt(PRICE_MAX)} | Piso: ${fmt(PRICE_FLOOR)}\n`)

  const raw = await scan()
  console.log(`\nBrutos: ${raw.length}`)

  const relevant = dedup(raw.filter(isRelevant).map(normalize))
  console.log(`Relevantes: ${relevant.length}\n`)

  if (!relevant.length) {
    console.log('Nenhum seller ativo encontrado.')
    console.log('Produto existe no catalogo ML mas sem pré-venda aberta por sellers.')
    return
  }

  relevant.forEach((item, i) => {
    const s = item.below_floor ? 'VIOLACAO' : item.is_presale ? 'PRE-VENDA' : 'OK'
    console.log(`[${i+1}] ${s} | ${fmt(item.price)} | ${item.seller_name || item.seller_id}`)
    console.log(`     ${item.title.slice(0,60)}`)
    console.log(`     fonte: ${item.source}`)
    console.log(`     ${item.url}\n`)
  })

  console.log(`=== FIM | ${relevant.length} listings ===`)
}

run().catch(e => { console.error('ERRO:', e); process.exit(1) })
