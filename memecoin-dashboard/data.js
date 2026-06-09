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
const TOKENS = [
  { sym: "TRUMP",    name: "Official Trump",  price: 12.40,     color: "#e63946" },
  { sym: "MELANIA",  name: "Melania Meme",    price: 1.85,      color: "#c9a227" },
  { sym: "MAGA",     name: "MAGA",            price: 3.20,      color: "#d62828" },
  { sym: "DOGE",     name: "Dogecoin",        price: 0.38,      color: "#c2a633" },
  { sym: "PEPE",     name: "Pepe",            price: 0.0000182, color: "#3aa657" },
  { sym: "SHIB",     name: "Shiba Inu",       price: 0.0000264, color: "#f4a300" },
  { sym: "WIF",      name: "dogwifhat",       price: 2.95,      color: "#b97a56" },
  { sym: "BONK",     name: "Bonk",            price: 0.0000345, color: "#ff8a00" },
  { sym: "POPCAT",   name: "Popcat",          price: 1.42,      color: "#9d6b53" },
  { sym: "FARTCOIN", name: "Fartcoin",        price: 1.18,      color: "#8ab17d" },
  { sym: "PNUT",     name: "Peanut Squirrel", price: 0.78,      color: "#a8743b" },
  { sym: "BRETT",    name: "Brett",           price: 0.14,      color: "#3a7bd5" },
  { sym: "FLOKI",    name: "Floki",           price: 0.00021,   color: "#f5a623" },
  { sym: "MOG",      name: "Mog Coin",        price: 0.0000019, color: "#7b61ff" },
  { sym: "TURBO",    name: "Turbo",           price: 0.0085,    color: "#00b3a4" },
  { sym: "GIGA",     name: "Gigachad",        price: 0.062,     color: "#6c757d" },
  { sym: "MOODENG",  name: "Moo Deng",        price: 0.28,      color: "#ff6f91" },
  { sym: "BODEN",    name: "Jeo Boden",       price: 0.045,     color: "#457b9d" },
];

// ---- Paramètres de l'historique ----
const START_BALANCE = 0.10;
const END_BALANCE = 16.40;
const N_TRADES = 168;
const START_DATE = new Date("2025-02-01T00:00:00Z").getTime();
const END_DATE = new Date("2026-01-31T23:00:00Z").getTime();

// Courbe d'équité = dérive log linéaire (0.10→16.40) + pont brownien (bruit nul aux extrémités)
// => le solde final vaut EXACTEMENT 16.40 ETH, avec des phases de pertes réalistes.
function buildEquityCurve() {
  const logStart = Math.log(START_BALANCE);
  const logEnd = Math.log(END_BALANCE);
  const drift = (logEnd - logStart) / N_TRADES;

  // marche aléatoire brute
  const walk = [0];
  for (let i = 1; i <= N_TRADES; i++) {
    // bruit gaussien approx (somme de uniformes)
    const g = (rng() + rng() + rng() - 1.5) * 2;
    walk.push(walk[i - 1] + g);
  }
  const sigma = 0.058; // amplitude du bruit → ~30% de trades perdants
  const wEnd = walk[N_TRADES];

  const balances = [];
  for (let i = 0; i <= N_TRADES; i++) {
    const bridge = walk[i] - (i / N_TRADES) * wEnd; // pont brownien (0 aux bornes)
    const logBal = logStart + drift * i + sigma * bridge;
    balances.push(Math.exp(logBal));
  }
  balances[0] = START_BALANCE;
  balances[N_TRADES] = END_BALANCE; // ancrage exact
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

  // dates strictement croissantes réparties sur la période
  const span = END_DATE - START_DATE;
  const times = [];
  for (let i = 0; i < N_TRADES; i++) {
    const base = START_DATE + (span * (i + rand(0.05, 0.95))) / N_TRADES;
    times.push(base);
  }
  times.sort((a, b) => a - b);

  for (let i = 0; i < N_TRADES; i++) {
    const prev = balances[i];
    const curr = balances[i + 1];
    const pnl = curr - prev;
    const win = pnl >= 0;
    const token = pick(TOKENS);

    // rendement sur la position (mouvement du token)
    const tokenRet = win ? rand(0.22, 4.2) : -rand(0.10, 0.66);
    // taille de la position telle que size * tokenRet = pnl  (signes cohérents)
    const size = Math.abs(pnl / tokenRet);

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
