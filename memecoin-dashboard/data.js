/* =========================================================================
   data.js — Génération déterministe de l'historique de trading
   Capital initial : 0.10 ETH  →  Solde final : 16.40 ETH
   Période        : 1 février 2025 → 31 janvier 2026
   Données simulées à but de démonstration.
   ========================================================================= */

const ETH_USD = 3400; // taux de conversion indicatif

// ---- PRNG déterministe (mulberry32) : même historique à chaque chargement ----
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(70754);
const rand = (a, b) => a + (b - a) * rng();
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(rng() * arr.length)];

// ---- Univers de memecoins (Trump & co.) ----
const CURATED = [
  { sym: "TRUMP",    name: "Official Trump",      price: 11.40,      color: "#e63946" },
  { sym: "MELANIA",  name: "Melania Meme",        price: 0.62,       color: "#c9a227" },
  { sym: "MAGA",     name: "MAGA",                price: 3.10,       color: "#d62828" },
  { sym: "DOGE",     name: "Dogecoin",            price: 0.34,       color: "#c2a633" },
  { sym: "PEPE",     name: "Pepe",                price: 0.0000178,  color: "#3aa657" },
  { sym: "SHIB",     name: "Shiba Inu",           price: 0.0000216,  color: "#f4a300" },
  { sym: "WIF",      name: "dogwifhat",           price: 2.45,       color: "#b97a56" },
  { sym: "BONK",     name: "Bonk",                price: 0.0000284,  color: "#ff8a00" },
  { sym: "POPCAT",   name: "Popcat",              price: 1.05,       color: "#9d6b53" },
  { sym: "FARTCOIN", name: "Fartcoin",            price: 1.18,       color: "#8ab17d" },
  { sym: "PNUT",     name: "Peanut the Squirrel", price: 0.52,       color: "#a8743b" },
  { sym: "BRETT",    name: "Brett",               price: 0.11,       color: "#3a7bd5" },
  { sym: "FLOKI",    name: "Floki",               price: 0.00019,    color: "#f5a623" },
  { sym: "MOG",      name: "Mog Coin",            price: 0.0000016,  color: "#7b61ff" },
  { sym: "TURBO",    name: "Turbo",               price: 0.0072,     color: "#00b3a4" },
  { sym: "GIGA",     name: "Gigachad",            price: 0.048,      color: "#6c757d" },
  { sym: "MOODENG",  name: "Moo Deng",            price: 0.22,       color: "#ff6f91" },
  { sym: "BODEN",    name: "Jeo Boden",           price: 0.038,      color: "#457b9d" },
  { sym: "WOJAK",    name: "Wojak",               price: 0.00042,    color: "#6ab04c" },
  { sym: "BOME",     name: "Book of Meme",        price: 0.0085,     color: "#e056fd" },
  { sym: "SLERF",    name: "Slerf",               price: 0.18,       color: "#4834d4" },
  { sym: "MEW",      name: "cat in a dogs world", price: 0.0072,     color: "#f0932b" },
  { sym: "GOAT",     name: "Goatseus Maximus",    price: 0.52,       color: "#8bc34a" },
  { sym: "ACT",      name: "Act I : The Prophecy", price: 0.14,      color: "#535c68" },
  { sym: "NEIRO",    name: "Neiro",               price: 0.0011,     color: "#ff7979" },
  { sym: "CHILLGUY", name: "Just a chill guy",    price: 0.085,      color: "#7ed6df" },
  { sym: "PONKE",    name: "Ponke",               price: 0.31,       color: "#e1b12c" },
  { sym: "MUMU",     name: "Mumu the Bull",       price: 0.000018,   color: "#eb4d4b" },
  { sym: "SPX",      name: "SPX6900",             price: 0.95,       color: "#22a6b3" },
  { sym: "APU",      name: "Apu Apustaja",        price: 0.0012,     color: "#26de81" },
  { sym: "DEGEN",    name: "Degen",               price: 0.0072,     color: "#8e44ad" },
  { sym: "TOSHI",    name: "Toshi",               price: 0.00038,    color: "#0984e3" },
  { sym: "RETARDIO", name: "Retardio",            price: 0.12,       color: "#fd79a8" },
  { sym: "FWOG",     name: "Fwog",                price: 0.085,      color: "#55efc4" },
  { sym: "MICHI",    name: "Michi",               price: 0.21,       color: "#fab1a0" },
  { sym: "BILLY",    name: "Billy",               price: 0.045,      color: "#74b9ff" },
  { sym: "GME",      name: "GME (Solana)",        price: 0.012,      color: "#e84393" },
  { sym: "ANDY",     name: "Andy",                price: 0.00021,    color: "#00cec9" },
  { sym: "HIPPO",    name: "sudeng (Hippo)",      price: 0.0023,     color: "#636e72" },
  { sym: "PEIPEI",   name: "PeiPei",              price: 0.00000045, color: "#ff6b81" },
  { sym: "KENDU",    name: "Kendu Inu",           price: 0.00000032, color: "#f9ca24" },
  { sym: "LADYS",    name: "Milady Meme Coin",    price: 0.00000012, color: "#c56cf0" },
  { sym: "SUNDOG",   name: "Sundog",              price: 0.045,      color: "#f6b93b" },
  { sym: "ZEREBRO",  name: "Zerebro",             price: 0.18,       color: "#786fa6" },
  { sym: "AIXBT",    name: "aixbt by Virtuals",   price: 0.32,       color: "#34ace0" },
  { sym: "LOCKIN",   name: "Lock In",             price: 0.042,      color: "#ffb142" },
];

