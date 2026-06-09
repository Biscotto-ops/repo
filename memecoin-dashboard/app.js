/* =========================================================================
   app.js — Rendu du dashboard AlphaSnipe
   ========================================================================= */

const { trades, balances } = DATA;

// ---------- Helpers de formatage ----------
const fmtEth = (v, d = 2) => `${v >= 0 ? "" : "-"}${Math.abs(v).toFixed(d)} ETH`;
const fmtEthSigned = (v, d = 3) => `${v >= 0 ? "+" : "-"}${Math.abs(v).toFixed(d)} ETH`;
const fmtUsd = (v) =>
  "$" + Math.round(v).toLocaleString("en-US");
const fmtPct = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
function fmtDate(t) {
  const d = new Date(t);
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
}

// =========================================================================
//  STAT CARDS
// =========================================================================
function renderStats() {
  const finalBal = balances[balances.length - 1];
  const startBal = balances[0];
  const pnl = finalBal - startBal;
  const roi = (pnl / startBal) * 100;
  const wins = trades.filter((t) => t.pnl >= 0).length;
  const losses = trades.length - wins;
  const winrate = (wins / trades.length) * 100;
  const best = trades.reduce((m, t) => (t.pnl > m.pnl ? t : m), trades[0]);

  document.getElementById("statBalance").textContent = fmtEth(finalBal);
  document.getElementById("statBalanceUsd").textContent = `≈ ${fmtUsd(finalBal * ETH_USD)}`;
  document.getElementById("statPnl").textContent = fmtEthSigned(pnl, 2);
  document.getElementById("statRoi").textContent = `ROI ${fmtPct(roi)}`;
  document.getElementById("statWinrate").textContent = `${winrate.toFixed(1)}%`;
  document.getElementById("statWinLoss").innerHTML =
    `<span class="pos">${wins} gains</span> · <span class="neg">${losses} pertes</span>`;
  document.getElementById("statTrades").textContent = trades.length;
  document.getElementById("statBest").textContent = fmtEthSigned(best.pnl, 2);
  document.getElementById("statBestToken").textContent = `${best.token.sym} · ${fmtPct(best.pct)}`;
  document.getElementById("legendEnd").textContent = fmtEth(finalBal);
}

// =========================================================================
//  TRADE TABLE
// =========================================================================
let currentFilter = "all";

function badge(token) {
  return `<span class="tok-badge" style="background:${token.color}">${token.sym[0]}</span>`;
}

function renderTrades() {
  const body = document.getElementById("tradeBody");
  const rows = [...trades].reverse().filter((t) => {
    if (currentFilter === "win") return t.pnl >= 0;
    if (currentFilter === "loss") return t.pnl < 0;
    return true;
  });

  body.innerHTML = rows
    .map((t) => {
      const cls = t.pnl >= 0 ? "pos" : "neg";
      return `<tr class="trade-row" data-id="${t.id}">
        <td class="date-cell">${fmtDate(t.time)}</td>
        <td>
          <div class="tok-cell">
            ${badge(t.token)}
            <div>
              <div class="tok-sym">${t.token.sym}</div>
              <div class="tok-name">${t.token.name}</div>
            </div>
          </div>
        </td>
        <td><span class="side ${t.pnl >= 0 ? "buy" : "sell"}">${t.pnl >= 0 ? "LONG" : "LONG"}</span></td>
        <td class="num mono">${t.size.toFixed(3)}</td>
        <td class="num mono">$${fmtPriceJS(t.entry)}</td>
        <td class="num mono">$${fmtPriceJS(t.exit)}</td>
        <td class="num mono ${cls}">${fmtEthSigned(t.pnl, 3)}</td>
        <td class="num mono ${cls}">${fmtPct(t.pct)}</td>
        <td class="num mono">${t.balance.toFixed(3)}</td>
      </tr>`;
    })
    .join("");

  document.getElementById("historyCount").textContent = trades.length;
}

