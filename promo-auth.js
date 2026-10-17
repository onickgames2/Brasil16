(function () {
  if (!Auth.currentUser()) {
    document.documentElement.style.display = "none";
    Auth.requireLogin("index.html");
    return;
  }

  var user = Auth.currentUser();
  var userKey = user.toLowerCase();
  var saldo = 0;

  // troque pela URL/anon key do seu projeto (ou use seu client existente)
  var sb = supabase.createClient("SUA_URL", "SUA_ANON_KEY");

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

  async function carregarSaldo() {
    var r = await sb.from("wallets").select("robux")
      .eq("username", userKey).maybeSingle();
    saldo = r.data ? r.data.robux : 0;
    atualizarTopo();
  }

  var enviando = false;
  async function resgatar() {
    if (enviando) return;
    var code = $("pin").value.trim().toUpperCase();
    esconderResultados();
    if (!code) return mostrarErro("Digite um código.");

    enviando = true;
    $("busy").style.display = "inline";

    var r = await sb.rpc("redeem_code", { p_username: userKey, p_code: code });
    enviando = false;
    $("busy").style.display = "none";

    if (r.error || !r.data) {
      return mostrarErro("Erro de conexão. Tente de novo.");
    }
    if (!r.data.ok) {
      return mostrarErro(r.data.error === "used"
        ? "Você já resgatou este código."
        : "Código inválido ou expirado.");
    }

    saldo = r.data.balance;
    atualizarTopo();
    $("pin").value = "";
    mostrarSucesso("Código resgatado! Você ganhou " + r.data.gained +
      " Robux. Saldo atual: " + saldo + " Robux.");
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest(".btn-primary.btn-small")) {
      e.preventDefault(); e.stopPropagation(); resgatar(); return;
    }
    if (e.target.closest("#head-login, .rbx-navbar-signup")) {
      e.preventDefault(); e.stopPropagation();
    }
  }, true);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.id === "pin") {
      e.preventDefault(); resgatar();
    }
  }, true);

  document.addEventListener("DOMContentLoaded", function () {
    esconderResultados();
    carregarSaldo();
  });
})();
