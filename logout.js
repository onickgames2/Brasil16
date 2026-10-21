// logout.js
// Requer que o cliente do Supabase já exista como `supabase`
// (o mesmo que você usa no auth.js). Carregue DEPOIS dele.

async function fazerLogout() {
  const btn = document.getElementById("logout-btn");
  if (btn) btn.disabled = true;

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (err) {
    console.error("Erro ao sair:", err.message || err);
    if (btn) btn.disabled = false;
    alert("Não foi possível sair. Tente de novo.");
    return;
  }

  // limpa restos de sessão antiga
  localStorage.clear();
  sessionStorage.clear();

  // volta pra página de cadastro/login
  window.location.replace("/");
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("logout-btn");
  if (btn) btn.addEventListener("click", fazerLogout);
});

// Se a sessão acabar em outra aba ou expirar, também redireciona
supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    window.location.replace("/");
  }
});