function fmtPriceJS(p) {
  if (p >= 1) return p.toFixed(2);
  if (p >= 0.01) return p.toFixed(4);
  if (p >= 0.0001) return p.toFixed(6);
  // très petits prix : 3 chiffres significatifs, toujours en décimal (jamais 8.18e-7)
  const exp = Math.floor(Math.log10(p));
  const decimals = Math.min(-exp + 2, 12);
  return p.toFixed(decimals);
}

function initFilters() {
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      currentFilter = chip.dataset.filter;
      renderTrades();
    });
  });
}

// =========================================================================
//  EQUITY CHART (canvas pur, sans dépendance)
// =========================================================================
const chartState = { pts: [], dpr: 1, pad: {} };

function drawChart() {
  const canvas = document.getElementById("equityChart");
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const pad = { l: 52, r: 14, t: 14, b: 28 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  // échelle log sur Y (croissance ~160x)
  const minV = balances[0];
  const maxV = Math.max(...balances);
  const logMin = Math.log(minV);
  const logMax = Math.log(maxV * 1.05);
  const x = (i) => pad.l + (i / (balances.length - 1)) * plotW;
  const y = (v) => pad.t + plotH - ((Math.log(v) - logMin) / (logMax - logMin)) * plotH;

  // grille horizontale + labels (échelle log)
  ctx.font = "11px Inter, sans-serif";
  ctx.textBaseline = "middle";
  const ticks = [0.1, 0.5, 1, 2, 5, 10, 16.4];
  ticks.forEach((tk) => {
    if (tk < minV || tk > maxV * 1.05) return;
    const yy = y(tk);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, yy);
    ctx.lineTo(W - pad.r, yy);
    ctx.stroke();
    ctx.fillStyle = "#5d6273";
    ctx.textAlign = "right";
    ctx.fillText(tk + "", pad.l - 8, yy);
  });

  // labels de mois sur X
  ctx.textAlign = "center";
  const lastIdx = balances.length - 1;
  const labelIdx = Array.from({ length: 7 }, (_, k) => Math.round((k * lastIdx) / 6));
  labelIdx.forEach((i) => {
    const tIdx = Math.min(i, trades.length - 1);
    const t = i === 0 ? START_DATE : trades[tIdx] ? trades[tIdx].time : END_DATE;
    const d = new Date(t);
    ctx.fillStyle = "#5d6273";
    ctx.fillText(`${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`, x(i), H - 10);
  });

  // aire dégradée
  const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + plotH);
  grad.addColorStop(0, "rgba(31,209,123,0.32)");
  grad.addColorStop(1, "rgba(31,209,123,0)");
  ctx.beginPath();
  balances.forEach((v, i) => (i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v))));
  ctx.lineTo(x(balances.length - 1), pad.t + plotH);
  ctx.lineTo(x(0), pad.t + plotH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // ligne
  ctx.beginPath();
  balances.forEach((v, i) => (i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v))));
  ctx.strokeStyle = "#1fd17b";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(31,209,123,0.5)";
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // point final
  const fx = x(balances.length - 1), fy = y(balances[balances.length - 1]);
  ctx.beginPath();
  ctx.arc(fx, fy, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = "#1fd17b";
  ctx.fill();
  ctx.strokeStyle = "#0a0b10";
  ctx.lineWidth = 2;
  ctx.stroke();

  chartState.pts = balances.map((v, i) => ({ x: x(i), y: y(v), v, i }));
}

