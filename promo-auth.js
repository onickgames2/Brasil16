(function () {
  // 1) Sem perfil logado: esconde a página e manda pro index.html
  if (!Auth.currentUser()) {
    document.documentElement.style.display = "none";
    Auth.requireLogin("index.html");
    return;
  }

  var user = Auth.currentUser();
  var KEY_USED = "oldrblx_codes_" + user.toLowerCase();

  // 2) Lista de promocodes
  var CODES = {
    "BEMVINDO": { robux: 200 },
    "ALARMEFALSO": { robux: 650 },
    "FDOMINIOANTIGO": { robux: 380 }
  };

  // Funções de banco de dados utilizando o Supabase client
  async function getRobux() {
    try {
      // Certifique-se de que 'supabase' está carregado globalmente (via supabase-client.js)
      var { data, error } = await supabase
        .from('usuarios') // Nome da sua tabela de contas no Supabase
        .select('robux')
        .eq('username', user)
        .single();

      if (error || !data) return 0;
      return parseInt(data.robux || "0", 10);
    } catch (e) {
      console.error("Erro ao buscar robux:", e);
      return 0;
    }
  }

  async function setRobux(n) {
    try {
      var { error } = await supabase
        .from('usuarios')
        .update({ robux: n })
        .eq('username', user);

      if (error) console.error("Erro ao atualizar robux:", error);
    } catch (e) {
      console.error("Erro ao atualizar robux:", e);
    }
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

  // Atualiza o topo buscando direto do servidor
  async function atualizarTopo() {
    var login = $("head-login");
    var signup = document.querySelector(".rbx-navbar-signup");
    if (login) login.textContent = user;
    if (signup) {
      var saldo = await getRobux();
      signup.textContent = "R$ " + saldo;
      signup.removeAttribute("href");
    }
  }

  // 3) Resgatar o código
  async function resgatar() {
    var code = $("pin").value.trim().toUpperCase();
    esconderResultados();

    if (!code) return mostrarErro("Digite um código.");

    $("busy").style.display = "inline";
    
    setTimeout(async function () {
      var promo = CODES[code];
      if (!promo) {
        $("busy").style.display = "none";
        return mostrarErro("Código inválido ou expirado.");
      }
      if (getUsed().indexOf(code) !== -1) {
        $("busy").style.display = "none";
        return mostrarErro("Você já resgatou este código.");
      }

      var saldoAtual = await getRobux();
      var novoSaldo = saldoAtual + promo.robux;

      await setRobux(novoSaldo);
      markUsed(code);
      await atualizarTopo();
      
      $("pin").value = "";
      $("busy").style.display = "none";
      mostrarSucesso("Código resgatado! Você ganhou " + promo.robux +
        " Robux. Saldo atual: " + novoSaldo + " Robux.");
    }, 600);
  }

  // Captura o clique ANTES do onclick original
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
