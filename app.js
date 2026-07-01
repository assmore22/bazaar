import { makeReader, write, connectWallet, activeAccount, balanceOf, short, toGen, GEN, fmtErr }
  from "../shared/genlayer-lite.js";

const CONTRACT = "0x65135bB831a542551BdD2CAb83834c5f16E2A107";
const { read } = makeReader(CONTRACT);
const S_LISTED = 0, S_SOLD = 1, S_DELIVERED = 2, S_REFUNDED = 3, S_CANCELLED = 4;
const STLABEL = ["Available", "In escrow", "Delivered", "Refunded", "Withdrawn"];
const STCLS = ["st-listed", "st-sold", "st-delivered", "st-refunded", "st-cancelled"];
let account = null, items = [], catFilter = "all", sellCat = "design";
const $ = (id) => document.getElementById(id);
const app = () => $("app");
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const short2 = short;
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (_) { return u; } };
const gradClass = (cat) => "c" + (1 + (Array.from(cat || "x").reduce((a, c) => a + c.charCodeAt(0), 0) % 4));
const catIcon = (cat) => ({ design: "ph-palette", saas: "ph-chart-line-up", docs: "ph-file-text", general: "ph-package" }[cat] || "ph-package");

$("contractLink").textContent = "Contract";

function toast(msg, kind = "", title = "bazaar") {
  const el = document.createElement("div"); el.className = "toast " + kind;
  el.innerHTML = `<span class="tt">${title}</span>`; el.appendChild(document.createTextNode(msg));
  $("log").appendChild(el); setTimeout(() => el.remove(), kind === "err" ? 15000 : 5000);
}

async function refreshWallet() {
  account = await activeAccount();
  const slot = $("walletslot");
  if (account) { let bal = 0n; try { bal = await balanceOf(account); } catch (_) {} slot.innerHTML = `<span class="mono" style="font-size:12.5px;color:var(--grey)">${short(account)} · ${toGen(bal)} GEN</span>`; }
  else { slot.innerHTML = `<button class="btn ghost sm" id="connectBtn">Connect</button>`; $("connectBtn").onclick = doConnect; }
}
async function doConnect() { try { account = await connectWallet(); toast("Connected on studionet.", "ok"); await refreshWallet(); route(); } catch (e) { toast(fmtErr(e), "err"); } }
async function ensureWallet() { if (!account) account = await connectWallet(); await refreshWallet(); }

async function loadItems() {
  const count = Number(await read("get_item_count"));
  const out = [];
  for (let i = 0; i < count; i++) out.push({ id: i, ...(await read("get_item", [i])) });
  items = out;
}

/* ---------- ROUTER ---------- */
function setNav(route) {
  document.querySelectorAll(".nl").forEach((a) => a.classList.toggle("on", a.dataset.route === route));
}
async function route() {
  const h = location.hash || "#/";
  if (h.startsWith("#/item/")) { setNav("browse"); return renderItem(Number(h.split("/")[2])); }
  if (h.startsWith("#/sell")) { setNav("sell"); return renderSell(); }
  setNav("browse"); return renderBrowse();
}

/* ---------- BROWSE ---------- */
function renderBrowse() {
  const cats = ["all", ...new Set(items.map((i) => i.category))];
  const shown = items.filter((i) => catFilter === "all" || i.category === catFilter);
  app().innerHTML = `<div class="view">
    <section class="bz-hero"><h1>A market where the <span class="accent">listing has to be true.</span></h1>
      <p>Buy with escrow. A validator set reads the deliverable and confirms it matches the listing before the seller is paid.</p></section>
    <div class="cats">${cats.map((c) => `<span class="cat ${c === catFilter ? "on" : ""}" data-cat="${esc(c)}">${c === "all" ? "All" : esc(c)}</span>`).join("")}</div>
    <div class="grid">${shown.length ? shown.slice().reverse().map(itemCard).join("") : `<div class="empty">No items here yet. <a href="#/sell">List the first one →</a></div>`}</div>
  </div>`;
  document.querySelectorAll(".cat").forEach((c) => c.onclick = () => { catFilter = c.dataset.cat; renderBrowse(); });
  document.querySelectorAll("[data-item]").forEach((c) => c.onclick = () => { location.hash = "#/item/" + c.dataset.item; });
}
function itemCard(it) {
  const st = Number(it.status);
  return `<div class="item" data-item="${it.id}">
    <div class="item-top ${gradClass(it.category)}"><i class="ph-fill ${catIcon(it.category)}"></i>
      <span class="item-cat">${esc(it.category)}</span><span class="item-st ${STCLS[st]}">${STLABEL[st]}</span></div>
    <div class="item-b"><div class="item-title">${esc(it.title)}</div><div class="item-desc">${esc(it.description)}</div>
      <div class="item-foot"><span class="item-price">${toGen(it.price)} <small>GEN</small></span><span class="btn line sm">View →</span></div></div>
  </div>`;
}