function initChartHover() {
  const canvas = document.getElementById("equityChart");
  const tip = document.getElementById("chartTip");
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    let nearest = chartState.pts[0];
    let best = Infinity;
    for (const p of chartState.pts) {
      const d = Math.abs(p.x - mx);
      if (d < best) { best = d; nearest = p; }
    }
    if (!nearest) return;
    const t = nearest.i === 0 ? START_DATE : trades[nearest.i - 1].time;
    tip.style.opacity = 1;
    tip.style.left = nearest.x + "px";
    tip.style.top = nearest.y + "px";
    tip.innerHTML = `<b>${nearest.v.toFixed(3)} ETH</b><br><span style="color:#8b90a3">${fmtDate(t)}</span>`;
  });
  canvas.addEventListener("mouseleave", () => (document.getElementById("chartTip").style.opacity = 0));
}

// =========================================================================
//  MODALE générique + faux détails on-chain
// =========================================================================
function openModal(html) {
  document.getElementById("modalBody").innerHTML = html;
  document.getElementById("modalOverlay").classList.add("show");
}
function closeModal() {
  document.getElementById("modalOverlay").classList.remove("show");
}
function hexHash(seed, len) {
  // hash pseudo-aléatoire mais STABLE (même tx => même hash)
  let h = 2166136261 ^ seed;
  let out = "";
  for (let i = 0; i < len; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = (h ^ (h >>> 13)) >>> 0;
    out += "0123456789abcdef"[h & 15];
  }
  return out;
}
const DEXES = ["Uniswap V3", "Uniswap V2", "Raydium", "PancakeSwap", "1inch"];

function fmtFullDate(t) {
  const d = new Date(t);
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} · ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
}

function openTradeModal(id) {
  const t = trades[id - 1];
  if (!t) return;
  const cls = t.pnl >= 0 ? "pos" : "neg";
  const tx = "0x" + hexHash(id * 7 + 1, 40);
  const block = (18_900_000 + id * 217 + (hexHash(id, 4).charCodeAt(0) % 90)).toLocaleString("fr-FR");
  const gas = (5 + (id * 13) % 70) + " Gwei";
  const dex = DEXES[id % DEXES.length];
  const slip = (2 + (id * 3) % 11) + "." + (id % 10) + "%";
  const dur = (3 + (id * 5) % 56) + " min";
  const usd = Math.abs(t.pnl) * ETH_USD;
  openModal(`
    <div class="m-head">
      <span class="tok-badge" style="background:${t.token.color}">${t.token.sym[0]}</span>
      <div>
        <div class="m-title">${t.token.sym} <span class="muted-sm">${t.token.name}</span></div>
        <div class="muted-sm">${fmtFullDate(t.time)}</div>
      </div>
      <span class="side ${t.pnl >= 0 ? "buy" : "sell"}" style="margin-left:auto">LONG · CLÔTURÉ</span>
    </div>
    <div class="m-pnl ${cls}">${fmtEthSigned(t.pnl, 4)} <span class="muted-sm">(${fmtPct(t.pct)} · ${t.pnl >= 0 ? "+" : "-"}$${Math.round(usd).toLocaleString("fr-FR")})</span></div>
    <div class="m-grid">
      <div><span>Taille position</span><b>${t.size.toFixed(4)} ETH</b></div>
      <div><span>Prix d'entrée</span><b>$${fmtPriceJS(t.entry)}</b></div>
      <div><span>Prix de sortie</span><b>$${fmtPriceJS(t.exit)}</b></div>
      <div><span>Solde après trade</span><b>${t.balance.toFixed(4)} ETH</b></div>
      <div><span>DEX / Routeur</span><b>${dex}</b></div>
      <div><span>Durée de détention</span><b>${dur}</b></div>
      <div><span>Slippage</span><b>${slip}</b></div>
      <div><span>Gas</span><b>${gas}</b></div>
      <div><span>Bloc</span><b>${block}</b></div>
      <div class="m-wide"><span>Hash de transaction</span><b class="mono ellip">${tx}</b></div>
    </div>
  `);
}

// =========================================================================
//  POSITIONS OUVERTES (bot actif : P&L live, TP/SL qui se déclenchent)
// =========================================================================
const STRAT = { takeProfit: 0.85, stopLoss: -0.22 };
let posSeq = 0;

