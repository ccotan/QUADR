/* QUADRANT — общий скрипт всех страниц */
const CONFIG = {
  name: "QUADRANT", ip: "play.quadrant-mc.ru", version: "1.21.4", season: "Сезон 1",
  discordInvite: "https://discord.gg/your-invite",
  mapUrl: "",            // адрес BlueMap / squaremap, например https://map.quadrant-mc.ru
  mapEngine: "BlueMap",
};

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const head = (n, s = 64) => `https://mc-heads.net/avatar/${encodeURIComponent(n)}/${s}`;
const bodyImg = (n, s = 300) => `https://mc-heads.net/body/${encodeURIComponent(n)}/${s}`;
const PAGE = document.body.dataset.page || "home";
const RM = matchMedia("(prefers-reduced-motion:reduce)").matches;
const ICON = {
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  bag: '<svg viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>',
  ext: '<svg viewBox="0 0 24 24"><path d="M14 3h7v7M10 14 21 3M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/></svg>',
  out: '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
};

/* ===================== каркас страницы ===================== */
const NAV = [["about.html", "О сервере", "about"], ["start.html", "Как начать", "start"], ["rules.html", "Правила", "rules"], ["faq.html", "FAQ", "faq"], ["map.html", "Карта", "map"], ["shop.html", "Магазин", "shop"]];
function layout() {
  document.body.insertAdjacentHTML("afterbegin", `
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <linearGradient id="qg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#42E3B4"/><stop offset=".55" stop-color="#21A038"/><stop offset="1" stop-color="#C8E83A"/></linearGradient>
  <symbol id="qlogo" viewBox="0 0 100 100"><path id="qp" d="M15 0H41A6 6 0 0 1 47 6V41A6 6 0 0 1 41 47H6A6 6 0 0 1 0 41V15A15 15 0 0 1 15 0Z"/><use href="#qp" transform="translate(100 0) scale(-1 1)"/><use href="#qp" transform="translate(0 100) scale(1 -1)"/><use href="#qp" transform="translate(100 100) scale(-1 -1)"/></symbol>
  <symbol id="dc" viewBox="0 0 24 24"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.4 18.4 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18.1a19.9 19.9 0 0 0 6 3l1.3-2.1c-.7-.3-1.4-.6-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.8 19.8 0 0 0 6-3c.5-5.2-.9-9.7-3.6-13.7zM8 15.3c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.5 8 10.5s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4z"/></symbol>
</defs></svg>
<div class="bg" aria-hidden="true"><i class="glow g1"></i><i class="glow g2"></i><i class="glow g3"></i><canvas id="field"></canvas><i class="vignette"></i></div>
<div class="announce" id="announce" hidden><span id="annText"></span><button aria-label="Скрыть" id="annClose">×</button></div>
<nav>
  <div class="wrap">
    <a href="index.html" class="logo" aria-label="QUADRANT — на главную"><svg><use href="#qlogo"/></svg><span class="lt"><b>QUADRANT</b><small>#vanilla</small></span></a>
    <div class="links" id="links">${NAV.map(([h, t, p]) => `<a href="${h}" class="${PAGE === p ? "active" : ""}" ${PAGE === p ? 'aria-current="page"' : ""}>${t}</a>`).join("")}</div>
    <div class="nav-right">
      <button class="btn" id="navLogin">Войти</button>
      <button class="chip" id="chip" aria-haspopup="menu" aria-expanded="false" hidden><img id="chipImg" alt=""><span class="lbl">Профиль</span><span class="ndot" id="chipDot" hidden></span><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>
      <div class="menu" id="menu" role="menu">
        <div class="menu-who"><small>Вы вошли как</small><b id="mNick"></b><div class="mrow"><span id="mRole"></span><span class="st" id="mSt"></span></div></div>
        <div class="next" id="mNext" hidden></div>
        <hr>
        <a class="item" href="profile.html">${ICON.user}Профиль</a>
        <a class="item" href="profile.html#settings">${ICON.gear}Настройки</a>
        <a class="item" href="shop.html">${ICON.bag}Магазин</a>
        <button class="item" data-act="copy">${ICON.copy}Скопировать IP</button>
        <a class="item" data-cfg-href="discordInvite" target="_blank" rel="noopener">${ICON.ext}Discord-сервер</a>
        <hr>
        <button class="item danger" data-act="logout">${ICON.out}Выйти</button>
      </div>
      <button class="burger" id="burger" aria-label="Меню" aria-expanded="false"><span></span></button>
    </div>
  </div>
</nav>`);
  document.body.insertAdjacentHTML("beforeend", `
<footer><div class="wrap"><a href="index.html" class="logo"><svg><use href="#qlogo"/></svg>QUADRANT</a><span class="flinks">${NAV.map(([h, t]) => `<a href="${h}">${t}</a>`).join("")}</span><span>© 2026 QUADRANT. Не связан с Mojang и Microsoft.</span></div></footer>
<div class="overlay" id="overlay" role="dialog" aria-modal="true" aria-labelledby="mTitle">
  <div class="modal">
    <button class="close" aria-label="Закрыть" data-close>×</button>
    <div id="modalBody"></div>
  </div>
</div>
<div class="toast" id="toast" role="status"></div>`);
}
layout();

