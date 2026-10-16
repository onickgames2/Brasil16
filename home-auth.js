(function () {
  // Sem conta logada: esconde a página e volta pro index.html
  if (!Auth.currentUser()) {
    document.documentElement.style.display = "none";
    Auth.requireLogin("index.html");
    return;
  }

  var nome = Auth.currentUser();

  // Troca "ConnerMurphy07" pelo nome da conta logada
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", aplicarNome);
  } else {
    aplicarNome();
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
