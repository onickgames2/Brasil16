(function () {
  // ====== EDITE AQUI: nome do arquivo de cada página (null = ainda não existe) ======
  var PAGES = {
    home: "home.html",
    games: "games.html",
    catalog: "catalog.html",
    develop: "develop.html",
    login: "login.html",
    signup: "index.html",
    robux: "promocodes.html",
    profile: null,
    messages: null,
    friends: null,
    avatar: null,
    inventory: null,
    trade: null,
    groups: null,
    forum: null,
    blog: null,
    shop: null,
    about: null, jobs: null, parents: null, help: null, terms: null, privacy: null
  };

  function url(key) { return PAGES[key] || "#"; }

  // texto do link -> chave em PAGES
  var POR_TEXTO = {
    "games": "games", "catalog": "catalog", "develop": "develop", "robux": "robux",
    "about us": "about", "jobs": "jobs", "blog": "blog", "parents": "parents",
    "help": "help", "terms": "terms", "privacy": "privacy"
  };

  function aplicar() {
    var nome = (typeof Auth !== "undefined") ? Auth.currentUser() : null;

    // ---------- Cabeçalho ----------
    var logo = document.querySelector(".navbar-brand");
    if (logo) logo.href = url("home");

    document.querySelectorAll(".rbx-navbar a.nav-menu-title").forEach(function (a) {
      var k = POR_TEXTO[a.textContent.trim().toLowerCase()];
      if (k) a.href = url(k);
    });

    document.querySelectorAll(".rbx-navbar-search-anchor").forEach(function (a) {
      a.href = "#";
    });

    var login = document.getElementById("head-login");
    var signup = document.querySelector(".rbx-navbar-signup");
    if (nome) {
      // conta logada: esconde Log In / Sign Up
      [login, signup].forEach(function (el) {
        if (el && el.parentElement) el.parentElement.style.display = "none";
      });
      var ifr = document.getElementById("iFrameLogin");
      if (ifr) ifr.style.display = "none";
    } else {
      if (login) login.href = url("login");
      if (signup) signup.href = url("signup");
    }

    // ---------- Rodapé ----------
    document.querySelectorAll(".footer-link a").forEach(function (a) {
      var k = POR_TEXTO[a.textContent.trim().toLowerCase()];
      a.href = k ? url(k) : "#";
      a.removeAttribute("target");
    });

    // ---------- Menu lateral com ícones (iguais ao HTML de games) ----------
    if (!document.getElementById("navigation")) {
      var itens = [
        ["home", "Home", "icon-nav-home"],
        ["profile", "Profile", "icon-nav-profile"],
        ["messages", "Messages", "icon-nav-message"],
        ["friends", "Friends", "icon-nav-friends"],
        ["avatar", "Avatar", "icon-nav-charactercustomizer"],
        ["inventory", "Inventory", "icon-nav-inventory"],
        ["trade", "Trade", "icon-nav-trade"],
        ["groups", "Groups", "icon-nav-group"],
        ["forum", "Forum", "icon-nav-forum"],
        ["blog", "Blog", "icon-nav-blog"],
        ["shop", "Shop", "icon-nav-shop"]
      ];

      var nav = document.createElement("div");
      nav.id = "navigation";
      nav.className = "rbx-left-col";
      nav.setAttribute("data-behavior", "left-col");

      var topo = document.createElement("ul");
      var liNome = document.createElement("li");
      liNome.className = "text-lead";
      var aNome = document.createElement("a");
      aNome.className = "text-overflow";
      aNome.href = url("profile");
      aNome.textContent = nome || "";
      liNome.appendChild(aNome);
      var liDiv = document.createElement("li");
      liDiv.className = "rbx-divider";
      topo.appendChild(liNome);
      topo.appendChild(liDiv);
      nav.appendChild(topo);

      var scroll = document.createElement("div");
      scroll.className = "rbx-scrollbar";
      var ul = document.createElement("ul");
      itens.forEach(function (i) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = url(i[0]);
        a.id = "nav-" + i[0];
        var ico = document.createElement("span");
        // as duas famílias de classe, para funcionar na home e nas páginas novas
        ico.className = i[2] + " rbx-" + i[2];
        var txt = document.createElement("span");
        txt.textContent = i[1];
        a.appendChild(ico);
        a.appendChild(txt);
        li.appendChild(a);
        ul.appendChild(li);
      });
      scroll.appendChild(ul);
      nav.appendChild(scroll);

      var conteudo = document.getElementById("navContent");
      if (conteudo && conteudo.parentNode) {
        conteudo.parentNode.insertBefore(nav, conteudo);
        // a classe logged-in é a que abre espaço para o menu lateral
        conteudo.className = conteudo.className.replace("logged-out", "logged-in");
      } else {
        document.body.insertBefore(nav, document.body.firstChild);
      }
    }
  }

  // Links "#" não rolam a página
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (a && a.getAttribute("href") === "#") e.preventDefault();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", aplicar);
  } else {
    aplicar();
  }
  window.addEventListener("load", aplicar); // reaplica caso os scripts da Roblox mexam na página
})();