/* ---------- ITEM PAGE ---------- */
function renderItem(id) {
  const it = items.find((x) => x.id === id);
  if (!it) { app().innerHTML = `<div class="view"><p class="back" onclick="location.hash='#/'">← Back</p><div class="empty">Item not found.</div></div>`; return; }
  const st = Number(it.status);
  const isSeller = account && account.toLowerCase() === it.seller.toLowerCase();
  let verdict = "";
  if (st === S_DELIVERED) verdict = `<div class="ip-verdict vb-ok"><b>Delivered & paid.</b> ${it.rationale ? esc(it.rationale) : "The deliverable matched the listing."}</div>`;
  if (st === S_REFUNDED) verdict = `<div class="ip-verdict vb-no"><b>Refunded to buyer.</b> ${it.rationale ? esc(it.rationale) : "The deliverable did not match."}</div>`;
  let actions = "";
  if (st === S_LISTED && !isSeller) actions = `<button class="btn primary lg" id="buyBtn"><i class="ph-bold ph-shopping-cart"></i> Buy for ${toGen(it.price)} GEN</button><div class="fhint" style="font-size:12.5px;color:var(--faint)">Payment is held in escrow until the deliverable is verified.</div>`;
  else if (st === S_LISTED && isSeller) actions = `<button class="btn line lg" id="cancelBtn">Remove listing</button>`;
  else if (st === S_SOLD) actions = `<button class="btn dark lg" id="confirmBtn"><i class="ph-bold ph-shield-check"></i> Verify & settle</button><div class="fhint" style="font-size:12.5px;color:var(--faint)">Validators read the deliverable. Match → seller paid. Mismatch → buyer refunded. Calls a real LLM.</div>`;
  app().innerHTML = `<div class="view">
    <p class="back" id="backBtn">← Back to browse</p>
    <div class="item-page">
      <div class="ip-visual ${gradClass(it.category)}" style="background:linear-gradient(135deg,var(--coral),#ff8a5c)"><i class="ph-fill ${catIcon(it.category)}"></i></div>
      <div class="ip-side">
        <span class="ip-cat">${esc(it.category)}</span>
        <h1 class="ip-title">${esc(it.title)}</h1>
        <p class="ip-desc">${esc(it.description)}</p>
        ${verdict}
        <div class="ip-price">${toGen(it.price)} <small style="font-size:15px;color:var(--grey);font-family:var(--sans)">GEN</small></div>
        <div class="ip-meta">
          <div class="ip-kv"><span class="k">Status</span><span class="v">${STLABEL[st]}</span></div>
          <div class="ip-kv"><span class="k">Seller</span><span class="v">${short(it.seller)}</span></div>
          <div class="ip-kv"><span class="k">Deliverable</span><span class="v"><a href="${esc(it.proof_url)}" target="_blank" rel="noopener">${esc(hostOf(it.proof_url))} ↗</a></span></div>
        </div>
        <div class="ip-actions">${actions}</div>
      </div>
    </div></div>`;
  $("backBtn").onclick = () => { location.hash = "#/"; };
  if ($("buyBtn")) $("buyBtn").onclick = () => doBuy(it);
  if ($("cancelBtn")) $("cancelBtn").onclick = () => doCancel(it.id);
  if ($("confirmBtn")) $("confirmBtn").onclick = () => doConfirm(it.id);
}

