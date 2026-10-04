// QUADRANT — бэкенд сайта. Без зависимостей: node server.js
// Регистрация, сессии, Discord-верификация, вайтлист (файл или RCON), админ-панель.
const http = require("http"), fs = require("fs"), path = require("path"), net = require("net"), crypto = require("crypto");
const env = process.env;
const CFG = {
  port: +env.PORT || 3000,
  publicUrl: (env.PUBLIC_URL || `http://localhost:${+env.PORT || 3000}`).replace(/\/$/, ""),
  ip: env.SERVER_IP || "",
  mcHost: env.MC_HOST || "127.0.0.1", mcPort: +env.MC_PORT || 25565,
  rconHost: env.RCON_HOST || env.MC_HOST || "127.0.0.1", rconPort: +env.RCON_PORT || 25575, rconPass: env.RCON_PASSWORD || "",
  whitelistFile: env.WHITELIST_FILE || "",
  autoWhitelist: env.AUTO_WHITELIST === "1",        // сразу в вайтлист после проверки Discord
  adminToken: env.ADMIN_TOKEN || "",
  mapUrl: env.MAP_URL || "", mapEngine: env.MAP_ENGINE || "",
  statsDir: env.STATS_DIR || "",                    // папка world/stats сервера — для игровой статистики в профиле
  discord: { id: env.DISCORD_CLIENT_ID || "", secret: env.DISCORD_CLIENT_SECRET || "", guild: env.DISCORD_GUILD_ID || "", bot: env.DISCORD_BOT_TOKEN || "", invite: env.DISCORD_INVITE || "" },
  dataDir: path.join(__dirname, "data"),
};
const discordOn = () => !!(CFG.discord.id && CFG.discord.secret && CFG.discord.guild);

// ---------- хранилище ----------
fs.mkdirSync(CFG.dataDir, { recursive: true });
const load = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(CFG.dataDir, f), "utf8")); } catch { return d; } };
const store = (f, v) => { const p = path.join(CFG.dataDir, f); fs.writeFileSync(p + ".tmp", JSON.stringify(v, null, 2)); fs.renameSync(p + ".tmp", p); };
let users = load("users.json", {});
let state = load("state.json", { announcement: { enabled: false, text: "", type: "info" }, log: [] });
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
let products = load("products.json", DEFAULT_PRODUCTS);
let orders = load("orders.json", []);
const saveProducts = () => store("products.json", products), saveOrders = () => store("orders.json", orders);
const saveUsers = () => store("users.json", users), saveState = () => store("state.json", state);
function audit(who, action, target, details = "") { state.log.unshift({ t: new Date().toISOString(), who, action, target, details }); state.log = state.log.slice(0, 500); saveState(); }

const sessions = new Map(); const TTL = 30 * 864e5;
const oauthStates = new Map();
const hash = (pw, salt = crypto.randomBytes(16).toString("hex")) => salt + ":" + crypto.scryptSync(pw, salt, 64).toString("hex");
const verify = (pw, stored) => { const [salt, h] = stored.split(":"); return crypto.timingSafeEqual(Buffer.from(h, "hex"), crypto.scryptSync(pw, salt, 64)); };
const statusOf = u => u.banned ? "banned" : !(u.discord && u.discord.inGuild) ? "need_discord" : u.whitelisted ? "approved" : u.rejected ? "rejected" : "pending";
const pub = u => ({ nick: u.nick, email: u.email, created: u.created, whitelisted: !!u.whitelisted, rejected: !!u.rejected, banned: !!u.banned, banReason: u.banReason || "", bio: u.bio || "", cover: u.cover || 0, plus: !!(u.plusUntil && new Date(u.plusUntil) > new Date()), plusUntil: u.plusUntil || null, role: u.role || "player", discord: u.discord ? { username: u.discord.username, inGuild: !!u.discord.inGuild } : null });
const adminView = u => ({ ...pub(u), status: statusOf(u), role: u.role || "player", note: u.note || "", lastLogin: u.lastLogin || null, lastIp: u.lastIp || "", discord: u.discord || null });

const hits = new Map();
function limited(ip, max = 10) { const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 60000); a.push(now); hits.set(ip, a); return a.length > max; }