function applyConfig() {
  $$("[data-cfg]").forEach(el => el.textContent = CONFIG[el.dataset.cfg]);
  $$("[data-cfg-href]").forEach(el => el.href = CONFIG[el.dataset.cfgHref]);
}
applyConfig();

/* ===================== статус игрока ===================== */
const ROLE = { player: ["PLAYER", "Игрок"], helper: ["HELPER", "Хелпер"], moderator: ["MOD", "Модератор"], admin: ["ADMIN", "Администратор"] };
const roleOf = u => ROLE[u && u.role] ? u.role : "player";
const roleBadge = u => { const r = roleOf(u); return `<img class="role" src="assets/role-${r === "moderator" ? "mod" : r}.png" alt="${ROLE[r][0]}" title="${ROLE[r][1]}">`; };
const adminStar = u => roleOf(u) === "admin" ? `<img class="astar" src="assets/star.png" alt="★" title="Администратор">` : "";
const STATUS = { banned: "Заблокирован", need_discord: "Нужен Discord", pending: "На рассмотрении", approved: "В вайтлисте", rejected: "Отклонён" };
const statusOf = u => u.banned ? "banned" : !(u.discord && u.discord.inGuild) ? "need_discord" : u.whitelisted ? "approved" : u.rejected ? "rejected" : "pending";

/* ===================== товары по умолчанию (демо) ===================== */
const DEFAULT_PRODUCTS = [
  { id: "plus1", cat: "Подписки", title: "QUADRANT+ · 1 мес", desc: "Цветной ник в Discord, значок на сайте и приоритет в очереди заявок.", price: 149, skin: "jeb_", color: "#21A038" },
  { id: "plus3", cat: "Подписки", title: "QUADRANT+ · 3 мес", desc: "Всё из подписки на месяц, но на три месяца и дешевле.", price: 399, old: 447, badge: "Выгодно", skin: "Dinnerbone", color: "#0FA8E0" },
  { id: "twink", cat: "Аккаунт", title: "Твинк-аккаунт", desc: "Второй аккаунт в вайтлисте, привязанный к основному.", price: 129, old: 259, skin: "Alex", color: "#E9A23B" },
  { id: "rename", cat: "Аккаунт", title: "Смена аккаунта", desc: "Перенос прогресса и места в вайтлисте на новый ник.", price: 99, skin: "Grumm", color: "#3CC6C9" },
  { id: "warn", cat: "Ограничения", title: "Снятие варна", desc: "Снимает одно предупреждение с аккаунта.", price: 79, skin: "Notch", color: "#D9822B" },
  { id: "unban", cat: "Ограничения", title: "Разблокировка", desc: "Досрочная разблокировка. Не действует на баны за читы и гриферство.", price: 499, skin: "Steve", color: "#7A3FC2" },
  { id: "badge", cat: "Поддержка", title: "Значок сезона", desc: "Памятный значок «Сезон 1» в профиле на сайте и роль в Discord.", price: 59, skin: "Technoblade", color: "#E5578A" },
  { id: "donate", cat: "Поддержка", title: "Поддержать сервер", desc: "Помощь в оплате хостинга. Спасибо от всей команды!", price: 100, badge: "Спасибо", skin: "Herobrine", color: "#7DBE2E" },
];
const pct = p => p.old ? `-${Math.round((1 - p.price / p.old) * 100)}%` : "";