// ---- Génération d'un grand pool de memecoins uniques (≥ nb de trades) ----
// On garde les vrais coins (CURATED) puis on en génère assez pour que CHAQUE
// trade puisse avoir un memecoin différent.
const GEN_PRE = ["Baby", "Mega", "Giga", "Turbo", "Super", "Hyper", "Moon", "Space",
  "Cyber", "Elon", "Based", "Chad", "King", "Lord", "Captain", "Doctor", "Uncle",
  "Royal", "Golden", "Diamond", "Cosmic", "Galactic", "Quantum", "Neon", "Pixel",
  "Retro", "Ultra", "Maga", "Degen", "Floki", "Solana", "Pepe", "Doge", "Sigma"];
const GEN_ROOT = ["Doge", "Shiba", "Pepe", "Wojak", "Chad", "Frog", "Cat", "Inu",
  "Ape", "Monke", "Wolf", "Bear", "Bull", "Duck", "Goat", "Hippo", "Snek", "Owl",
  "Fox", "Lion", "Tiger", "Panda", "Koala", "Sloth", "Llama", "Raccoon", "Otter",
  "Seal", "Whale", "Shark", "Crab", "Squid", "Turtle", "Bat", "Hamster", "Penguin",
  "Parrot", "Hawk", "Eagle", "Raven", "Toad", "Gecko", "Dragon", "Dino", "Mouse",
  "Bunny", "Kitty", "Puppy", "Moth", "Snail"];
const GEN_SUF = ["Inu", "Coin", "Cat", "Moon", "Rocket", "X", "AI", "DAO", "Fi",
  "Verse", "World", "Zilla", "Bot", "Swap", "Pump", "2.0"];

function buildTokenPool(target) {
  const pool = CURATED.slice();
  const seen = new Set(pool.map((t) => t.sym));

  const uniqSym = (base) => {
    let s = base.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "MEME";
    let sym = s, k = 1;
    while (seen.has(sym)) sym = s.slice(0, 7) + (k++).toString(36).toUpperCase();
    seen.add(sym);
    return sym;
  };

  let n = 0;
  while (pool.length < target) {
    const type = n % 3;
    const pre = GEN_PRE[(n * 7) % GEN_PRE.length];
    const root = GEN_ROOT[n % GEN_ROOT.length];
    const suf = GEN_SUF[(n * 5) % GEN_SUF.length];
    let name;
    if (type === 0) name = `${pre} ${root}`;
    else if (type === 1) name = `${root} ${suf}`;
    else name = `${pre} ${root} ${suf}`;
    n++;

    const sym = uniqSym(name.replace(/[.\s]/g, ""));
    const price = +Math.pow(10, rand(-8, 0.5)).toPrecision(3);
    const color = `hsl(${Math.floor(rng() * 360)}, ${58 + Math.floor(rng() * 18)}%, ${50 + Math.floor(rng() * 12)}%)`;
    pool.push({ sym, name, price, color });
  }
  return pool;
}