// ---------- RCON ----------
function rcon(cmd) {
  return new Promise((resolve, reject) => {
    if (!CFG.rconPass) return reject(new Error("RCON не настроен (RCON_PASSWORD)"));
    const s = net.connect(CFG.rconPort, CFG.rconHost); let buf = Buffer.alloc(0), authed = false;
    const pkt = (id, type, body) => { const b = Buffer.from(body, "utf8"), p = Buffer.alloc(14 + b.length); p.writeInt32LE(10 + b.length, 0); p.writeInt32LE(id, 4); p.writeInt32LE(type, 8); b.copy(p, 12); return p; };
    s.setTimeout(4000, () => { s.destroy(); reject(new Error("RCON: таймаут")); });
    s.on("error", e => reject(new Error("RCON: " + e.message)));
    s.on("connect", () => s.write(pkt(1, 3, CFG.rconPass)));
    s.on("data", d => {
      buf = Buffer.concat([buf, d]);
      while (buf.length >= 4) {
        const len = buf.readInt32LE(0); if (buf.length < len + 4) break;
        const id = buf.readInt32LE(4), body = buf.slice(12, len + 2).toString("utf8"); buf = buf.slice(len + 4);
        if (!authed) { if (id === -1) { s.destroy(); return reject(new Error("RCON: неверный пароль")); } authed = true; s.write(pkt(2, 2, cmd)); }
        else { s.end(); return resolve(body.replace(/§./g, "")); }
      }
    });
  });
}