/* ===================== API: server.js или демо в браузере ===================== */
const api = {
  live: false, discordEnabled: false,
  async init() {
    try { const r = await fetch("/api/config"); if (r.ok) { const c = await r.json(); this.live = true; this.discordEnabled = c.discordEnabled;
      for (const k of ["discordInvite", "ip", "mapUrl", "mapEngine"]) if (c[k]) CONFIG[k] = c[k]; applyConfig(); showAnnouncement(c.announcement); } } catch {}
  },
  async call(path, body) {
    if (this.live) {
      const r = await fetch("/api" + path, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, credentials: "same-origin" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Ошибка сервера");
      return j;
    }
    return demo(path, body);
  }
};
async function sha(s) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
async function demo(path, b = {}) {
  const users = JSON.parse(localStorage.getItem("q_users") || "{}");
  const orders = JSON.parse(localStorage.getItem("q_orders") || "[]");
  const save = () => { localStorage.setItem("q_users", JSON.stringify(users)); localStorage.setItem("q_orders", JSON.stringify(orders)); };
  const pub = u => { const { hash, ...rest } = u; return rest; };
  const key = () => (localStorage.getItem("q_session") || "").toLowerCase();
  const cur = () => users[key()];
  const need = () => { const u = cur(); if (!u) throw new Error("Войдите в аккаунт"); return u; };
  switch (path) {
    case "/status": return { online: true, players: 7, max: 50, sample: ["Steve", "Alex", "Notch", "jeb_", "Dinnerbone"], demo: true };
    case "/shop": return { products: DEFAULT_PRODUCTS };
    case "/me": { const u = cur(); if (u) return { user: pub(u) }; throw new Error("not auth"); }
    case "/logout": case "/logout-all": localStorage.removeItem("q_session"); return { ok: true };
    case "/discord/demo": { const u = need(); u.discord = { username: u.nick.toLowerCase(), inGuild: true }; save(); return { user: pub(u) }; }
    case "/discord/unlink": { const u = need(); u.discord = null; u.whitelisted = false; save(); return { user: pub(u) }; }
    case "/register": {
      const k = b.nick.toLowerCase();
      if (users[k]) throw new Error("Этот ник уже зарегистрирован");
      if (Object.values(users).some(u => u.email === b.email.toLowerCase())) throw new Error("Email уже используется");
      users[k] = { nick: b.nick, email: b.email.toLowerCase(), hash: await sha(b.nick + b.password), created: new Date().toISOString(), whitelisted: false, discord: null, bio: "", cover: 0 }; save();
      localStorage.setItem("q_session", b.nick); return { user: pub(users[k]) };
    }
    case "/login": {
      const u = users[b.login.toLowerCase()] || Object.values(users).find(x => x.email === b.login.toLowerCase());
      if (!u || u.hash !== await sha(u.nick + b.password)) throw new Error("Неверный ник или пароль");
      localStorage.setItem("q_session", u.nick); return { user: pub(u) };
    }
    case "/profile": { const u = need(); u.bio = String(b.bio || "").slice(0, 160); u.cover = +b.cover || 0; save(); return { user: pub(u) }; }
    case "/password": { const u = need(); if (u.hash !== await sha(u.nick + b.current)) throw new Error("Текущий пароль неверный"); if (String(b.next).length < 8) throw new Error("Новый пароль короче 8 символов"); u.hash = await sha(u.nick + b.next); save(); return { ok: true }; }
    case "/email": { const u = need(); if (u.hash !== await sha(u.nick + b.password)) throw new Error("Пароль неверный"); u.email = String(b.email).toLowerCase(); save(); return { user: pub(u) }; }
    case "/delete-account": { const u = need(); if (u.hash !== await sha(u.nick + b.password)) throw new Error("Пароль неверный"); delete users[key()]; localStorage.removeItem("q_session"); save(); return { ok: true }; }
    case "/stats": return { stats: null };
    case "/orders": { const u = cur(); return { orders: u ? orders.filter(o => o.nick === u.nick) : [] }; }
    case "/order": { const u = need(); const p = DEFAULT_PRODUCTS.find(x => x.id === b.product); const o = { id: "Q" + Date.now().toString(36).toUpperCase(), nick: u.nick, product: p.id, title: p.title, price: p.price, status: "awaiting_payment", created: new Date().toISOString(), method: b.method }; orders.unshift(o); save(); return { order: o, demo: true }; }
  }
  throw new Error("Недоступно в демо-режиме");
}

/* ===================== объявление ===================== */
function showAnnouncement(a) {
  if (!a || !a.enabled || !a.text || sessionStorage.getItem("q_ann") === a.text) return;
  $("#annText").textContent = a.text; $("#announce").className = "announce" + (a.type === "warn" ? " warn" : ""); $("#announce").hidden = false;
  $("#annClose").onclick = () => { $("#announce").hidden = true; sessionStorage.setItem("q_ann", a.text); };
}

/* ===================== UI: тосты, модалка ===================== */
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2800); }
const overlay = $("#overlay");
function openModal(html, focusSel) { closeMenu(); $("#modalBody").innerHTML = html; overlay.classList.add("open"); setTimeout(() => (focusSel && $(focusSel)) ? $(focusSel).focus() : $(".close", overlay).focus(), 60); }
function closeModal() { overlay.classList.remove("open"); }
overlay.addEventListener("click", e => { if (e.target === overlay || e.target.closest("[data-close]")) closeModal(); });
addEventListener("keydown", e => { if (e.key === "Escape") { closeModal(); closeMenu(); } });

