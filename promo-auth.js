(function () {
  // 1) Sem perfil logado: esconde a página e manda pro index.html
  if (!Auth.currentUser()) {
    document.documentElement.style.display = "none";
    Auth.requireLogin("index.html");
    return;
  }

  var user = Auth.currentUser();
  var KEY_ROBUX = "oldrblx_robux_" + user.toLowerCase();
  var KEY_USED = "oldrblx_codes_" + user.toLowerCase();

  // 2) Lista de promocodes (pra criar outro, é só adicionar aqui)
  var CODES = {
    "BEMVINDO": { robux: 200 }
    "ALARMEFALSO": { robux: 650 }
  };

  function getRobux() {
    return parseInt(localStorage.getItem(KEY_ROBUX) || "0", 10);
  }
  function setRobux(n) {
    localStorage.setItem(KEY_ROBUX, String(n));
  }
  function getUsed() {
    try { return JSON.parse(localStorage.getItem(KEY_USED) || "[]"); }
    catch (e) { return []; }
  }
  function markUsed(code) {
    var used = getUsed();
    used.push(code);
    localStorage.setItem(KEY_USED, JSON.stringify(used));
  }

  var $ = function (id) { return document.getElementById(id); };

  function esconderResultados() {
    ["success", "error", "busy"].forEach(function (id) {
      if ($(id)) $(id).style.display = "none";
    });
  }

  function mostrarSucesso(texto) {
    esconderResultados();
    $("SuccessMessage").textContent = texto;
    $("success").style.display = "block";
  }

  function mostrarErro(texto) {
    esconderResultados();
    $("errorText").textContent = texto;
    $("error").style.display = "block";
  }

  // Mostra o nome e o saldo no topo (no lugar de "Log In" / "Sign Up")
  function atualizarTopo() {
    var login = $("head-login");
    var signup = document.querySelector(".rbx-navbar-signup");
    if (login) login.textContent = user;
    if (signup) {
      signup.textContent = "R$ " + getRobux();
      signup.removeAttribute("href");
    }
  }

  // 3) Resgatar o código
  function resgatar() {
    var code = $("pin").value.trim().toUpperCase();
    esconderResultados();

    if (!code) return mostrarErro("Digite um código.");

    $("busy").style.display = "inline";
    setTimeout(function () {
      var promo = CODES[code];
      if (!promo) return mostrarErro("Código inválido ou expirado.");
      if (getUsed().indexOf(code) !== -1) {
        return mostrarErro("Você já resgatou este código.");
      }

      setRobux(getRobux() + promo.robux);
      markUsed(code);
      atualizarTopo();
      $("pin").value = "";
      mostrarSucesso("Código resgatado! Você ganhou " + promo.robux +
        " Robux. Saldo atual: " + getRobux() + " Robux.");
    }, 600);
  }

  // Captura o clique ANTES do onclick original (que chama o script da Roblox)
  document.addEventListener("click", function (e) {
    if (e.target.closest(".btn-primary.btn-small")) {
      e.preventDefault();
      e.stopPropagation();
      resgatar();
      return;
    }
    // Bloqueia o popup de login do topo (você já está logado)
    if (e.target.closest("#head-login, .rbx-navbar-signup")) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Enter no campo do código
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.id === "pin") {
      e.preventDefault();
      resgatar();
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function () {
    esconderResultados();
    atualizarTopo();
  });
})();
