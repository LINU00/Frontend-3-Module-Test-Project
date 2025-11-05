const API_URL =
  "https://api.coingecko.com/api/v3/coins/markets" +
  "?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false";

const tbody = document.getElementById("tbody");
const statusEl = document.getElementById("status");
const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");
const sortCapBtn = document.getElementById("sortCapBtn");
const sortPctBtn = document.getElementById("sortPctBtn");
const loadAsyncBtn = document.getElementById("loadAsyncBtn");
const loadThenBtn = document.getElementById("loadThenBtn");

let raw = [];
let view = [];
let sortState = { capAsc: false, pctAsc: false };

const nf2 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const money = (n) => (n == null || isNaN(n) ? "-" : "$" + nf2.format(n));
const pct = (n) => (n == null || isNaN(n) ? "-" : n.toFixed(2) + "%");

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function render(rows) {
  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="center muted">No results.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map((c) => {
      const up = (c.price_change_percentage_24h ?? 0) >= 0;
      return `
      <tr>
        <td class="left">
          <img class="coin" src="${c.image}" alt="${c.name}"/>
          <span class="name">${c.name}</span>
        </td>
        <td class="sym">${c.symbol.toUpperCase()}</td>
        <td>${c.id}</td>
        <td class="right">${money(c.current_price)}</td>
        <td class="right">
          <span class="chip ${up ? "up" : "down"}">
            ${pct(c.price_change_percentage_24h)}
          </span>
        </td>
        <td class="right">${money(c.total_volume)}</td>
        <td class="right">
          <span class="muted">Mkt Cap :</span> ${nf2.format(c.market_cap)}
        </td>
      </tr>`;
    })
    .join("");
}

function applySearch() {
  const q = searchInput.value.trim().toLowerCase();
  view = q
    ? raw.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q)
      )
    : [...raw];
  render(view);
}

function sortByCap() {
  sortState.capAsc = !sortState.capAsc;
  const dir = sortState.capAsc ? 1 : -1;
  view.sort((a, b) => (a.market_cap - b.market_cap) * dir);
  render(view);
  setStatus(`Sorted by Market Cap (${sortState.capAsc ? "asc" : "desc"}).`);
}

function sortByPct() {
  sortState.pctAsc = !sortState.pctAsc;
  const dir = sortState.pctAsc ? 1 : -1;
  view.sort((a, b) => {
    const av = a.price_change_percentage_24h ?? -Infinity;
    const bv = b.price_change_percentage_24h ?? -Infinity;
    return (av - bv) * dir;
  });
  render(view);
  setStatus(`Sorted by 24h % (${sortState.pctAsc ? "asc" : "desc"}).`);
}

async function loadAsync() {
  try {
    setStatus("Loading (async/await) …");
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    raw = data.map((d) => ({
      id: d.id,
      name: d.name,
      image: d.image,
      symbol: d.symbol,
      current_price: d.current_price,
      total_volume: d.total_volume,
      market_cap: d.market_cap,
      price_change_percentage_24h: d.price_change_percentage_24h,
    }));
    view = [...raw];
    render(view);
    setStatus(`Loaded ${view.length} rows (async/await).`);
  } catch (err) {
    console.error(err);
    setStatus("Failed to load (async/await): " + err.message);
    render([]);
  }
}

function loadThen() {
  setStatus("Loading (.then) …");
  fetch(API_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      raw = data.map((d) => ({
        id: d.id,
        name: d.name,
        image: d.image,
        symbol: d.symbol,
        current_price: d.current_price,
        total_volume: d.total_volume,
        market_cap: d.market_cap,
        price_change_percentage_24h: d.price_change_percentage_24h,
      }));
      view = [...raw];
      render(view);
      setStatus(`Loaded ${view.length} rows (.then).`);
    })
    .catch((err) => {
      console.error(err);
      setStatus("Failed to load (.then): " + err.message);
      render([]);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  loadAsync();
  searchInput.addEventListener("input", applySearch);
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    applySearch();
    setStatus("Cleared search.");
  });
  sortCapBtn.addEventListener("click", sortByCap);
  sortPctBtn.addEventListener("click", sortByPct);
  loadAsyncBtn.addEventListener("click", loadAsync);
  loadThenBtn.addEventListener("click", loadThen);
});
