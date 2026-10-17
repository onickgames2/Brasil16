(function () {
  var $ = function (id) { return document.getElementById(id); };
  var gender = null;

  // 1) Já tem conta logada? Esconde a página e vai pro home
  document.documentElement.style.display = "none";
  Auth.ready.then(function () {
    if (Auth.currentUser()) {
      location.replace("home.html");
    } else {
      document.documentElement.style.display = "";
    }
  });

  function setMsg(id, texto) {
    var el = $(id);
    if (!el) return;
    el.textContent = texto;
    el.classList.remove("ng-hide");
  }

  function limparErros() {
    ["signup-usernameInputValidation", "signup-passwordInputValidation",
     "signup-passwordConfirmInputValidation", "signup-BirthdayInputValidation",
     "signup-GenderInputValidation", "signup-agreeTermsPrivacyInputValidation",
     "GeneralErrorText"].forEach(function (id) {
      var el = $(id);
      if (el) el.textContent = "";
    });
  }

  // 2) Criar conta
  async function criarConta() {
    limparErros();
    var u = $("signup-username").value.trim();
    var p = $("signup-password").value;
    var c = $("signup-password-confirm").value;
    var mes = $("MonthDropdown").value;
    var dia = $("DayDropdown").value;
    var ano = $("YearDropdown").value;
    var ok = true;

    if (u.length < 3 || u.length > 20) {
      setMsg("signup-usernameInputValidation", "O usuário deve ter de 3 a 20 caracteres."); ok = false;
    } else if (!/^[A-Za-z0-9_]+$/.test(u)) {
      setMsg("signup-usernameInputValidation", "Use só letras, números e _."); ok = false;
    }
    if (p.length < 8) {
      setMsg("signup-passwordInputValidation", "A senha precisa ter no mínimo 8 caracteres."); ok = false;
    }
    if (c !== p) {
      setMsg("signup-passwordConfirmInputValidation", "As senhas não são iguais."); ok = false;
    }
    if (!mes || !dia || !ano) {
      setMsg("signup-BirthdayInputValidation", "Escolha sua data de nascimento."); ok = false;
    }
    if (!gender) {
      setMsg("signup-GenderInputValidation", "Escolha o gênero."); ok = false;
    }
    if (!$("agreeTermsPrivacy").checked) {
      setMsg("signup-agreeTermsPrivacyInputValidation", "Aceite os Termos de Uso e a Política de Privacidade."); ok = false;
    }
    if (!ok) return;

    var r = await Auth.register(u, p);
    if (r.ok) {
      location.href = "home.html";
    } else {
      setMsg("GeneralErrorText", r.msg);
    }
  }

  // 3) Login (formulário de cima)
  async function entrar() {
    var u = $("LoginUsername").value;
    var p = $("LoginPassword").value;
    var r = await Auth.login(u, p);
    if (r.ok) location.href = "home.html";
    else alert(r.msg);
  }

  // Captura os eventos ANTES do Angular/Roblox
  document.addEventListener("click", function (e) {
    if (e.target.closest("#signup-button")) {
      e.preventDefault(); e.stopPropagation();
      criarConta();
      return;
    }
    var g = e.target.closest("#FemaleButton, #MaleButton");
    if (g) {
      gender = g.id;
      $("FemaleButton").classList.toggle("selected-gender", gender === "FemaleButton");
      $("MaleButton").classList.toggle("selected-gender", gender === "MaleButton");
    }
  }, true);

  document.addEventListener("keypress", function (e) {
    if (e.target.closest && e.target.closest("#signup-button")) {
      e.preventDefault(); e.stopPropagation();
      return;
    }
    if (e.key === "Enter" && e.target.closest &&
        e.target.closest("#signup-username, #signup-password, #signup-password-confirm")) {
      e.preventDefault(); e.stopPropagation();
      criarConta();
    }
  }, true);

  document.addEventListener("submit", function (e) {
    if (e.target.id === "LogInForm") {
      e.preventDefault(); e.stopPropagation();
      entrar();
    }
  }, true);
})();
