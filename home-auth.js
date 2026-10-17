(function () {
  var $ = function (id) { return document.getElementById(id); };

  // esconde a página até confirmar o login
  document.documentElement.style.visibility = "hidden";

  async function renderFriends() {
    var lista = await Auth.getFriends();
    $("friends-count").textContent = lista.length;

    var ul = $("friend-list");
    ul.innerHTML = "";

    if (!lista.length) {
      var vazio = document.createElement("li");
      vazio.id = "friend-empty";
      vazio.textContent = "Você ainda não tem amigos. Adicione alguém pelo nome de usuário.";
      ul.appendChild(vazio);
      return;
    }

    lista.forEach(function (nome) {
      var li = document.createElement("li");
      li.className = "list-item friend";

      var a = document.createElement("a");
      a.className = "friend-link";
      a.href = "#";
      a.title = nome;
      a.addEventListener("click", function (e) { e.preventDefault(); });

      var av = document.createElement("span");
      av.className = "friend-avatar";
      av.textContent = nome.charAt(0).toUpperCase();

      var nm = document.createElement("span");
      nm.className = "friend-name rbx-text-overflow";
      nm.textContent = nome;

      a.appendChild(av);
      a.appendChild(nm);

      var x = document.createElement("span");
      x.className = "friend-remove";
      x.title = "Remover amigo";
      x.textContent = "×";
      x.addEventListener("click", async function () {
        await Auth.removeFriend(nome);
        renderFriends();
      });

      li.appendChild(a);
      li.appendChild(x);
      ul.appendChild(li);
    });
  }

  // botão de logout extra no menu da esquerda
  function addLogoutNaEsquerda() {
    var menu = document.querySelector("#navigation .rbx-scrollbar ul");
    if (!menu || document.getElementById("nav-logout")) return;
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.id = "nav-logout";
    a.href = "#";
    a.setAttribute("data-behavior", "logout");
    a.innerHTML = "<span>Logout</span>";
    li.appendChild(a);
    menu.insertBefore(li, menu.firstChild.nextSibling);
  }

  async function iniciar() {
    await Auth.requireLogin();
    var nome = Auth.currentUser();
    if (!nome) return; // requireLogin já redirecionou

    // nome no "Hello, ...!" e no menu da esquerda
    var hello = $("home-username");
    if (hello) { hello.textContent = nome; hello.classList.remove("rbx-preload"); }
    var lead = document.querySelector(".rbx-left-col .rbx-lead a");
    if (lead) { lead.textContent = nome; lead.setAttribute("href", "#"); }

    addLogoutNaEsquerda();

    // adicionar amigo
    var form = $("add-friend-form");
    var input = $("add-friend-input");
    var msg = $("add-friend-msg");
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      msg.textContent = "";
      var r = await Auth.addFriend(input.value);
      if (r.ok) {
        input.value = "";
        msg.textContent = "Adicionado: " + r.name;
        renderFriends();
      } else {
        msg.textContent = r.msg;
      }
    });

    await renderFriends();
    document.documentElement.style.visibility = "";
  }

  // logout: pega o clique ANTES do JS do Roblox
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("a, [data-behavior]") : null;
    if (!el) return;
    var ehLogout =
      el.getAttribute("data-behavior") === "logout" ||
      (el.tagName === "A" && /^\s*logout\s*$/i.test(el.textContent));
    if (!ehLogout) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    Auth.logout();
  }, true);

  document.addEventListener("DOMContentLoaded", iniciar);
})();