// ---------- вайтлист ----------
async function mojangUUID(nick) {
  try { const r = await fetch("https://api.mojang.com/users/profiles/minecraft/" + encodeURIComponent(nick)); if (r.ok) return (await r.json()).id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5"); } catch {}
  return null;
}
async function whitelist(nick, add) {
  if (CFG.rconPass) { await rcon(`whitelist ${add ? "add" : "remove"} ${nick}`); return true; }
  if (!CFG.whitelistFile) return false;
  let list = []; try { list = JSON.parse(fs.readFileSync(CFG.whitelistFile, "utf8")); } catch {}
  list = list.filter(e => e.name.toLowerCase() !== nick.toLowerCase());
  if (add) { const uuid = await mojangUUID(nick); if (uuid) list.push({ uuid, name: nick }); }
  fs.writeFileSync(CFG.whitelistFile, JSON.stringify(list, null, 2));
  return true; // без RCON выполните в консоли сервера: whitelist reload
}

// ---------- игровая статистика (ванильные файлы world/stats/<uuid>.json) ----------
async function playerStats(u) {
  if (!CFG.statsDir) return null;
  if (!u.uuid) { u.uuid = await mojangUUID(u.nick); if (u.uuid) saveUsers(); }
  if (!u.uuid) return null;
  const f = path.join(CFG.statsDir, u.uuid + ".json");
  let j; try { j = JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; }
  const c = (j.stats || {})["minecraft:custom"] || {}, k = (j.stats || {})["minecraft:killed"] || {};
  const ticks = c["minecraft:play_time"] || c["minecraft:play_one_minute"] || 0;
  const cm = ["walk_one_cm", "sprint_one_cm", "swim_one_cm", "fly_one_cm", "boat_one_cm", "horse_one_cm", "minecart_one_cm", "aviate_one_cm", "crouch_one_cm"].reduce((a, x) => a + (c["minecraft:" + x] || 0), 0);
  const h = Math.floor(ticks / 72000), m = Math.floor(ticks % 72000 / 1200);
  return { playTime: h ? `${h} ч ${m} мин` : `${m} мин`, deaths: c["minecraft:deaths"] || 0, mobKills: Object.values(k).reduce((a, b) => a + b, 0), distance: (cm / 100000).toFixed(1) + " км", lastSeen: fs.statSync(f).mtime.toISOString() };
}

// ---------- статус сервера (Server List Ping) ----------
const varint = n => { const b = []; do { let x = n & 0x7f; n >>>= 7; if (n) x |= 0x80; b.push(x); } while (n); return Buffer.from(b); };
const packet = (...p) => { const body = Buffer.concat(p); return Buffer.concat([varint(body.length), body]); };
function readVarint(buf, off) { let n = 0, s = 0, b; do { if (off >= buf.length) return null; b = buf[off++]; n |= (b & 0x7f) << s; s += 7; } while (b & 0x80); return [n, off]; }
let statusCache = { t: 0, v: null };
function pingMC() {
  return new Promise(resolve => {
    const sock = net.connect(CFG.mcPort, CFG.mcHost); let buf = Buffer.alloc(0);
    const done = v => { sock.destroy(); resolve(v); };
    sock.setTimeout(3000, () => done({ online: false })); sock.on("error", () => done({ online: false }));
    sock.on("connect", () => { const host = Buffer.from(CFG.mcHost), port = Buffer.alloc(2); port.writeUInt16BE(CFG.mcPort);
      sock.write(packet(varint(0), varint(767), varint(host.length), host, port, varint(1))); sock.write(packet(varint(0))); });
    sock.on("data", d => { buf = Buffer.concat([buf, d]); const len = readVarint(buf, 0); if (!len || buf.length < len[1] + len[0]) return;
      const id = readVarint(buf, len[1]), sl = readVarint(buf, id[1]);
      try { const j = JSON.parse(buf.slice(sl[1], sl[1] + sl[0]).toString("utf8"));
        done({ online: true, players: j.players.online, max: j.players.max, version: j.version.name, sample: (j.players.sample || []).map(p => p.name).filter(n => /^[A-Za-z0-9_]{3,16}$/.test(n)) }); }
      catch { done({ online: false }); } });
  });
}
async function serverStatus() { if (Date.now() - statusCache.t > 30000) statusCache = { t: Date.now(), v: await pingMC() }; return statusCache.v; }

// ---------- Discord ----------
async function discordCallback(code, nickKey) {
  const u = users[nickKey]; if (!u) return "err";
  const tr = await fetch("https://discord.com/api/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CFG.discord.id, client_secret: CFG.discord.secret, grant_type: "authorization_code", code, redirect_uri: CFG.publicUrl + "/api/discord/callback" }) });
  if (!tr.ok) return "err";
  const tok = await tr.json(), auth = { Authorization: "Bearer " + tok.access_token };
  const me = await (await fetch("https://discord.com/api/users/@me", { headers: auth })).json();
  if (!me.id) return "err";
  if (Object.entries(users).some(([k, x]) => k !== nickKey && x.discord && x.discord.id === me.id)) return "taken";
  let inGuild = false;
  if (CFG.discord.bot) { // бот сам добавит игрока на сервер (scope guilds.join)
    const r = await fetch(`https://discord.com/api/guilds/${CFG.discord.guild}/members/${me.id}`, { method: "PUT", headers: { Authorization: "Bot " + CFG.discord.bot, "Content-Type": "application/json" }, body: JSON.stringify({ access_token: tok.access_token }) });
    inGuild = r.status === 201 || r.status === 204;
  }
  if (!inGuild) { const g = await (await fetch("https://discord.com/api/users/@me/guilds", { headers: auth })).json(); inGuild = Array.isArray(g) && g.some(x => x.id === CFG.discord.guild); }
  u.discord = { id: me.id, username: me.global_name ? `${me.username}` : me.username, inGuild, linkedAt: new Date().toISOString() };
  if (inGuild && CFG.autoWhitelist && !u.banned && !u.rejected) { try { if (await whitelist(u.nick, true)) u.whitelisted = true; } catch {} }
  saveUsers(); audit(u.nick, "discord_link", u.nick, `@${u.discord.username} ${inGuild ? "на сервере" : "не на сервере"}`);
  return inGuild ? "ok" : "notin";
}

// ---------- HTTP ----------
const send = (res, code, obj, h = {}) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", ...h }); res.end(JSON.stringify(obj)); };
const redirect = (res, to, h = {}) => { res.writeHead(302, { Location: to, ...h }); res.end(); };
const tokenOf = req => (req.headers.cookie || "").split(/;\s*/).map(c => c.split("=")).find(([k]) => k === "sid")?.[1];
const sessionKey = req => { const s = sessions.get(tokenOf(req)); return s && s.exp > Date.now() && users[s.nick] ? s.nick : null; };
const readBody = req => new Promise(r => { let d = ""; req.on("data", c => { d += c; if (d.length > 2e4) req.destroy(); }); req.on("end", () => { try { r(JSON.parse(d || "{}")); } catch { r({}); } }); });
const cookie = t => `sid=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${TTL / 1000}${CFG.publicUrl.startsWith("https") ? "; Secure" : ""}`;
function startSession(key) { const t = crypto.randomBytes(32).toString("hex"); sessions.set(t, { nick: key, exp: Date.now() + TTL }); return cookie(t); }
const page = (res, f) => { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "X-Frame-Options": "DENY" }); fs.createReadStream(path.join(__dirname, f)).pipe(res); };
const PUB = path.join(__dirname, "public");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".webp": "image/webp", ".jpg": "image/jpeg" };
function serveStatic(res, p) {
  let rel = decodeURIComponent(p === "/" ? "/index.html" : p);
  if (!path.extname(rel)) rel += ".html";                       // /shop -> shop.html
  const file = path.normalize(path.join(PUB, rel));
  if (!file.startsWith(PUB) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
  const ext = path.extname(file);
  res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream", "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600", "X-Content-Type-Options": "nosniff" });
  fs.createReadStream(file).pipe(res); return true;
}
const isAdmin = req => { const t = String(req.headers["x-admin-token"] || ""); return CFG.adminToken && t.length === CFG.adminToken.length && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(CFG.adminToken)); };