/* ===================== вход / регистрация ===================== */
let tab = "register";
function authHTML() { return `
  <div class="mhead"><svg><use href="#qlogo"/></svg><h3 id="mTitle">Добро пожаловать</h3></div>
  <div class="tabs" data-tab="register" role="tablist"><span class="slider"></span>
    <button role="tab" aria-selected="true" data-tab-btn="register">Регистрация</button><button role="tab" aria-selected="false" data-tab-btn="login">Вход</button></div>
  <form id="authForm" novalidate>
    <div class="field"><label for="fNick" id="lNick">Ник в Minecraft</label><input id="fNick" autocomplete="username" maxlength="64" required><div class="hint" id="hNick"></div></div>
    <div class="field reg"><label for="fEmail">Email</label><input id="fEmail" type="email" autocomplete="email"><div class="hint" id="hEmail"></div></div>
    <div class="field"><label for="fPass">Пароль</label><div class="pw"><input id="fPass" type="password" autocomplete="new-password" required><button type="button" class="eye" id="eye" aria-label="Показать пароль"><svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button></div><div class="meter reg" id="meter"><i></i><i></i><i></i><i></i></div><div class="hint" id="hPass"></div></div>
    <label class="check reg"><input type="checkbox" id="fAgree"> <span>Я прочитал(а) <a href="rules.html" style="color:var(--mint)">правила сервера</a> и согласен(на) их соблюдать</span></label>
    <button class="btn btn-glow" type="submit" id="submitBtn">Зарегистрироваться</button>
    <div class="msg" id="msg" role="status"></div>
  </form>`; }
