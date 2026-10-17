(async function () {
  // Esconde a página até saber se tem login (o perfil carrega de forma assíncrona)
  document.documentElement.style.display = "none";

  await Auth.ready;

  if (!Auth.currentUser()) {
    location.replace("index.html");
    return;
  }

  var user = Auth.currentUser();
  var saldo = 0;
  var enviando = false;

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

  function atualizarTopo() {
    var login = $("head-login");
    var signup = document.querySelector(".rbx-navbar-signup");
    if (login) login.textContent = user;
    if (signup) {
      signup.textContent = "R$ " + saldo;
      signup.removeAttribute("href");
    }
  }

  // usa o client "sb" criado no auth.js
  async function carregarSaldo() {
    var r = await sb.from("wallets").select("robux").maybeSingle();
    saldo = r.data ? r.data.robux : 0;
    atualizarTopo();
  }

  async function resgatar() {
    if (enviando) return;
    var code = $("pin").value.trim().toUpperCase();
    esconderResultados();
    if (!code) return mostrarErro("Digite um código.");

    enviando = true;
    $("busy").style.display = "inline";

    var r = await sb.rpc("redeem_code", { p_code: code });

    enviando = false;
    $("busy").style.display = "none";

    if (r.error || !r.data) {
      console.error(r.error);
      return mostrarErro("Erro de conexão. Tente de novo.");
    }
    if (!r.data.ok) {
      if (r.data.error === "used") return mostrarErro("Você já resgatou este código.");
      if (r.data.error === "not_logged") return mostrarErro("Faça login novamente.");
      return mostrarErro("Código inválido ou expirado.");
    }

    saldo = r.data.balance;
    atualizarTopo();
    $("pin").value = "";
    mostrarSucesso("Código resgatado! Você ganhou " + r.data.gained +
      " Robux. Saldo atual: " + saldo + " Robux.");
  }

  // Captura o clique ANTES do onclick original (que chama o script da Roblox)
  document.addEventListener("click", function (e) {
    if (e.target.closest(".btn-primary.btn-small")) {
      e.preventDefault();
      e.stopPropagation();
      resgatar();
      return;
    }
    if (e.target.closest("#head-login, .rbx-navbar-signup")) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.id === "pin") {
      e.preventDefault();
      resgatar();
    }
  }, true);

  function iniciar() {
    esconderResultados();
    carregarSaldo();
    document.documentElement.style.display = "";
  }

  // como esperamos o login, o DOM pode já ter carregado
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