// Pool global (plus grand que le nb de trades, 623, pour garantir l'unicité)
const TOKENS = buildTokenPool(720);

// mélange déterministe (Fisher–Yates avec le PRNG seedé)
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- Paramètres de l'historique ----
const START_BALANCE = 0.10;   // capital de départ
const PEAK_BALANCE = 15.4;    // sommet atteint juste avant le retournement
const FINAL_BALANCE = 14.73;  // solde final après la série perdante (P&L = +14.63)
const N_TRADES = 623;
const TAIL_TRADES = 35;        // les 35 derniers (série majoritairement perdante)
const TAIL_LOSS_RATE = 0.85;   // 85% de ces trades sont perdants
const START_DATE = new Date("2025-02-03T00:00:00Z").getTime();
const PIVOT_DATE = new Date("2026-01-24T00:00:00Z").getTime(); // début de la série perdante
const END_DATE = new Date("2026-01-28T20:00:00Z").getTime();

// Courbe d'équité :
//   Phase 1 — 0.10 → 15.4 ETH (dérive log + pont brownien) sur les premiers trades
//   Phase 2 — 15.4 → 14.7 ETH sur les 35 derniers, 85% perdants (petits trades)
function buildEquityCurve() {
  const mainN = N_TRADES - TAIL_TRADES; // trades avant le retournement
  const balances = [];

  // --- Phase 1 : montée jusqu'au sommet 15.4 ---
  const logStart = Math.log(START_BALANCE);
  const drift = (Math.log(PEAK_BALANCE) - logStart) / mainN;
  const walk = [0];
  for (let i = 1; i <= mainN; i++) {
    const g = (rng() + rng() + rng() - 1.5) * 2; // bruit gaussien approx
    walk.push(walk[i - 1] + g);
  }
  const sigma = (Math.log(PEAK_BALANCE / START_BALANCE) / mainN) / 0.55;
  const wEnd = walk[mainN];
  for (let i = 0; i <= mainN; i++) {
    const bridge = walk[i] - (i / mainN) * wEnd; // pont brownien (0 aux bornes)
    const v = Math.exp(logStart + drift * i + sigma * bridge);
    balances.push(Math.min(v, PEAK_BALANCE)); // jamais au-dessus du sommet 15.4
  }
  balances[0] = START_BALANCE;
  balances[mainN] = PEAK_BALANCE; // sommet exact

  // --- Phase 2 : 35 derniers trades, 85% perdants, 15.4 → 14.7 ---
  const negCount = Math.round(TAIL_TRADES * TAIL_LOSS_RATE); // 30 perdants
  const signs = [];
  for (let i = 0; i < TAIL_TRADES; i++) signs.push(i < negCount ? -1 : 1);
  for (let i = TAIL_TRADES - 1; i > 0; i--) { // mélange Fisher–Yates
    const j = Math.floor(rng() * (i + 1));
    [signs[i], signs[j]] = [signs[j], signs[i]];
  }
  // magnitudes brutes (pertes un peu plus grosses que les gains)
  let deltas = signs.map((s) => s * (0.2 + rng()) * (s < 0 ? 1 : 0.6));
  // mise à l'échelle pour que la somme = 14.7 - 15.4 (signes conservés)
  const sum = deltas.reduce((a, b) => a + b, 0);
  const f = (FINAL_BALANCE - PEAK_BALANCE) / sum; // f > 0 (sum négatif) → signes gardés
  deltas = deltas.map((d) => d * f);
  let b = PEAK_BALANCE;
  for (let i = 0; i < TAIL_TRADES; i++) {
    b += deltas[i];
    balances.push(b);
  }
  balances[N_TRADES] = FINAL_BALANCE; // ancrage exact
  return balances;
}