function openAuth(which) {
  openModal(authHTML(), "#fNick"); setTab(which || "register");
  $$("[data-tab-btn]").forEach(b => b.onclick = () => setTab(b.dataset.tabBtn));
  $("#eye").onclick = () => { const i = $("#fPass"); i.type = i.type === "password" ? "text" : "password"; };
  $("#fPass").addEventListener("input", e => { if (tab !== "register") return; const v = e.target.value; let l = 0; if (v.length >= 8) l++; if (/[A-ZА-Я]/.test(v) && /[a-zа-я]/.test(v)) l++; if (/\d/.test(v)) l++; if (/[^\w]/.test(v) || v.length >= 14) l++; $("#meter").dataset.l = v ? Math.max(l, 1) : 0; });
  $("#authForm").addEventListener("submit", submitAuth);
}
function setTab(t) {
  tab = t; $(".tabs").dataset.tab = t;
  $$("[data-tab-btn]").forEach(b => b.setAttribute("aria-selected", b.dataset.tabBtn === t));
  $$(".reg").forEach(el => el.hidden = t !== "register");
  $("#lNick").textContent = t === "register" ? "Ник в Minecraft" : "Ник или email";
  $("#fNick").maxLength = t === "register" ? 16 : 64;
  $("#fPass").autocomplete = t === "register" ? "new-password" : "current-password";
  $("#hNick").textContent = t === "register" ? "3–16 символов: латиница, цифры, _" : "";
  $("#hPass").textContent = t === "register" ? "Минимум 8 символов" : "";
  $("#submitBtn").textContent = t === "register" ? "Зарегистрироваться" : "Войти";
  $("#msg").textContent = ""; $$(".hint").forEach(h => h.classList.remove("err")); $$(".field input").forEach(i => i.classList.remove("bad"));
}
function fieldErr(id, hint, text) { $(id).classList.toggle("bad", !!text); if (text) { $(hint).textContent = text; $(hint).classList.add("err"); } else $(hint).classList.remove("err"); return !text; }
async function submitAuth(e) {
  e.preventDefault();
  const nick = $("#fNick").value.trim(), email = $("#fEmail").value.trim(), password = $("#fPass").value;
  let ok = true;
  if (tab === "register") {
    ok &= fieldErr("#fNick", "#hNick", /^[A-Za-z0-9_]{3,16}$/.test(nick) ? "" : "Только латиница, цифры и _, от 3 до 16 символов");
    ok &= fieldErr("#fEmail", "#hEmail", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Введите корректный email");
    ok &= fieldErr("#fPass", "#hPass", password.length >= 8 ? "" : "Пароль должен быть не короче 8 символов");
    if (ok && !$("#fAgree").checked) { $("#msg").className = "msg err"; $("#msg").textContent = "Нужно согласиться с правилами"; return; }
  } else {
    ok &= fieldErr("#fNick", "#hNick", nick ? "" : "Введите ник или email");
    ok &= fieldErr("#fPass", "#hPass", password ? "" : "Введите пароль");
  }
  if (!ok) return;
  const btn = $("#submitBtn"); btn.disabled = true; btn.style.opacity = .7;
  try {
    const reg = tab === "register";
    const r = reg ? await api.call("/register", { nick, email, password }) : await api.call("/login", { login: nick, password });
    closeModal(); setUser(r.user, true);
    toast(reg ? `Добро пожаловать на QUADRANT, ${r.user.nick}!` : `С возвращением, ${r.user.nick}!`);
  } catch (err) { $("#msg").className = "msg err"; $("#msg").textContent = err.message; }
  finally { btn.disabled = false; btn.style.opacity = ""; }
}

/* ===================== пользователь и профиль в углу ===================== */
const Q = { me: null, subs: [], onUser(cb) { this.subs.push(cb); if (this.ready) cb(this.me); }, ready: false };
function discordActs(u) {
  return `<div class="acts"><a class="btn btn-sm" href="${CONFIG.discordInvite}" target="_blank" rel="noopener">Вступить</a><button class="btn btn-sm btn-discord" data-act="discord"><svg viewBox="0 0 24 24" fill="#fff"><use href="#dc"/></svg>${u.discord ? "Проверить снова" : "Привязать Discord"}</button></div>`;
}
function trackHTML(u) {
  const s = statusOf(u), d = u.discord && u.discord.inGuild;
  const step = (cls, n, title, text, extra = "") => `<li class="${cls}"><span class="n">${n}</span><div><b>${title}</b><span>${text}</span>${extra}</div></li>`;
  let wl;
  if (s === "banned") wl = step("fail", "!", "Доступ закрыт", u.banReason ? `Причина: ${esc(u.banReason)}` : "Аккаунт заблокирован администрацией");
  else if (s === "approved") wl = step("done", "✓", "Вы в вайтлисте", `Заходите в игру: ${esc(CONFIG.ip)}`);
  else if (s === "rejected") wl = step("fail", "×", "Заявка отклонена", "Напишите администрации в Discord");
  else if (s === "pending") wl = step("cur", "3", "Вайтлист", "Заявка на рассмотрении у администрации");
  else wl = step("", "3", "Вайтлист", "Станет доступен после Discord");
  return `<ol class="track">` + step("done", "✓", "Аккаунт создан", new Date(u.created).toLocaleDateString("ru-RU"))
    + (d ? step("done", "✓", "Discord привязан", u.discord.username ? esc("@" + u.discord.username) : "Подтверждён администрацией")
         : step(s === "banned" ? "" : "cur", "2", "Зайдите в Discord", u.discord ? "Аккаунт привязан, но вы не на нашем сервере" : "Вступите на сервер и привяжите аккаунт", s === "banned" ? "" : discordActs(u)))
    + wl + `</ol>`;
}
function setUser(u, fresh) {
  Q.me = u; $("#navLogin").hidden = !!u; $("#chip").hidden = !u;
  if (u) {
    const s = statusOf(u);
    $("#chipImg").src = head(u.nick, 32);
    $("#mNick").innerHTML = esc(u.nick) + adminStar(u); $("#mRole").innerHTML = roleBadge(u); $("#mSt").className = "st " + s; $("#mSt").textContent = STATUS[s];
    $("#chipDot").hidden = s !== "need_discord";
    const nx = $("#mNext");
    if (s === "need_discord") { nx.hidden = false; nx.innerHTML = `<b>Следующий шаг — Discord</b>Вступите на наш сервер и привяжите аккаунт, чтобы попасть в вайтлист.${discordActs(u)}`; }
    else if (s === "pending") { nx.hidden = false; nx.innerHTML = "<b>Заявка на рассмотрении</b>Мы пришлём уведомление в Discord, когда вас добавят."; }
    else nx.hidden = true;
    if (fresh) { $("#chip").classList.remove("new"); void $("#chip").offsetWidth; $("#chip").classList.add("new"); setTimeout(openMenu, 350); }
  } else closeMenu();
  Q.subs.forEach(cb => cb(u));
}
const openMenu = () => { $("#menu").classList.add("open"); $("#chip").setAttribute("aria-expanded", "true"); };
const closeMenu = () => { $("#menu").classList.remove("open"); $("#chip").setAttribute("aria-expanded", "false"); };
$("#chip").onclick = e => { e.stopPropagation(); $("#menu").classList.contains("open") ? closeMenu() : openMenu(); };
document.addEventListener("click", e => { if (!e.target.closest("#menu")) closeMenu(); });
$("#navLogin").onclick = () => openAuth("login");

async function linkDiscord() {
  if (api.live) { if (!api.discordEnabled) return toast("Discord-вход ещё не настроен администратором"); location.href = "/api/discord/login"; return; }
  window.open(CONFIG.discordInvite, "_blank", "noopener");
  const r = await api.call("/discord/demo", {}); setUser(r.user); toast("Discord привязан (демо) — заявка ушла администрации");
}
async function copyIp() { try { await navigator.clipboard.writeText(CONFIG.ip); } catch {} toast("IP скопирован: " + CONFIG.ip); }
async function logout() { await api.call("/logout", {}); setUser(null); closeModal(); toast("Вы вышли из аккаунта"); if (PAGE === "profile") setTimeout(() => location.href = "index.html", 600); }
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act],[data-open]"); if (!b) return;
  if (b.dataset.open) return Q.me ? (location.href = "profile.html") : openAuth(b.dataset.open);
  const a = b.dataset.act;
  if (a === "copy") { closeMenu(); copyIp(); }
  if (a === "discord") linkDiscord();
  if (a === "logout") logout();
});

