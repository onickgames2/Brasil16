// Chat entre amigos (Brasil16). Precisa do auth.js carregado antes (usa `sb` e `Auth`)
// e da tabela `messages` (veja chat.sql).
(function () {
  "use strict";

  var me = null;          // uuid do usuário logado
  var friends = [];       // [{ id, name }]
  var unread = {};        // { uuidAmigo: quantidade }
  var current = null;     // amigo com a conversa aberta
  var msgs = [];
  var panelOpen = false;
  var stick = true;       // manter rolagem no fim
  var busy = false;
  var warned = false;
  var ui = {};

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function hora(iso) {
    try {
      var d = new Date(iso);
      var h = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      if (d.toDateString() === new Date().toDateString()) return h;
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " + h;
    } catch (e) { return ""; }
  }

  // ---------- estilo ----------
  function injetarCSS() {
    var css = [
      ".b16chat-bar{position:fixed;bottom:0;right:12px;width:200px;height:32px;line-height:32px;padding:0 12px;box-sizing:border-box;background:#00a2ff;color:#fff;font:600 14px 'Source Sans Pro',Arial,sans-serif;border-radius:4px 4px 0 0;cursor:pointer;z-index:9999;display:flex;justify-content:space-between;align-items:center;user-select:none}",
      ".b16chat-badge{background:#d33;color:#fff;border-radius:10px;font-size:12px;line-height:18px;min-width:18px;padding:0 5px;text-align:center}",
      ".b16chat-panel{position:fixed;bottom:32px;right:12px;width:300px;height:380px;background:#fff;border:1px solid #b8b8b8;box-shadow:0 0 8px rgba(0,0,0,.25);z-index:9999;display:none;flex-direction:column;font-family:'Source Sans Pro',Arial,sans-serif;font-size:14px;color:#333}",
      ".b16chat-head{display:flex;align-items:center;gap:8px;background:#f2f2f2;border-bottom:1px solid #ddd;padding:0 10px;height:36px;flex:0 0 36px}",
      ".b16chat-title{flex:1;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".b16chat-btn{cursor:pointer;font-size:20px;line-height:1;color:#777;padding:0 4px}",
      ".b16chat-btn:hover{color:#000}",
      ".b16chat-list{flex:1;overflow-y:auto}",
      ".b16chat-empty{padding:14px;color:#777}",
      ".b16chat-friend{display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;border-bottom:1px solid #f0f0f0}",
      ".b16chat-friend:hover{background:#f5f9fc}",
      ".b16chat-av{width:32px;height:32px;border-radius:4px;background:#e1e1e1;color:#555;font-weight:700;display:flex;align-items:center;justify-content:center;flex:0 0 32px}",
      ".b16chat-fname{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".b16chat-conv{flex:1;min-height:0;display:none;flex-direction:column}",
      ".b16chat-msgs{flex:1;overflow-y:auto;padding:8px 10px;display:flex;flex-direction:column;gap:6px}",
      ".b16chat-msg{max-width:80%;padding:6px 9px;border-radius:8px;background:#e9e9e9;align-self:flex-start;word-wrap:break-word;overflow-wrap:anywhere;white-space:pre-wrap}",
      ".b16chat-msg.mine{background:#00a2ff;color:#fff;align-self:flex-end}",
      ".b16chat-time{display:block;font-size:11px;opacity:.7;margin-top:2px}",
      ".b16chat-status{padding:0 10px;min-height:16px;font-size:12px;color:#a33}",
      ".b16chat-form{display:flex;gap:6px;padding:8px;border-top:1px solid #ddd}",
      ".b16chat-input{flex:1;min-width:0;border:1px solid #bbb;border-radius:4px;padding:6px 8px;font-size:14px}",
      ".b16chat-send{border:0;background:#00a2ff;color:#fff;border-radius:4px;padding:0 12px;font-weight:600;cursor:pointer}",
      ".b16chat-send:disabled{opacity:.6;cursor:default}",
      "@media (max-width:767px){",
      ".b16chat-bar{right:0;left:0;width:auto;border-radius:0}",
      ".b16chat-panel{right:0;left:0;width:auto;height:70vh}",
      ".b16chat-input{font-size:16px}",
      "}"
    ].join("\n");
    var s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ---------- montagem ----------
  function montar() {
    injetarCSS();

    var bar = el("div", "b16chat-bar");
    bar.appendChild(el("span", "", "Chat"));
    ui.badge = el("span", "b16chat-badge", "0");
    ui.badge.style.display = "none";
    bar.appendChild(ui.badge);
    bar.addEventListener("click", function () { alternarPainel(!panelOpen); });

    var panel = el("div", "b16chat-panel");
    ui.panel = panel;

    var head = el("div", "b16chat-head");
    ui.back = el("span", "b16chat-btn", "\u2039");
    ui.back.title = "Voltar";
    ui.back.style.display = "none";
    ui.back.addEventListener("click", mostrarLista);
    ui.title = el("span", "b16chat-title", "Chat");
    var fechar = el("span", "b16chat-btn", "\u00d7");
    fechar.title = "Fechar";
    fechar.addEventListener("click", function () { alternarPainel(false); });
    head.appendChild(ui.back);
    head.appendChild(ui.title);
    head.appendChild(fechar);

    ui.list = el("div", "b16chat-list");

    ui.conv = el("div", "b16chat-conv");
    ui.msgs = el("div", "b16chat-msgs");
    ui.status = el("div", "b16chat-status");
    var form = el("form", "b16chat-form");
    form.autocomplete = "off";
    ui.input = el("input", "b16chat-input");
    ui.input.type = "text";
    ui.input.maxLength = 500;
    ui.input.placeholder = "Escreva uma mensagem...";
    ui.send = el("button", "b16chat-send", "Enviar");
    ui.send.type = "submit";
    form.appendChild(ui.input);
    form.appendChild(ui.send);
    form.addEventListener("submit", function (e) { e.preventDefault(); enviar(); });
    ui.conv.appendChild(ui.msgs);
    ui.conv.appendChild(ui.status);
    ui.conv.appendChild(form);

    panel.appendChild(head);
    panel.appendChild(ui.list);
    panel.appendChild(ui.conv);

    document.body.appendChild(panel);
    document.body.appendChild(bar);
  }

  // ---------- dados ----------
  async function carregarAmigos() {
    var r = await sb.from("friends")
      .select("friend:profiles!friends_friend_id_fkey(id, username)")
      .eq("user_id", me);
    if (r.error) { console.error("Chat: erro ao listar amigos", r.error); return; }
    friends = (r.data || [])
      .filter(function (x) { return x.friend; })
      .map(function (x) { return { id: x.friend.id, name: x.friend.username }; })
      .sort(function (a, b) { return a.name.localeCompare(b.name); });
    if (current && !friends.some(function (f) { return f.id === current.id; })) mostrarLista();
  }

  async function carregarNaoLidas() {
    var r = await sb.from("messages").select("from_id")
      .eq("to_id", me).is("read_at", null).limit(500);
    if (r.error) {
      if (!warned) { console.error("Chat: erro ao ler mensagens (a tabela messages existe? rode o chat.sql)", r.error); warned = true; }
      unread = {};
      return;
    }
    var u = {};
    (r.data || []).forEach(function (m) { u[m.from_id] = (u[m.from_id] || 0) + 1; });
    if (current) u[current.id] = 0;
    unread = u;
  }

  async function carregarMensagens() {
    if (!current) return;
    var f = current;
    var r = await sb.from("messages")
      .select("id, from_id, content, created_at, read_at")
      .or("and(from_id.eq." + me + ",to_id.eq." + f.id + "),and(from_id.eq." + f.id + ",to_id.eq." + me + ")")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!current || current.id !== f.id) return; // trocou de conversa no meio
    if (r.error) {
      console.error("Chat: erro ao carregar mensagens", r.error);
      status("Não foi possível carregar as mensagens.");
      return;
    }
    status("");
    var lista = (r.data || []).slice().reverse();
    var ultimoNovo = lista.length ? lista[lista.length - 1].id : 0;
    var ultimoAntigo = msgs.length ? msgs[msgs.length - 1].id : 0;
    var mudou = lista.length !== msgs.length || ultimoNovo !== ultimoAntigo;
    msgs = lista;
    if (mudou) desenharMensagens();
    if (lista.some(function (m) { return m.from_id === f.id && !m.read_at; })) marcarLidas(f);
  }

  async function marcarLidas(f) {
    var r = await sb.rpc("mark_messages_read", { other: f.id });
    if (r.error) console.error("Chat: erro ao marcar como lida", r.error);
    unread[f.id] = 0;
    desenharBadge();
  }

  async function enviar() {
    if (!current || busy) return;
    var txt = ui.input.value.trim();
    if (!txt) return;
    busy = true;
    ui.send.disabled = true;
    var r = await sb.from("messages").insert({ from_id: me, to_id: current.id, content: txt });
    busy = false;
    ui.send.disabled = false;
    if (r.error) {
      console.error("Chat: erro ao enviar", r.error);
      status(r.error.code === "42501" ? "Você só pode enviar mensagens para amigos." : "Erro ao enviar a mensagem.");
      return;
    }
    ui.input.value = "";
    status("");
    stick = true;
    await carregarMensagens();
    ui.input.focus();
  }

  // ---------- desenho ----------
  function status(t) { ui.status.textContent = t || ""; }

  function desenharBadge() {
    var total = 0;
    Object.keys(unread).forEach(function (k) { total += unread[k] || 0; });
    ui.badge.textContent = total > 99 ? "99+" : String(total);
    ui.badge.style.display = total ? "" : "none";
  }

  function desenharLista() {
    ui.list.innerHTML = "";
    if (!friends.length) {
      ui.list.appendChild(el("div", "b16chat-empty", "Você ainda não tem amigos. Adicione alguém para conversar."));
      return;
    }
    friends.forEach(function (f) {
      var row = el("div", "b16chat-friend");
      row.appendChild(el("span", "b16chat-av", f.name.charAt(0).toUpperCase()));
      row.appendChild(el("span", "b16chat-fname", f.name));
      var n = unread[f.id] || 0;
      if (n) row.appendChild(el("span", "b16chat-badge", String(n)));
      row.addEventListener("click", function () { abrirConversa(f); });
      ui.list.appendChild(row);
    });
  }

  function desenharMensagens() {
    var m = ui.msgs;
    var perto = stick || (m.scrollHeight - m.scrollTop - m.clientHeight < 60);
    m.innerHTML = "";
    if (!msgs.length) {
      m.appendChild(el("div", "b16chat-empty", "Nenhuma mensagem ainda. Diga oi!"));
    }
    msgs.forEach(function (x) {
      var b = el("div", "b16chat-msg" + (x.from_id === me ? " mine" : ""));
      b.appendChild(document.createTextNode(x.content));
      b.appendChild(el("span", "b16chat-time", hora(x.created_at)));
      m.appendChild(b);
    });
    if (perto) m.scrollTop = m.scrollHeight;
    stick = false;
  }

  // ---------- navegação ----------
  function mostrarLista() {
    current = null;
    msgs = [];
    ui.conv.style.display = "none";
    ui.list.style.display = "";
    ui.back.style.display = "none";
    ui.title.textContent = "Chat";
    desenharLista();
    desenharBadge();
  }

  function abrirConversa(f) {
    current = f;
    msgs = [];
    stick = true;
    unread[f.id] = 0;
    ui.list.style.display = "none";
    ui.conv.style.display = "flex";
    ui.back.style.display = "";
    ui.title.textContent = f.name;
    ui.msgs.innerHTML = "";
    status("Carregando...");
    desenharBadge();
    carregarMensagens();
    setTimeout(function () { ui.input.focus(); }, 50);
  }

  async function atualizarTudo() {
    await carregarAmigos();
    await carregarNaoLidas();
    desenharBadge();
    if (panelOpen && !current) desenharLista();
  }

  function alternarPainel(abrir) {
    panelOpen = abrir;
    ui.panel.style.display = abrir ? "flex" : "none";
    if (abrir) {
      if (!current) desenharLista();
      atualizarTudo();
    }
  }

  // ---------- início ----------
  async function iniciar() {
    await Auth.ready;
    if (!Auth._profile) return; // sem login, sem chat
    me = Auth._profile.id;

    montar();
    await atualizarTudo();

    // conversa aberta: atualiza a cada 4s
    setInterval(function () {
      if (document.hidden || !panelOpen || !current) return;
      carregarMensagens();
    }, 4000);

    // lista de amigos e contador de não lidas: a cada 15s
    setInterval(function () {
      if (document.hidden) return;
      atualizarTudo();
    }, 15000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
