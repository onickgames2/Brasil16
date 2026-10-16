(function () {
  // Sem perfil logado: esconde a página e volta pro index.html
  if (!Auth.currentUser()) {
    document.documentElement.style.display = "none";
    Auth.requireLogin("index.html");
    return;
  }

  var user = Auth.currentUser();
  var KEY_ROBUX = "oldrblx_robux_" + user.toLowerCase();

  function getRobux() {
    return parseInt(localStorage.getItem(KEY_ROBUX) || "0", 10);
  }

  // Troca "Log In" / "Sign Up" pelo nome e pelo saldo
  function atualizarTopo() {
    var login = document.getElementById("header-login");
    var signup = document.querySelector(".rbx-navbar-signup");
    if (login) login.textContent = user;
    if (signup) {
      signup.textContent = "R$ " + getRobux();
      signup.removeAttribute("href");
    }
  }

  // Bloqueia o popup de login e o link de cadastro (você já está logado)
  document.addEventListener("click", function (e) {
    if (e.target.closest("#header-login, .rbx-navbar-signup")) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  document.addEventListener("DOMContentLoaded", atualizarTopo);
  window.addEventListener("load", atualizarTopo); // caso os scripts da Roblox mexam no topo

  // Atualiza o saldo se ele mudar em outra aba (ex.: resgatou um promocode)
  window.addEventListener("storage", function (e) {
    if (e.key === KEY_ROBUX) atualizarTopo();
  });
})();
