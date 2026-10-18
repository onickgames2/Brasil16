// Presença dos amigos (Brasil16): cinza = offline, azul = online, verde = jogando.
// Precisa do auth.js carregado antes (usa `sb` e `Auth`) e do presence.sql rodado no Supabase.
//
// Para marcar "jogando", a página do jogo faz: Presence.setPlaying(true)
// (ou define window.B16_PLAYING = true antes de carregar este arquivo).
(function () {
  "use strict";

  var BEAT_MS = 60000;     // avisa que está online a cada 60s
  var REFRESH_MS = 30000;  // atualiza o status dos amigos a cada 30s
  var playing = !!window.B16_PLAYING;
  var statusMap = {};      // { nome_minusculo: "offline" | "online" | "playing" }
  var warnedBeat = false;
  var warnedList = false;
  var ultimoRefresh = 0;

  var ROTULO = { offline: "Offline", online: "Online", playing: "Jogando" };

  function injetarCSS() {
    var s = document.createElement("style");
    s.textContent = [
      ".friend-status{display:block;width:84px;height:5px;margin:0 auto 4px;border-radius:2px;background:#9e9e9e}",
      ".friend-status.online{background:#00a2ff}",
      ".friend-status.playing{background:#02b757}",
      ".friend-status.offline{background:#9e9e9e}"
    ].join("\n");
    document.head.appendChild(s);
  }

  // ---------- meu status ----------
  async function beat() {
    if (document.hidden) return;
    var r = await sb.rpc("set_presence", { p_playing: playing });
    if (r.error && !warnedBeat) {
      console.error("Presença: erro ao enviar status (rodou o presence.sql?)", r.error);
      warnedBeat = true;
    }
  }

  // ---------- status dos amigos ----------
  async function atualizar() {
    ultimoRefresh = Date.now();
    var r = await sb.rpc("get_friend_status");
    if (r.error) {
      if (!warnedList) {
        console.error("Presença: erro ao ler status dos amigos (rodou o presence.sql?)", r.error);
        warnedList = true;
      }
      return;
    }
    var m = {};
    (r.data || []).forEach(function (x) { m[(x.username || "").toLowerCase()] = x.status; });
    statusMap = m;
    desenhar();
  }

  function nomeDoItem(li) {
    var a = li.querySelector("a.friend-link");
    return a ? (a.getAttribute("title") || "") : "";
  }

  function desenhar() {
    var itens = document.querySelectorAll("#friend-list li.friend");
    var faltando = false;
    for (var i = 0; i < itens.length; i++) {
      var li = itens[i];
      var nome = nomeDoItem(li).toLowerCase();
      if (!nome) continue;
      var st = statusMap[nome];
      if (!st) { st = "offline"; faltando = true; }

      var link = li.querySelector("a.friend-link");
      var barra = li.querySelector(".friend-status");
      if (!barra) {
        barra = document.createElement("span");
        link.insertBefore(barra, link.firstChild);
      }
      var cls = "friend-status " + st;
      if (barra.className !== cls) barra.className = cls;
      barra.title = ROTULO[st] || "";
    }
    // amigo novo na lista que ainda não veio no status: busca de novo (no máx. a cada 3s)
    if (faltando && Date.now() - ultimoRefresh > 3000) atualizar();
  }

  // a lista é refeita pelo home-auth.js (a cada 20s e ao aceitar/remover amigos)
  function observarLista() {
    var ul = document.getElementById("friend-list");
    if (!ul) return;
    new MutationObserver(function () { desenhar(); }).observe(ul, { childList: true });
    desenhar();
  }

  // ---------- início ----------
  async function iniciar() {
    injetarCSS();
    observarLista();

    await Auth.ready;
    if (!Auth.currentUser()) return;

    await beat();
    await atualizar();

    setInterval(beat, BEAT_MS);
    setInterval(function () { if (!document.hidden) atualizar(); }, REFRESH_MS);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) { beat(); atualizar(); }
    });
  }

  window.Presence = {
    setPlaying: function (v) { playing = !!v; beat(); }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