/* ---------- SELL PAGE (form is its own route/page) ---------- */
function renderSell() {
  const cats = ["design", "saas", "docs", "code", "media", "general"];
  app().innerHTML = `<div class="view"><div class="sell">
    <div class="sell-h"><h1>List an item</h1><p>Describe it honestly and link the deliverable - the validator set checks it matches before you're paid.</p></div>
    <div class="field"><label>Title</label><input id="nTitle" maxlength="90" placeholder="e.g. 20 hand-drawn SVG icons" /></div>
    <div class="field"><label>Category</label><div class="cat-pick">${cats.map((c) => `<span class="cat ${c === sellCat ? "on" : ""}" data-sc="${c}">${c}</span>`).join("")}</div></div>
    <div class="field"><label>Description - what the buyer gets</label><textarea id="nDesc" placeholder="Be specific. This is what the validators check the deliverable against."></textarea></div>
    <div class="row2">
      <div class="field"><label>Deliverable URL</label><input id="nUrl" placeholder="https://… where it lives" /></div>
      <div class="field"><label>Price (GEN)</label><input id="nPrice" type="number" min="0" step="0.5" value="3" /></div>
    </div>
    <button class="btn primary lg" id="listBtn" style="margin-top:26px"><i class="ph-bold ph-storefront"></i> Publish listing</button>
  </div></div>`;
  document.querySelectorAll("[data-sc]").forEach((c) => c.onclick = () => { sellCat = c.dataset.sc; renderSell(); });
  $("listBtn").onclick = doList;
}

/* ---------- ACTIONS ---------- */
async function doBuy(it) {
  const btn = $("buyBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> buying';
  try { await ensureWallet(); await write(CONTRACT, "buy", [it.id], BigInt(it.price)); toast("Bought - payment in escrow.", "ok"); await loadItems(); route(); }
  catch (e) { toast(fmtErr(e), "err"); btn.disabled = false; btn.innerHTML = "Buy"; }
}
async function doConfirm(id) {
  if (!confirm("Verify & settle? Validators read the deliverable and decide if it matches. Calls a real LLM.")) return;
  const btn = $("confirmBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> validators verifying';
  try { await ensureWallet(); toast("Validators reading the deliverable…", "", "verify"); await write(CONTRACT, "confirm", [id]); toast("Settled on-chain.", "ok"); await loadItems(); route(); }
  catch (e) { toast(fmtErr(e), "err"); if (btn) { btn.disabled = false; btn.textContent = "Verify & settle"; } }
}
async function doCancel(id) {
  const btn = $("cancelBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> removing';
  try { await ensureWallet(); await write(CONTRACT, "cancel", [id]); toast("Listing removed.", "ok"); await loadItems(); route(); }
  catch (e) { toast(fmtErr(e), "err"); btn.disabled = false; btn.textContent = "Remove listing"; }
}
async function doList() {
  const title = $("nTitle").value.trim(), desc = $("nDesc").value.trim(), url = $("nUrl").value.trim(), price = parseFloat($("nPrice").value);
  if (!title) return toast("Give it a title.", "err");
  if (!desc) return toast("Describe what the buyer gets.", "err");
  if (!url) return toast("Add the deliverable URL.", "err");
  if (!(price > 0)) return toast("Set a price above zero.", "err");
  const btn = $("listBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> publishing';
  try { await ensureWallet(); await write(CONTRACT, "list_item", [title, desc, url, sellCat, GEN(price)]); toast("Listed on the bazaar.", "ok"); await loadItems(); location.hash = "#/"; }
  catch (e) { toast(fmtErr(e), "err"); btn.disabled = false; btn.innerHTML = "Publish listing"; }
}

window.addEventListener("hashchange", route);
const _cb = $("connectBtn"); if (_cb) _cb.onclick = doConnect;
if (window.ethereum) window.ethereum.on?.("accountsChanged", refreshWallet);

(async () => {
  await refreshWallet();
  try { await loadItems(); } catch (e) { app().innerHTML = `<div class="loading">Could not reach the chain. ${fmtErr(e)}</div>`; return; }
  route();
})();