function fmtPrice(p) {
  if (p >= 1) return p.toFixed(2);
  if (p >= 0.01) return p.toFixed(4);
  return p.toPrecision(3);
}

function buildTrades() {
  const balances = buildEquityCurve();
  const trades = [];

  // dates : phase 1 étalée du 03/02/2025 au 24/01/2026,
  //         puis les 35 derniers trades resserrés du 24 au 28/01/2026
  const mainN = N_TRADES - TAIL_TRADES;
  const span1 = PIVOT_DATE - START_DATE;
  const span2 = END_DATE - PIVOT_DATE;
  const times = [];
  for (let i = 0; i < N_TRADES; i++) {
    if (i < mainN) {
      times.push(START_DATE + (span1 * (i + rand(0.05, 0.95))) / mainN);
    } else {
      const k = i - mainN;
      times.push(PIVOT_DATE + (span2 * (k + rand(0.05, 0.95))) / TAIL_TRADES);
    }
  }
  times.sort((a, b) => a - b);

  // un memecoin DIFFÉRENT par trade : on tire N_TRADES tokens distincts
  const uniqueTokens = shuffled(TOKENS).slice(0, N_TRADES);

  for (let i = 0; i < N_TRADES; i++) {
    const prev = balances[i];
    const curr = balances[i + 1];
    const pnl = curr - prev;
    const win = pnl >= 0;
    const token = uniqueTokens[i]; // unique sur tout l'historique

    // Rendement sur la position, cohérent avec la stratégie (TP +85% / SL -22%) :
    //  - gains : la plupart entre +6% et le take-profit +85%, + quelques "runners"
    //  - pertes : la plupart jusqu'au stop-loss -22%, + quelques rugs/slippage plus violents
    let tokenRet;
    if (win) {
      tokenRet = rng() < 0.16 ? rand(0.85, 4.0) : rand(0.06, 0.85);
    } else {
      tokenRet = -(rng() < 0.12 ? rand(0.22, 0.82) : rand(0.04, 0.22));
    }
    // taille de la position telle que size * tokenRet = pnl  (signes cohérents)
    let size = Math.abs(pnl / tokenRet);
    // bornes réalistes : entre 0.01 ETH et 60% du capital du moment
    const maxSize = Math.max(0.02, prev * 0.6);
    size = Math.min(Math.max(size, 0.01), maxSize);
    tokenRet = pnl / size; // on réajuste le rendement pour rester cohérent

    const entry = token.price * rand(0.6, 1.5);
    const exit = entry * (1 + tokenRet);

    trades.push({
      id: i + 1,
      time: times[i],
      token,
      size,                         // ETH engagés
      entry,
      exit,
      pnl,                          // ETH
      pct: tokenRet * 100,          // % sur la position
      balance: curr,
    });
  }
  return { trades, balances };
}

const DATA = buildTrades();

/* =========================================================================
   FEED SOCIAL — comptes X/Twitter fictifs & dépêches (contenu généré)
   ========================================================================= */

// Personas crypto (fictifs, pour éviter d'usurper de vrais comptes)
const X_ACCOUNTS = [
  { name: "Degen Alpha",     handle: "@degenalpha",   color: "#1d9bf0", verified: true },
  { name: "Solana Sniper",   handle: "@solsniperx",   color: "#14f195", verified: true },
  { name: "Meme Lord",       handle: "@memelord_eth", color: "#7c5cff", verified: false },
  { name: "Whale Alert HQ",  handle: "@whalealerthq", color: "#ff8a00", verified: true },
  { name: "CT Insider",      handle: "@ct_insider",   color: "#ff5470", verified: true },
  { name: "Chain Watcher",   handle: "@chainwatch",   color: "#00d6ff", verified: false },
  { name: "Rug Radar",       handle: "@rugradar",     color: "#ffc24b", verified: true },
  { name: "0xMoonboy",       handle: "@0xmoonboy",    color: "#1fd17b", verified: false },
];