async function adminApi(req, res, p, ip) {
  if (!isAdmin(req)) { limited(ip, 5); return send(res, 401, { error: "Неверный токен" }); }
  if (p === "overview") {
    const list = Object.values(users), counts = {}, revenue = orders.filter(o => o.status === "done" || o.status === "paid").reduce((a, o) => a + o.price, 0); list.forEach(u => { const s = statusOf(u); counts[s] = (counts[s] || 0) + 1; });
    const days = [...Array(14)].map((_, i) => { const d = new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10); return { d, n: list.filter(u => u.created.slice(0, 10) === d).length }; });
    return send(res, 200, { total: list.length, counts, days, revenue, newOrders: orders.filter(o => o.status === "awaiting_payment" || o.status === "paid").length, server: await serverStatus(), rcon: !!CFG.rconPass, discord: discordOn(), autoWhitelist: CFG.autoWhitelist, recent: state.log.slice(0, 6) });
  }
  if (p === "users") return send(res, 200, { users: Object.values(users).map(adminView).sort((a, b) => b.created.localeCompare(a.created)) });
  if (p === "log") return send(res, 200, { log: state.log });
  if (p === "orders") return send(res, 200, { orders });
  if (p === "products" && req.method === "GET") return send(res, 200, { products });
  if (p === "announcement" && req.method === "GET") return send(res, 200, state.announcement);
  const b = await readBody(req);
  if (p === "announcement") { state.announcement = { enabled: !!b.enabled, text: String(b.text || "").slice(0, 300), type: b.type === "warn" ? "warn" : "info" }; audit("admin", "announcement", "-", state.announcement.enabled ? state.announcement.text : "выключено"); return send(res, 200, state.announcement); }
  if (p === "order") { const o = orders.find(x => x.id === b.id); if (!o) return send(res, 404, { error: "Заказ не найден" });
    if (!["awaiting_payment", "paid", "done", "cancelled"].includes(b.status)) return send(res, 400, { error: "Неверный статус" });
    o.status = b.status; o.updated = new Date().toISOString();
    if (b.status === "done" && /^plus(\d)$/.test(o.product)) { const u = users[o.nick.toLowerCase()]; if (u) { const months = +o.product.slice(4), base = u.plusUntil && new Date(u.plusUntil) > new Date() ? new Date(u.plusUntil) : new Date(); base.setMonth(base.getMonth() + months); u.plusUntil = base.toISOString(); saveUsers(); } }
    saveOrders(); audit("admin", "order_status", o.nick, `${o.id} → ${b.status}`); return send(res, 200, { order: o }); }
  if (p === "products") { if (!Array.isArray(b.products)) return send(res, 400, { error: "Нужен список товаров" });
    products = b.products.map(x => ({ id: String(x.id || crypto.randomBytes(3).toString("hex")).replace(/[^\w-]/g, "").slice(0, 32), cat: String(x.cat || "Прочее").slice(0, 40), title: String(x.title || "Товар").slice(0, 60), desc: String(x.desc || "").slice(0, 200),
      price: Math.max(0, Math.round(+x.price || 0)), old: +x.old > 0 ? Math.round(+x.old) : undefined, badge: x.badge ? String(x.badge).slice(0, 20) : undefined, skin: String(x.skin || "Steve").replace(/[^\w]/g, "").slice(0, 16), color: /^#[0-9a-f]{6}$/i.test(x.color) ? x.color : "#21A038", hidden: !!x.hidden }));
    saveProducts(); audit("admin", "products", "-", `${products.length} товаров`); return send(res, 200, { products }); }
  if (p === "rcon") { const c = String(b.command || "").replace(/^\//, "").trim(); if (!c) return send(res, 400, { error: "Пустая команда" });
    try { const out = await rcon(c); audit("admin", "rcon", "-", c); return send(res, 200, { output: out || "(пустой ответ)" }); } catch (e) { return send(res, 502, { error: e.message }); } }
  if (p === "update") { const u = users[String(b.nick || "").toLowerCase()]; if (!u) return send(res, 404, { error: "Игрок не найден" });
    if (b.role !== undefined) u.role = ["player", "helper", "moderator", "admin"].includes(b.role) ? b.role : "player";
    if (b.note !== undefined) u.note = String(b.note).slice(0, 1000);
    saveUsers(); audit("admin", "update", u.nick, `роль: ${u.role || "player"}`); return send(res, 200, { user: adminView(u) }); }
  if (p === "action") {
    const nicks = (Array.isArray(b.nicks) ? b.nicks : [b.nick]).map(n => String(n || "").toLowerCase()).filter(n => users[n]);
    const errors = [];
    for (const k of nicks) {
      const u = users[k];
      try {
        switch (b.action) {
          case "approve": await whitelist(u.nick, true); u.whitelisted = true; u.rejected = false; break;
          case "reject": if (u.whitelisted) await whitelist(u.nick, false); u.whitelisted = false; u.rejected = true; break;
          case "unwhitelist": await whitelist(u.nick, false); u.whitelisted = false; break;
          case "ban": u.banned = true; u.banReason = String(b.reason || "").slice(0, 200); u.whitelisted = false;
            if (CFG.rconPass) await rcon(`ban ${u.nick} ${u.banReason || "Нарушение правил"}`); await whitelist(u.nick, false).catch(() => {});
            for (const [t, s] of sessions) if (s.nick === k) sessions.delete(t); break;
          case "unban": u.banned = false; u.banReason = ""; if (CFG.rconPass) await rcon(`pardon ${u.nick}`); break;
          case "discord_ok": u.discord = { ...(u.discord || {}), inGuild: true, manual: true }; break;
          case "discord_reset": u.discord = null; break;
          case "kick": await rcon(`kick ${u.nick} ${b.reason || ""}`.trim()); break;
          case "reset_password": { const pw = crypto.randomBytes(6).toString("base64url"); u.hash = hash(pw); for (const [t, s] of sessions) if (s.nick === k) sessions.delete(t); audit("admin", b.action, u.nick); saveUsers(); return send(res, 200, { ok: true, password: pw }); }
          case "delete": await whitelist(u.nick, false).catch(() => {}); delete users[k]; for (const [t, s] of sessions) if (s.nick === k) sessions.delete(t); break;
          default: return send(res, 400, { error: "Неизвестное действие" });
        }
        audit("admin", b.action, u.nick, b.reason || "");
      } catch (e) { errors.push(`${u.nick}: ${e.message}`); }
    }
    saveUsers(); return send(res, errors.length ? 207 : 200, { ok: !errors.length, errors });
  }
  send(res, 404, { error: "Not found" });
}

const app = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x"), p = url.pathname, ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress;
  try {
    if (p === "/admin") return page(res, "admin.html");
    if (!p.startsWith("/api/") && req.method === "GET") { if (serveStatic(res, p)) return; res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" }); return res.end('<meta charset="utf-8"><body style="background:#060B08;color:#fff;font-family:sans-serif;display:grid;place-items:center;height:100vh"><div style="text-align:center"><h1>404</h1><p>Страница не найдена · <a style="color:#42E3B4" href="/">На главную</a></p></div>'); }
    if (p.startsWith("/api/admin/")) return await adminApi(req, res, p.slice(11), ip);
    if (p === "/api/config") return send(res, 200, { discordEnabled: discordOn(), discordInvite: CFG.discord.invite, ip: CFG.ip, mapUrl: CFG.mapUrl, mapEngine: CFG.mapEngine, announcement: state.announcement });
    if (p === "/api/shop") return send(res, 200, { products: products.filter(x => !x.hidden) });
    if (p === "/api/stats") { const k = sessionKey(req); if (!k) return send(res, 401, { error: "Не авторизован" }); return send(res, 200, { stats: await playerStats(users[k]).catch(() => null) }); }
    if (p === "/api/orders") { const k = sessionKey(req); if (!k) return send(res, 401, { error: "Не авторизован" }); return send(res, 200, { orders: orders.filter(o => o.nick.toLowerCase() === k) }); }
    if (p === "/api/status") return send(res, 200, await serverStatus());
    if (p === "/api/me") { const k = sessionKey(req); return k ? send(res, 200, { user: pub(users[k]) }) : send(res, 401, { error: "Не авторизован" }); }
    if (p === "/api/discord/login") {
      const k = sessionKey(req); if (!k || !discordOn()) return redirect(res, "/?discord=err");
      const st = crypto.randomBytes(16).toString("hex"); oauthStates.set(st, { k, exp: Date.now() + 6e5 });
      const scope = CFG.discord.bot ? "identify guilds guilds.join" : "identify guilds";
      return redirect(res, "https://discord.com/oauth2/authorize?" + new URLSearchParams({ client_id: CFG.discord.id, redirect_uri: CFG.publicUrl + "/api/discord/callback", response_type: "code", scope, state: st, prompt: "none" }));
    }
    if (p === "/api/discord/callback") {
      const st = oauthStates.get(url.searchParams.get("state")); oauthStates.delete(url.searchParams.get("state"));
      if (!st || st.exp < Date.now() || !url.searchParams.get("code")) return redirect(res, "/?discord=err");
      return redirect(res, "/?discord=" + await discordCallback(url.searchParams.get("code"), st.k).catch(() => "err"));
    }
    if (req.method !== "POST") return send(res, 404, { error: "Not found" });
    const b = await readBody(req);
    if (p === "/api/register") {
      if (limited(ip)) return send(res, 429, { error: "Слишком много попыток, подождите минуту" });
      const nick = String(b.nick || "").trim(), email = String(b.email || "").trim().toLowerCase(), pw = String(b.password || "");
      if (!/^[A-Za-z0-9_]{3,16}$/.test(nick)) return send(res, 400, { error: "Некорректный ник" });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: "Некорректный email" });
      if (pw.length < 8) return send(res, 400, { error: "Пароль слишком короткий" });
      const k = nick.toLowerCase();
      if (users[k]) return send(res, 409, { error: "Этот ник уже зарегистрирован" });
      if (Object.values(users).some(u => u.email === email)) return send(res, 409, { error: "Email уже используется" });
      users[k] = { nick, email, hash: hash(pw), created: new Date().toISOString(), whitelisted: false, discord: null, role: "player", lastLogin: new Date().toISOString(), lastIp: ip };
      saveUsers(); audit(nick, "register", nick);
      return send(res, 201, { user: pub(users[k]) }, { "Set-Cookie": startSession(k) });
    }
    if (p === "/api/login") {
      if (limited(ip)) return send(res, 429, { error: "Слишком много попыток, подождите минуту" });
      const login = String(b.login || "").trim().toLowerCase();
      const k = users[login] ? login : Object.keys(users).find(x => users[x].email === login);
      if (!k || !verify(String(b.password || ""), users[k].hash)) return send(res, 401, { error: "Неверный ник или пароль" });
      if (users[k].banned) return send(res, 403, { error: "Аккаунт заблокирован" + (users[k].banReason ? ": " + users[k].banReason : "") });
      users[k].lastLogin = new Date().toISOString(); users[k].lastIp = ip; saveUsers();
      return send(res, 200, { user: pub(users[k]) }, { "Set-Cookie": startSession(k) });
    }
    // ----- личный кабинет -----
    const me = sessionKey(req), U = me && users[me];
    const needAuth = () => send(res, 401, { error: "Войдите в аккаунт" });
    const checkPw = pw => verify(String(pw || ""), U.hash);
    if (p === "/api/profile") { if (!U) return needAuth(); U.bio = String(b.bio || "").replace(/\s+/g, " ").trim().slice(0, 160); U.cover = Math.max(0, Math.min(5, +b.cover || 0)); saveUsers(); return send(res, 200, { user: pub(U) }); }
    if (p === "/api/password") { if (!U) return needAuth(); if (limited(ip)) return send(res, 429, { error: "Слишком много попыток" });
      if (!checkPw(b.current)) return send(res, 400, { error: "Текущий пароль неверный" }); if (String(b.next || "").length < 8) return send(res, 400, { error: "Новый пароль короче 8 символов" });
      U.hash = hash(String(b.next)); const cur = tokenOf(req); for (const [t, x] of sessions) if (x.nick === me && t !== cur) sessions.delete(t); saveUsers(); audit(U.nick, "password", U.nick); return send(res, 200, { ok: true }); }
    if (p === "/api/email") { if (!U) return needAuth(); if (limited(ip)) return send(res, 429, { error: "Слишком много попыток" });
      const email = String(b.email || "").trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: "Некорректный email" });
      if (!checkPw(b.password)) return send(res, 400, { error: "Пароль неверный" }); if (Object.entries(users).some(([k, x]) => k !== me && x.email === email)) return send(res, 409, { error: "Email уже используется" });
      U.email = email; saveUsers(); return send(res, 200, { user: pub(U) }); }
    if (p === "/api/discord/unlink") { if (!U) return needAuth(); if (U.whitelisted) await whitelist(U.nick, false).catch(() => {}); U.discord = null; U.whitelisted = false; saveUsers(); audit(U.nick, "discord_unlink", U.nick); return send(res, 200, { user: pub(U) }); }
    if (p === "/api/logout-all") { if (!U) return needAuth(); for (const [t, x] of sessions) if (x.nick === me) sessions.delete(t); return send(res, 200, { ok: true }, { "Set-Cookie": "sid=; Path=/; Max-Age=0" }); }
    if (p === "/api/delete-account") { if (!U) return needAuth(); if (!checkPw(b.password)) return send(res, 400, { error: "Пароль неверный" });
      await whitelist(U.nick, false).catch(() => {}); audit(U.nick, "self_delete", U.nick); delete users[me]; for (const [t, x] of sessions) if (x.nick === me) sessions.delete(t); saveUsers();
      return send(res, 200, { ok: true }, { "Set-Cookie": "sid=; Path=/; Max-Age=0" }); }
    if (p === "/api/order") { if (!U) return needAuth(); if (limited(ip, 20)) return send(res, 429, { error: "Слишком много запросов" });
      const pr = products.find(x => x.id === b.product && !x.hidden); if (!pr) return send(res, 404, { error: "Товар не найден" });
      const o = { id: "Q" + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString("hex").toUpperCase(), nick: U.nick, product: pr.id, title: pr.title, price: pr.price, method: b.method === "sbp" ? "sbp" : "card", status: "awaiting_payment", created: new Date().toISOString() };
      orders.unshift(o); saveOrders(); audit(U.nick, "order", U.nick, `${o.id} · ${pr.title} · ${pr.price} ₽`);
      // Подключите платёжку (ЮKassa, CloudPayments и т.п.): создайте платёж здесь и верните { order: o, payUrl }
      return send(res, 201, { order: o }); }
    if (p === "/api/logout") { sessions.delete(tokenOf(req)); return send(res, 200, { ok: true }, { "Set-Cookie": "sid=; Path=/; Max-Age=0" }); }
    send(res, 404, { error: "Not found" });
  } catch (e) { console.error(e); send(res, 500, { error: "Внутренняя ошибка" }); }
});
app.listen(CFG.port, () => console.log(`QUADRANT: ${CFG.publicUrl}  ·  админка: ${CFG.publicUrl}/admin${CFG.adminToken ? "" : "  (задайте ADMIN_TOKEN!)"}`));