/* мобильное меню, анимации появления, подсветка карточек */
$("#burger").onclick = e => { e.stopPropagation(); const n = $("nav"); n.classList.toggle("open"); $("#burger").setAttribute("aria-expanded", n.classList.contains("open")); };
const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: .12 });
function reveal(root = document) { $$(".reveal:not(.in)", root).forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); }); }
function spot(root = document) { $$(".card,.prod,.teaser", root).forEach(c => c.addEventListener("pointermove", e => { const r = c.getBoundingClientRect(); c.style.setProperty("--x", e.clientX - r.left + "px"); c.style.setProperty("--y", e.clientY - r.top + "px"); })); }
reveal(); spot();

/* ===================== статус сервера ===================== */
function countUp(el, to) { if (!el) return; const from = +el.textContent || 0; if (from === to) { el.textContent = to; return; } const t0 = performance.now();
  (function f(t) { const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e); if (k < 1) requestAnimationFrame(f); })(t0); }
async function loadStatus() {
  try {
    const s = await api.call("/status"); Q.server = s;
    $$("[data-sdot]").forEach(d => d.className = "dot " + (s.online ? "on" : "off"));
    $$("[data-stext]").forEach(t => t.textContent = s.online ? `Онлайн · ${s.players} из ${s.max}${s.demo ? " (демо)" : ""}` : "Сервер офлайн");
    $$("[data-online]").forEach(el => countUp(el, s.online ? s.players : 0));
    const names = (s.sample || []).slice(0, 5);
    $$("[data-players]").forEach(el => el.innerHTML = names.length ? `<div class="heads">${names.map(n => `<img src="${head(n, 32)}" alt="${esc(n)}" title="${esc(n)}" loading="lazy">`).join("")}</div><span>Сейчас играют${s.players > names.length ? ` и ещё ${s.players - names.length}` : ""}</span>` : "");
  } catch { $$("[data-stext]").forEach(t => t.textContent = "Статус недоступен"); }
}