function makePosition() {
  const tk = pick(TOKENS);
  return {
    uid: ++posSeq,
    tk,
    size: +(rand(0.4, 2.6)).toFixed(3),
    entry: tk.price * rand(0.7, 1.4),
    pnlPct: rand(-0.04, 0.06),
    opened: Date.now() - randInt(2, 40) * 60000,
  };
}
let positions = Array.from({ length: 4 }, makePosition);

function renderPositions() {
  const el = document.getElementById("openPositions");
  el.innerHTML = positions
    .map((p) => {
      const pl = p.size * p.pnlPct;
      const cls = pl >= 0 ? "pos" : "neg";
      return `<div class="pos-row" data-uid="${p.uid}">
        <span class="tok-badge" style="background:${p.tk.color}">${p.tk.sym[0]}</span>
        <div class="watch-main">
          <span class="watch-sym">${p.tk.sym}</span>
          <span class="watch-name">${p.size.toFixed(2)} ETH · ${timeAgo(p.opened)}</span>
        </div>
        <div class="pos-amount">
          <div class="eth ${cls}">${fmtEthSigned(pl, 3)}</div>
          <div class="pl ${cls}">${fmtPct(p.pnlPct * 100)}</div>
        </div>
      </div>`;
    })
    .join("");
}

function tickPositions() {
  positions.forEach((p, i) => {
    // marche aléatoire avec légère dérive haussière (le bot gagne souvent)
    p.pnlPct += (Math.random() - 0.44) * 0.035;
    if (p.pnlPct >= STRAT.takeProfit || p.pnlPct <= STRAT.stopLoss) {
      positions[i] = makePosition(); // TP/SL atteint → on reprend une nouvelle paire
    }
  });
  renderPositions();
}

function openPositionModal(uid) {
  const p = positions.find((x) => x.uid === uid);
  if (!p) return;
  const pl = p.size * p.pnlPct;
  const cls = pl >= 0 ? "pos" : "neg";
  const cur = p.entry * (1 + p.pnlPct);
  const tpPrice = p.entry * (1 + STRAT.takeProfit);
  const slPrice = p.entry * (1 + STRAT.stopLoss);
  openModal(`
    <div class="m-head">
      <span class="tok-badge" style="background:${p.tk.color}">${p.tk.sym[0]}</span>
      <div>
        <div class="m-title">${p.tk.sym} <span class="muted-sm">${p.tk.name}</span></div>
        <div class="muted-sm">Ouverte ${timeAgo(p.opened)} · <span class="pos">EN COURS</span></div>
      </div>
      <span class="live-tag" style="margin-left:auto"><span class="status-dot"></span>LIVE</span>
    </div>
    <div class="m-pnl ${cls}">${fmtEthSigned(pl, 4)} <span class="muted-sm">(${fmtPct(p.pnlPct * 100)})</span></div>
    <div class="m-grid">
      <div><span>Taille engagée</span><b>${p.size.toFixed(4)} ETH</b></div>
      <div><span>Prix d'entrée</span><b>$${fmtPriceJS(p.entry)}</b></div>
      <div><span>Prix actuel</span><b>$${fmtPriceJS(cur)}</b></div>
      <div><span>Valeur position</span><b>${(p.size * (1 + p.pnlPct)).toFixed(4)} ETH</b></div>
      <div><span>Take profit (+85%)</span><b class="pos">$${fmtPriceJS(tpPrice)}</b></div>
      <div><span>Stop loss (-22%)</span><b class="neg">$${fmtPriceJS(slPrice)}</b></div>
    </div>
    <div class="m-bar"><div class="m-bar-fill ${cls}" style="width:${Math.max(4, Math.min(100, ((p.pnlPct - STRAT.stopLoss) / (STRAT.takeProfit - STRAT.stopLoss)) * 100)).toFixed(0)}%"></div></div>
    <div class="muted-sm" style="margin-top:6px">Progression entre stop-loss et take-profit</div>
  `);
}

