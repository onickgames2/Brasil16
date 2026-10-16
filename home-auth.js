(function () {
  // Sem conta logada: esconde a página e volta pro index.html
  if (!Auth.currentUser()) {
    document.documentElement.style.display = "none";
    Auth.requireLogin("index.html");
    return;
  }

  var nome = Auth.currentUser();

  // ---------- Pre-load: skeleton cinza enquanto o nome não entra ----------
  var estilo = document.createElement("style");
  estilo.textContent =
    ".rbx-preload{display:inline-block;min-width:130px;height:.9em;vertical-align:middle;" +
    "background:#e3e3e3;border-radius:3px;color:transparent;animation:rbxpulse 1s infinite alternate}" +
    "@keyframes rbxpulse{from{opacity:.4}to{opacity:1}}";
  document.head.appendChild(estilo);

  // ---------- Nome / Robux ----------
  function aplicarNome() {
    var robux = parseInt(localStorage.getItem("oldrblx_robux_" + nome.toLowerCase()) || "0", 10);
    var a = document.getElementById("nav-robux-amount");
    var b = document.getElementById("nav-robux-balance");
    if (a) a.textContent = robux;
    if (b) b.textContent = robux + " ROBUX";

    var ola = document.querySelector(".home-header-content h1 a");
    if (ola) ola.textContent = "Hello, " + nome + "!";

    var lateral = document.querySelector(".rbx-lead a");
    if (lateral) lateral.textContent = nome;
  }

  // Preenche o Hello assim que o elemento aparece no DOM (antes do load)
  var obs = new MutationObserver(function () {
    if (document.querySelector(".home-header-content h1 a")) {
      aplicarNome();
      obs.disconnect();
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });

  // ---------- Amigos ----------
  function avatarPadrao(n) {
    var inicial = (n.charAt(0) || "?").toUpperCase();
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90">' +
      '<rect width="90" height="90" fill="#c8c8c8"/>' +
      '<text x="45" y="58" font-size="40" font-family="Arial" text-anchor="middle" fill="#fff">' +
      inicial + '</text></svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function renderAmigos() {
    var ul = document.getElementById("friend-list");
    var cont = document.getElementById("friends-count");
    if (!ul) return;
    var lista = Auth.getFriends();
    if (cont) cont.textContent = lista.length;
    ul.innerHTML = "";
    lista.forEach(function (n) {
      var li = document.createElement("li");
      li.className = "list-item friend";

      var link = document.createElement("a");
      link.href = "#";
      link.className = "friend-link";
      link.title = n;

      var av = document.createElement("span");
      av.className = "friend-avatar";
      var img = document.createElement("img");
      img.alt = n;
      img.src = avatarPadrao(n);
      av.appendChild(img);

      var nm = document.createElement("span");
      nm.className = "friend-name rbx-text-overflow";
      nm.textContent = n;

      link.appendChild(av);
      link.appendChild(nm);
      li.appendChild(link);
      ul.appendChild(li);
    });
  }

  function iniciarAmigos() {
    renderAmigos();
    var form = document.getElementById("add-friend-form");
    var input = document.getElementById("add-friend-input");
    var msg = document.getElementById("add-friend-msg");
    if (!form || !input) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var r = Auth.addFriend(input.value);
      if (r.ok) {
        input.value = "";
        msg.textContent = "";
        renderAmigos();
      } else {
        msg.textContent = r.msg;
      }
    });
  }

  function iniciar() {
    aplicarNome();
    iniciarAmigos();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
  window.addEventListener("load", aplicarNome); // garante caso os scripts da Roblox mexam na página

  // Botão Logout (no menu da engrenagem): captura antes do script da Roblox
  document.addEventListener("click", function (e) {
    var sair = e.target.closest('[data-behavior="logout"]');
    if (sair) {
      e.preventDefault();
      e.stopPropagation();
      Auth.logout(); // apaga a sessão e vai pro index.html
    }
  }, true);
})();