/* ===================== фон: пиксельное поле ===================== */
(() => { const cv = $("#field"), ctx = cv.getContext("2d"); let W, H, dpr, cells = []; const S = 30; let mx = -999, my = -999;
  function rs() { dpr = Math.min(devicePixelRatio, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cells = []; for (let y = S / 2; y < H + S; y += S) for (let x = S / 2; x < W + S; x += S) cells.push({ x, y, r: Math.random(), tw: 0 }); }
  rs(); addEventListener("resize", rs);
  addEventListener("pointermove", e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  const pal = ["66,227,180", "33,160,56", "15,168,224", "200,232,58"];
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (const c of cells) {
      const wave = Math.max(0, Math.sin(c.x * .006 + c.y * .004 - t * .0006)) ** 8;
      const near = Math.max(0, 1 - Math.hypot(c.x - mx, c.y - my) / 170);
      if (c.tw <= 0 && Math.random() < .0004) c.tw = 1; if (c.tw > 0) c.tw -= .012;
      const k = Math.min(1, .05 + wave * .35 + near * .8 + Math.max(c.tw, 0) * .7), fade = 1 - Math.min(1, c.y / H) * .6, sz = 1.5 + k * 2.5;
      ctx.fillStyle = k > .08 ? `rgba(${pal[(c.r * 4) | 0]},${k * fade})` : `rgba(255,255,255,${.05 * fade})`;
      ctx.fillRect(c.x - sz / 2, c.y - sz / 2, sz, sz);
    }
    if (!RM) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

/* ===================== процедурная мини-карта мира (для баннеров) ===================== */
function mapCanvas(cv, seed = 7) {
  const rnd = (x, y) => { let h = (x * 374761393 + y * 668265263 + seed * 982451653) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const sm = t => t * t * (3 - 2 * t);
  const noise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    const a = rnd(xi, yi), b = rnd(xi + 1, yi), c = rnd(xi, yi + 1), d = rnd(xi + 1, yi + 1); return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf; };
  const fbm = (x, y) => { let v = 0, a = .5, f = 1; for (let i = 0; i < 5; i++) { v += a * noise(x * f, y * f); a *= .5; f *= 2; } return v; };
  const MW = 520, MH = 260, off = document.createElement("canvas"); off.width = MW; off.height = MH;
  const o = off.getContext("2d"), img = o.createImageData(MW, MH), H = new Float32Array(MW * MH);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) H[y * MW + x] = fbm(x / 70, y / 70);
  const col = (h, m) => h < .38 ? [34, 64, 122] : h < .44 ? [47, 95, 166] : h < .47 ? [74, 127, 196] : h < .49 ? [217, 200, 142]
    : h < .62 ? (m > .55 ? [62, 122, 44] : [94, 158, 58]) : h < .7 ? (m > .5 ? [47, 94, 34] : [110, 140, 70]) : h < .77 ? [127, 127, 120] : [236, 236, 236];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = y * MW + x, h = H[i], m = fbm(x / 40 + 99, y / 40 + 99);
    let [r, g, b] = col(h, m);
    if (h >= .47) { const sh = 1 + ((H[Math.max(0, i - MW - 1)] || h) - h) * 14; r *= sh; g *= sh; b *= sh; }
    if (h < .47 && (x + y) % 7 === 0) { r += 6; g += 6; b += 8; }
    img.data.set([r, g, b, 255], i * 4);
  }
  o.putImageData(img, 0, 0);
  o.strokeStyle = "rgba(255,255,255,.05)"; for (let x = 0; x < MW; x += 16) { o.beginPath(); o.moveTo(x + .5, 0); o.lineTo(x + .5, MH); o.stroke(); } for (let y = 0; y < MH; y += 16) { o.beginPath(); o.moveTo(0, y + .5); o.lineTo(MW, y + .5); o.stroke(); }
  const land = []; for (let i = 0; i < 400 && land.length < 6; i++) { const x = Math.random() * MW | 0, y = Math.random() * MH | 0; if (H[y * MW + x] > .5 && H[y * MW + x] < .68) land.push({ x, y }); }
  const names = ["Steve", "Alex", "Notch", "jeb_", "Dinnerbone", "Grumm"];
  const ps = land.map((p, i) => { const im = new Image(); im.crossOrigin = "anonymous"; im.src = head(names[i], 16); return { ...p, a: Math.random() * 6.28, im }; });
  const ctx = cv.getContext("2d");
  function frame(t) {
    const w = cv.clientWidth, h = cv.clientHeight, d = Math.min(devicePixelRatio, 2);
    if (cv.width !== w * d) { cv.width = w * d; cv.height = h * d; }
    const scale = Math.max(cv.width / (MW * .62), cv.height / (MH * .9));
    const ox = (Math.sin(t / 9000) * .5 + .5) * (MW - cv.width / scale), oy = (Math.cos(t / 11000) * .5 + .5) * (MH - cv.height / scale);
    ctx.imageSmoothingEnabled = false; ctx.setTransform(scale, 0, 0, scale, -ox * scale, -oy * scale); ctx.drawImage(off, 0, 0);
    for (const p of ps) {
      p.a += (Math.random() - .5) * .2; const nx = p.x + Math.cos(p.a) * .06, ny = p.y + Math.sin(p.a) * .06;
      if ((H[(ny | 0) * MW + (nx | 0)] || 0) > .48) { p.x = nx; p.y = ny; } else p.a += Math.PI;
      ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(p.x - 4.5, p.y - 4.5, 9, 9);
      if (p.im.complete && p.im.naturalWidth) ctx.drawImage(p.im, p.x - 4, p.y - 4, 8, 8); else { ctx.fillStyle = "#42E3B4"; ctx.fillRect(p.x - 3, p.y - 3, 6, 6); }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!RM) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
$$("canvas[data-worldmap]").forEach((c, i) => mapCanvas(c, 7 + i));

/* ===================== старт ===================== */
Q.api = api; Q.toast = toast; Q.openModal = openModal; Q.closeModal = closeModal; Q.openAuth = openAuth; Q.setUser = setUser;
Q.roleBadge = roleBadge; Q.adminStar = adminStar; Q.ROLE = ROLE; Q.statusOf = statusOf; Q.STATUS = STATUS; Q.trackHTML = trackHTML; Q.copyIp = copyIp; Q.linkDiscord = linkDiscord; Q.reveal = reveal; Q.spot = spot; Q.logout = logout;
Q.init = (async () => {
  await api.init(); loadStatus(); setInterval(loadStatus, 30000);
  try { setUser((await api.call("/me")).user); } catch { setUser(null); }
  Q.ready = true;
  const q = new URLSearchParams(location.search).get("discord");
  if (q) { history.replaceState(null, "", location.pathname + location.hash);
    const M = { ok: "Discord привязан — заявка ушла администрации", notin: "Вы ещё не на нашем Discord-сервере. Вступите и нажмите «Проверить снова»", taken: "Этот Discord уже привязан к другому аккаунту", err: "Не удалось привязать Discord, попробуйте ещё раз" };
    toast(M[q] || M.err); if (Q.me) setTimeout(openMenu, 300); }
})();
window.Q = Q;