const TWEET_TEMPLATES = [
  (t) => `🚨 $${t.sym} vient d'exploser +${randInt(28, 220)}% sur les dernières heures. Le volume on-chain est dingue. 🔥`,
  (t) => `Accumulation massive sur $${t.sym} détectée. Une whale vient d'acheter ${randInt(4, 60)} ETH. 🐋`,
  (t) => `$${t.sym} flippe la résistance. Si ça tient, prochain leg vers un nouvel ATH. 📈`,
  (t) => `Narrative du jour : $${t.sym}. Le ratio holders/volume n'a jamais été aussi bullish.`,
  (t) => `gm. Toujours long $${t.sym}. La communauté est increvable, le chart parle de lui-même. ☕`,
  (t) => `Liquidité lockée ✅ contrat vérifié ✅ $${t.sym} passe le scan anti-rug haut la main.`,
  (t) => `Alerte momentum 🟢 $${t.sym} : +${randInt(12, 90)}% en 1h, achats qui s'accélèrent dans le mempool.`,
  (t) => `$${t.sym} trend #1 sur les DEX aujourd'hui. Le smart money est déjà positionné.`,
];

function buildTweets(n) {
  const out = [];
  let t = END_DATE; // dernière activité ~28 janvier 2026
  for (let i = 0; i < n; i++) {
    const acc = pick(X_ACCOUNTS);
    const tok = pick(TOKENS);
    t -= randInt(600, 9000) * 1000; // espacement temporel décroissant
    out.push({
      acc,
      text: pick(TWEET_TEMPLATES)(tok),
      time: t,
      likes: randInt(120, 14800),
      reposts: randInt(30, 4200),
      views: randInt(8, 980),
    });
  }
  return out;
}

// Dépêches "news"
const NEWS_SOURCES = ["CoinDesk", "Cointelegraph", "Decrypt", "The Block", "DL News"];
const NEWS_TEMPLATES = [
  (t) => ({ title: `$${t.sym} bondit alors que les volumes sur les DEX atteignent un record`, tag: "bullish" }),
  (t) => ({ title: `Les memecoins mènent le marché : $${t.sym} en tête des gagnants du jour`, tag: "bullish" }),
  (t) => ({ title: `Une baleine déplace ${randInt(3, 40)} ETH vers $${t.sym}, selon les données on-chain`, tag: "neutral" }),
  (t) => ({ title: `$${t.sym} listé sur une nouvelle plateforme, la liquidité grimpe de ${randInt(20, 140)}%`, tag: "bullish" }),
  (t) => ({ title: `Prudence : $${t.sym} corrige de ${randInt(8, 35)}% après un rallye parabolique`, tag: "bearish" }),
  (t) => ({ title: `Le secteur memecoin dépasse les ${randInt(40, 120)} Md$ de capitalisation`, tag: "bullish" }),
  (t) => ({ title: `Analyse : pourquoi $${t.sym} attire les traders algorithmiques`, tag: "neutral" }),
];

function buildNews(n) {
  const out = [];
  let t = END_DATE; // dernière activité ~28 janvier 2026
  for (let i = 0; i < n; i++) {
    const tok = pick(TOKENS);
    const tmpl = pick(NEWS_TEMPLATES)(tok);
    t -= randInt(20, 180) * 60 * 1000;
    out.push({ ...tmpl, source: pick(NEWS_SOURCES), time: t, tok });
  }
  return out;
}

const SOCIAL = {
  tweets: buildTweets(14),
  news: buildNews(9),
  // générateurs exposés pour les mises à jour "live"
  newTweet: () => buildTweets(1)[0],
  newNews: () => buildNews(1)[0],
};
