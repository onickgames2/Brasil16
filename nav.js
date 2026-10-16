(function () {
  // ===== CONFIGURAÇÃO =====
  var SEM_HTML = false; // true = links sem ".html"
  var BASE = "./";      // todas as páginas na mesma pasta

  var ROTAS = [
    { re: /^\/(home)?\/?$/,                    vai: "home" },
    { re: /^\/catalog/,                        vai: "catalog" },
    { re: /^\/upgrades\/robux/,                vai: "promocodes" },
    { re: /^\/promocodes/,                     vai: "promocodes" },
    { re: /^\/games/,                          vai: "games" },   // precisa existir games.html
    { re: /^\/develop/,                        vai: "home" },    // ainda sem página própria
    { re: /^\/(newlogin|login|account\/signupredir)/, vai: "index" }
  ];
  // =========================

  function destino(nome) {
    if (nome === "index") return BASE + (SEM_HTML ? "" : "index.html");
    return BASE + nome + (SEM_HTML ? "" : ".html");
  }

  function resolver(href) {
    if (!href) return undefined;
    var h = href.replace(/^(https?:\/\/web\.archive\.org)?\/web\/\d+[a-z_]*\//, "");
    var m = h.match(/^(?:https?:)?\/\/([^\/?#]+)(\/[^?#]*)?/);
    if (!m) return undefined;
    if (!/roblox|archive\.org/i.test(m[1])) return undefined;
    var caminho = (m[2] || "/").toLowerCase();
    for (var i = 0; i < ROTAS.length; i++) {
      if (ROTAS[i].re.test(caminho)) return destino(ROTAS[i].vai);
    }
    return null;
  }

  function reescrever() {
    var links = document.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      var d = resolver(links[i].getAttribute("href"));
      if (typeof d === "string") {
        links[i].setAttribute("href", d);
        links[i].removeAttribute("target");
      }
    }
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var d = resolver(a.getAttribute("href"));
    if (d === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    if (d) location.href = d;
  }, true);

  document.addEventListener("DOMContentLoaded", reescrever);
  window.addEventListener("load", reescrever);

  if (SEM_HTML && /^https?:$/.test(location.protocol)) {
    var limpo = location.pathname.replace(/index\.html$/, "").replace(/\.html$/, "");
    if (limpo !== location.pathname) {
      history.replaceState(null, "", limpo + location.search + location.hash);
    }
  }
})();
