(function () {
  // Mesmo CSS que a página de catalog carrega
  var CSS_URL = "https://web.archive.org/web/20160413051516cs_/https://static.rbxcdn.com/css/MainCSS___0880075e1b3b4ca1c6f64197c3b706ff_m.css/fetch";

  // 1) Dá aos ícones da topbar também o nome de classe usado no catalog
  function aliasIcones() {
    var alvo = document.querySelectorAll("#header [class*='rbx-icon-nav-'], #navigation [class*='rbx-icon-nav-']");
    alvo.forEach(function (el) {
      el.className.split(/\s+/).forEach(function (c) {
        var m = c.match(/^rbx-(icon-nav-[\w-]+)$/);
        if (m && !el.classList.contains(m[1])) el.classList.add(m[1]);
      });
    });
  }

  // 2) Traz só as regras de ícone do CSS do catalog (não mexe no resto da página)
  function injetarRegrasDeIcone(texto) {
    var folha = new CSSStyleSheet();
    folha.replaceSync(texto);
    var regras = [];
    Array.prototype.forEach.call(folha.cssRules, function (r) {
      if (r.selectorText && /icon-nav-|\.logo/.test(r.selectorText)) {
        regras.push(r.cssText);
      }
    });
    var st = document.createElement("style");
    st.id = "catalog-topbar-icons";
    st.textContent = regras.join("\n");
    document.head.appendChild(st);
  }

  function iniciar() {
    aliasIcones();
    if (document.getElementById("catalog-topbar-icons")) return;
    fetch(CSS_URL)
      .then(function (r) { return r.text(); })
      .then(injetarRegrasDeIcone)
      .catch(function (e) { console.warn("Não consegui carregar os ícones do catalog:", e); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
  window.addEventListener("load", aliasIcones); // caso outro script recrie os ícones
})();