// =========================================================================
//  TICKER TAPE (prix défilants)
// =========================================================================
const tickerState = TOKENS.map((tk) => ({
  ...tk, cur: tk.price, chg: (Math.random() - 0.4) * 60,
}));

function tickerItemHtml(tk) {
  const cls = tk.chg >= 0 ? "pos" : "neg";
  const arrow = tk.chg >= 0 ? "▲" : "▼";
  return `<span class="tick-item">
    <span class="tick-sym" style="color:${tk.color}">${tk.sym}</span>
    <span class="tick-price">$${fmtPriceJS(tk.cur)}</span>
    <span class="tick-chg ${cls}">${arrow} ${Math.abs(tk.chg).toFixed(1)}%</span>
  </span>`;
}

function renderTicker() {
  // dupliqué x2 pour un défilement en boucle continue
  const html = tickerState.map(tickerItemHtml).join("");
  document.getElementById("tickerTrack").innerHTML = html + html;
}

function tickTicker() {
  tickerState.forEach((tk) => {
    const move = (Math.random() - 0.5) * 0.04;
    tk.cur = Math.max(tk.cur * (1 + move), tk.price * 0.2);
    tk.chg = Math.max(-95, Math.min(900, tk.chg + (Math.random() - 0.5) * 2));
  });
  renderTicker();
}

// =========================================================================
//  TWITTER / X FEED
// =========================================================================
const MAX_TWEETS = 16;

function timeAgo(t) {
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}
function compact(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n + "";
}

function tweetHtml(tw) {
  return `<div class="tweet">
    <span class="tweet-av" style="background:${tw.acc.color}">${tw.acc.name[0]}</span>
    <div class="tweet-body">
      <div class="tweet-top">
        <span class="tweet-name">${tw.acc.name}</span>
        ${tw.acc.verified ? '<span class="tweet-verif">✔</span>' : ""}
        <span class="tweet-handle">${tw.acc.handle}</span>
        <span class="tweet-time">· ${timeAgo(tw.time)}</span>
      </div>
      <div class="tweet-text">${tw.text}</div>
      <div class="tweet-stats">
        <span>💬 ${compact(tw.reposts >> 3)}</span>
        <span>🔁 ${compact(tw.reposts)}</span>
        <span>❤ ${compact(tw.likes)}</span>
        <span>📊 ${tw.views}k</span>
      </div>
    </div>
  </div>`;
}

let tweets = [...SOCIAL.tweets];
function renderTweets() {
  document.getElementById("xFeed").innerHTML = tweets.map(tweetHtml).join("");
}
function pushTweet() {
  const tw = SOCIAL.newTweet();
  tw.time = Date.now();
  tweets.unshift(tw);
  if (tweets.length > MAX_TWEETS) tweets.pop();
  renderTweets();
}

// =========================================================================
//  NEWS FEED
// =========================================================================
const MAX_NEWS = 12;
const TAG_LABEL = { bullish: "Bullish", bearish: "Bearish", neutral: "Neutre" };

function newsHtml(n) {
  return `<div class="news-item">
    <span class="news-tok" style="background:${n.tok.color}">${n.tok.sym[0]}</span>
    <div class="news-body">
      <div class="news-meta">
        <span class="news-source">${n.source}</span>
        <span>· ${timeAgo(n.time)}</span>
        <span class="tag ${n.tag}">${TAG_LABEL[n.tag]}</span>
      </div>
      <div class="news-title">${n.title}</div>
    </div>
  </div>`;
}

let news = [...SOCIAL.news];
function renderNews() {
  document.getElementById("newsFeed").innerHTML = news.map(newsHtml).join("");
}
function pushNews() {
  const n = SOCIAL.newNews();
  n.time = Date.now();
  news.unshift(n);
  if (news.length > MAX_NEWS) news.pop();
  renderNews();
}

