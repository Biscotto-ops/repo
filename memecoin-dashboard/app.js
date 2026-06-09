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
      return `<tr>
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
  return p.toPrecision(3);
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
  const labelIdx = [0, 28, 56, 84, 112, 140, balances.length - 1];
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
//  WATCHLIST (prix "live" qui bougent)
// =========================================================================
const watchState = TOKENS.slice(0, 9).map((tk) => ({
  ...tk,
  cur: tk.price,
  chg: (Math.random() - 0.35) * 40,
  hist: Array.from({ length: 16 }, () => 0.5 + Math.random()),
}));

function renderWatchlist() {
  const el = document.getElementById("watchlist");
  el.innerHTML = watchState
    .map((tk, idx) => {
      const cls = tk.chg >= 0 ? "pos" : "neg";
      return `<div class="watch-row">
        <span class="tok-badge" style="background:${tk.color}">${tk.sym[0]}</span>
        <div class="watch-main">
          <span class="watch-sym">${tk.sym}</span>
          <span class="watch-name">${tk.name}</span>
        </div>
        <canvas class="spark" data-i="${idx}"></canvas>
        <div class="watch-right">
          <div class="watch-price">$${fmtPriceJS(tk.cur)}</div>
          <div class="watch-chg ${cls}">${fmtPct(tk.chg)}</div>
        </div>
      </div>`;
    })
    .join("");
  drawSparks();
}

function drawSparks() {
  document.querySelectorAll(".spark").forEach((cv) => {
    const tk = watchState[+cv.dataset.i];
    const ctx = cv.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth || 64, h = cv.clientHeight || 26;
    cv.width = w * dpr; cv.height = h * dpr; ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const mn = Math.min(...tk.hist), mx = Math.max(...tk.hist);
    const col = tk.chg >= 0 ? "#1fd17b" : "#ff5470";
    ctx.beginPath();
    tk.hist.forEach((v, i) => {
      const xx = (i / (tk.hist.length - 1)) * w;
      const yy = h - ((v - mn) / (mx - mn || 1)) * (h - 4) - 2;
      i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
    });
    ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
  });
}

function tickWatchlist() {
  watchState.forEach((tk) => {
    const move = (Math.random() - 0.5) * 0.05;
    tk.cur = Math.max(tk.cur * (1 + move), tk.price * 0.2);
    tk.chg = Math.max(-95, tk.chg + (Math.random() - 0.5) * 3);
    tk.hist.push(tk.hist[tk.hist.length - 1] * (1 + move));
    tk.hist.shift();
  });
  // mise à jour ciblée des prix sans tout reconstruire
  document.querySelectorAll(".watch-row").forEach((row, i) => {
    const tk = watchState[i];
    const cls = tk.chg >= 0 ? "pos" : "neg";
    row.querySelector(".watch-price").textContent = "$" + fmtPriceJS(tk.cur);
    const chg = row.querySelector(".watch-chg");
    chg.textContent = fmtPct(tk.chg);
    chg.className = "watch-chg " + cls;
  });
  drawSparks();
}

// =========================================================================
//  OPEN POSITIONS (3 positions actives fictives)
// =========================================================================
function renderPositions() {
  const el = document.getElementById("openPositions");
  const open = [
    { tk: TOKENS[0], size: 1.85, pl: 0.62, plPct: 33.5 },
    { tk: TOKENS[6], size: 0.95, pl: -0.11, plPct: -11.6 },
    { tk: TOKENS[10], size: 1.20, pl: 0.41, plPct: 34.2 },
  ];
  el.innerHTML = open
    .map((p) => {
      const cls = p.pl >= 0 ? "pos" : "neg";
      return `<div class="pos-row">
        <span class="tok-badge" style="background:${p.tk.color}">${p.tk.sym[0]}</span>
        <div class="watch-main">
          <span class="watch-sym">${p.tk.sym}</span>
          <span class="watch-name">${p.size.toFixed(2)} ETH engagés</span>
        </div>
        <div class="pos-amount">
          <div class="eth ${cls}">${fmtEthSigned(p.pl, 2)}</div>
          <div class="pl ${cls}">${fmtPct(p.plPct)}</div>
        </div>
      </div>`;
    })
    .join("");
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
  renderWatchlist();
  renderPositions();

  setInterval(tickWatchlist, 1500);
  window.addEventListener("resize", () => { drawChart(); drawSparks(); });
}

document.addEventListener("DOMContentLoaded", init);
