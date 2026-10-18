(function () {
  var $ = function (id) { return document.getElementById(id); };

  // esconde a página até confirmar o login (e libera sozinho depois de 6s)
  document.documentElement.style.visibility = "hidden";
  setTimeout(function () { document.documentElement.style.visibility = ""; }, 6000);

  function el(tag, cls, texto) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texto != null) e.textContent = texto;
    return e;
  }

  function fmtData(iso) {
    try { return new Date(iso).toLocaleString("pt-BR"); } catch (e) { return ""; }
  }

  // ---------- AMIGOS ----------
  async function renderFriends() {
    var lista = await Auth.getFriends();
    $("friends-count").textContent = lista.length;
    var ul = $("friend-list");
    ul.innerHTML = "";

    if (!lista.length) {
      ul.appendChild(el("li", "", "Você ainda não tem amigos. Envie um pedido pelo nome de usuário."))
        .id = "friend-empty";
      return;
    }

    lista.forEach(function (nome) {
      var li = el("li", "list-item friend");
      var a = el("a", "friend-link");
      a.href = "#";
      a.title = nome;
      a.addEventListener("click", function (e) { e.preventDefault(); });
      a.appendChild(el("span", "friend-avatar", nome.charAt(0).toUpperCase()));
      a.appendChild(el("span", "friend-name rbx-text-overflow", nome));

      var x = el("span", "friend-remove", "×");
      x.title = "Remover amigo";
      x.addEventListener("click", async function () {
        if (!confirm("Remover " + nome + " dos amigos?")) return;
        await Auth.removeFriend(nome);
        renderFriends();
        renderFeed();
      });

      li.appendChild(a);
      li.appendChild(x);
      ul.appendChild(li);
    });
  }

  // ---------- PEDIDOS DE AMIZADE ----------
  async function renderRequests() {
    var recebidos = await Auth.getIncomingRequests();
    var enviados = await Auth.getOutgoingRequests();
    var box = $("friend-requests");
    var ul = $("request-list");
    ul.innerHTML = "";

    $("requests-count").textContent = recebidos.length;
    box.style.display = (recebidos.length || enviados.length) ? "" : "none";

    recebidos.forEach(function (r) {
      var li = el("li", "request-item");
      li.appendChild(el("span", "request-name", r.name + " quer ser seu amigo"));

      var ok = el("button", "rbx-btn-primary-xs", "Aceitar");
      ok.type = "button";
      ok.addEventListener("click", async function () {
        ok.disabled = true;
        await Auth.acceptRequest(r.id);
        renderRequests();
        renderFriends();
        renderFeed();
      });

      var no = el("button", "rbx-btn-control-xs", "Recusar");
      no.type = "button";
      no.addEventListener("click", async function () {
        no.disabled = true;
        await Auth.declineRequest(r.id);
        renderRequests();
      });

      li.appendChild(ok);
      li.appendChild(no);
      ul.appendChild(li);
    });

    var env = $("request-sent");
    env.textContent = enviados.length
      ? "Aguardando resposta: " + enviados.map(function (r) { return r.name; }).join(", ")
      : "";
  }

  // ---------- FEED ----------
  async function renderFeed() {
    var posts = await Auth.getFeed();
    var ul = $("feed-list");
    ul.innerHTML = "";

    if (!posts.length) {
      ul.appendChild(el("li", "feed-empty", "Nada por aqui ainda. Publique algo ou adicione amigos."));
      return;
    }

    posts.forEach(function (p) {
      var li = el("li", "feed-item");
      li.appendChild(el("span", "feed-avatar", p.author.charAt(0).toUpperCase()));

      var corpo = el("div", "feed-body");
      var linha = el("p", "feed-text");
      linha.appendChild(el("strong", "", p.author + ": "));
      linha.appendChild(document.createTextNode(p.text));
      corpo.appendChild(linha);
      corpo.appendChild(el("span", "rbx-text-notes rbx-font-sm", fmtData(p.date)));

      if (p.mine) {
        var del = el("span", "feed-delete", "×");
        del.title = "Apagar";
        del.addEventListener("click", async function () {
          await Auth.deletePost(p.id);
          renderFeed();
        });
        li.appendChild(corpo);
        li.appendChild(del);
      } else {
        li.appendChild(corpo);
      }
      ul.appendChild(li);
    });
  }

  async function publicar() {
    var input = $("txtStatusMessage");
    var erro = $("feed-msg");
    erro.textContent = "";
    var r = await Auth.postFeed(input.value);
    if (r.ok) { input.value = ""; renderFeed(); }
    else erro.textContent = r.msg;
  }

  // ---------- MENU DA ENGRENAGEM ----------
  function iniciarMenu() {
    var btn = $("settings-toggle");
    var menu = $("settings-menu");
    if (!btn || !menu) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      menu.classList.toggle("open");
    });
    document.addEventListener("click", function () { menu.classList.remove("open"); });
  }

  // ---------- INICIAR ----------
  async function iniciar() {
    await Auth.requireLogin();
    var nome = Auth.currentUser();
    if (!nome) return; // requireLogin já redirecionou

    var hello = $("home-username");
    if (hello) { hello.textContent = nome; hello.classList.remove("rbx-preload"); }
    var lead = $("left-username");
    if (lead) lead.textContent = nome;

    iniciarMenu();

    // enviar pedido de amizade
    var form = $("add-friend-form");
    var input = $("add-friend-input");
    var msg = $("add-friend-msg");
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      msg.textContent = "";
      var r = await Auth.sendFriendRequest(input.value);
      if (r.ok) {
        input.value = "";
        msg.textContent = "Pedido enviado para " + r.name + "!";
        renderRequests();
      } else {
        msg.textContent = r.msg;
      }
    });

    // publicar no feed
    $("shareButton").addEventListener("click", function (e) { e.preventDefault(); publicar(); });
    $("txtStatusMessage").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); publicar(); }
    });

    await Promise.all([renderFriends(), renderRequests(), renderFeed()]);
    document.documentElement.style.visibility = "";

    // atualiza pedidos e feed sozinho
    setInterval(function () { renderRequests(); renderFriends(); renderFeed(); }, 20000);
  }

  // logout: pega o clique antes de qualquer outro script
  document.addEventListener("click", function (e) {
    var el2 = e.target.closest ? e.target.closest("a, [data-behavior]") : null;
    if (!el2) return;
    var ehLogout =
      el2.getAttribute("data-behavior") === "logout" ||
      (el2.tagName === "A" && /^\s*logout\s*$/i.test(el2.textContent));
    if (!ehLogout) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    Auth.logout();
  }, true);

  document.addEventListener("DOMContentLoaded", iniciar);
})();