// =========================================================================
//  STRATÉGIE (modale détaillée)
// =========================================================================
function openStrategyModal() {
  const wins = trades.filter((t) => t.pnl >= 0).length;
  const wr = ((wins / trades.length) * 100).toFixed(1);
  openModal(`
    <div class="m-head">
      <span class="x-logo" style="background:linear-gradient(135deg,#7c5cff,#00d6ff);color:#0a0b10">◈</span>
      <div>
        <div class="m-title">Stratégie · Sniper + Momentum</div>
        <div class="muted-sm">Moteur d'exécution AlphaSnipe v3.2</div>
      </div>
    </div>
    <p class="m-desc">Le bot scanne le mempool à la recherche de nouvelles paires memecoin,
    filtre via un scan anti-rug (liquidité lockée, contrat vérifié, répartition des holders),
    puis entre en position avec un dimensionnement dynamique de type Kelly. Sortie automatique
    au take-profit ou stop-loss.</p>
    <div class="m-grid">
      <div><span>Take profit</span><b class="pos">+85%</b></div>
      <div><span>Stop loss</span><b class="neg">-22%</b></div>
      <div><span>Slippage max</span><b>12%</b></div>
      <div><span>Gas priority</span><b>Turbo (mempool)</b></div>
      <div><span>Dimensionnement</span><b>Kelly dynamique</b></div>
      <div><span>Anti-rug scan</span><b class="pos">Activé</b></div>
      <div><span>Win rate (historique)</span><b>${wr}%</b></div>
      <div><span>Trades exécutés</span><b>${trades.length}</b></div>
    </div>
  `);
}

// =========================================================================
//  BOT ON / OFF  +  boucles temporelles
// =========================================================================
let botActive = true;
const rndMs = (a, b) => a + Math.random() * (b - a);

function setBot(active) {
  botActive = active;
  const pill = document.getElementById("botToggle");
  const label = document.getElementById("botStatus");
  pill.classList.toggle("off", !active);
  label.textContent = active ? "BOT ACTIF" : "BOT DÉSACTIVÉ";
}

function loopTweet() {
  if (botActive) pushTweet();
  setTimeout(loopTweet, rndMs(120000, 180000)); // 2–3 min aléatoire
}
function loopNews() {
  if (botActive) pushNews();
  setTimeout(loopNews, rndMs(180000, 300000)); // 3–5 min aléatoire
}

// =========================================================================
//  INIT
// =========================================================================
function init() {
  renderStats();
  renderTrades();
  initFilters();
  drawChart();
  initChartHover();
  renderPositions();
  renderTicker();
  renderTweets();
  renderNews();

  // Boucles live (gelées quand le bot est désactivé)
  setInterval(() => { if (botActive) tickTicker(); }, 3000);
  setInterval(() => { if (botActive) tickPositions(); }, 2600);
  setInterval(() => { renderPositions(); }, 30000); // rafraîchit l'âge des positions
  loopTweet();
  loopNews();

  // Bot ON/OFF
  document.getElementById("botToggle").addEventListener("click", () => setBot(!botActive));

  // Clic sur un trade → fiche détail
  document.getElementById("tradeBody").addEventListener("click", (e) => {
    const row = e.target.closest(".trade-row");
    if (row) openTradeModal(+row.dataset.id);
  });
  // Clic sur une position → fiche détail
  document.getElementById("openPositions").addEventListener("click", (e) => {
    const row = e.target.closest(".pos-row");
    if (row) openPositionModal(+row.dataset.uid);
  });
  // Clic sur la stratégie → détail
  document.querySelector(".panel.strategy").addEventListener("click", openStrategyModal);

  // Fermeture de la modale
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay" || e.target.closest(".modal-close")) closeModal();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  window.addEventListener("resize", drawChart);
}

document.addEventListener("DOMContentLoaded", init);
