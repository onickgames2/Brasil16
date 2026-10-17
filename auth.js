// ===== CONFIG DO SUPABASE =====
const SUPABASE_URL = "https://upewvriimpcpktxwzxxo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7X00eY3rjYNkyK7hvfbskg_06exBASU";
// ==============================

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const Auth = {
  _profile: null, // { id (uuid), numeric_id, username }

  // usuário -> e-mail interno (o Supabase Auth exige e-mail)
  _email(username) {
    return username.trim().toLowerCase() + "@brasil16.app";
  },

  async _carregarPerfil(session) {
    if (!session) { this._profile = null; return; }
    const { data } = await sb
      .from("profiles")
      .select("id, numeric_id, username")
      .eq("id", session.user.id)
      .maybeSingle();
    this._profile = data || null;
  },

  // As páginas devem fazer: await Auth.ready;
  ready: null,

  init() {
    this.ready = sb.auth.getSession().then(({ data }) => this._carregarPerfil(data.session));
    sb.auth.onAuthStateChange((evento, session) => {
      if (evento === "SIGNED_OUT") this._profile = null;
    });
  },

  async register(username, password) {
    username = username.trim();
    if (username.length < 3) return { ok: false, msg: "Usuário muito curto (mín. 3)." };
    if (password.length < 8) return { ok: false, msg: "Senha muito curta (mín. 8)." };

    const { data, error } = await sb.auth.signUp({
      email: this._email(username),
      password: password,
      options: { data: { username: username } }
    });

    if (error) {
      const m = (error.message || "").toLowerCase();
      if (m.includes("already")) return { ok: false, msg: "Esse usuário já existe." };
      return { ok: false, msg: error.message };
    }
    if (!data.session) {
      return { ok: false, msg: "Desligue o 'Confirm email' no Supabase (Auth → Providers → Email)." };
    }
    await this._carregarPerfil(data.session);
    return { ok: true, id: this._profile ? this._profile.numeric_id : null };
  },

  async login(username, password) {
    const { data, error } = await sb.auth.signInWithPassword({
      email: this._email(username),
      password: password
    });
    if (error) return { ok: false, msg: "Usuário ou senha incorretos." };
    await this._carregarPerfil(data.session);
    return { ok: true };
  },

  // Funciona depois de "await Auth.ready"
  currentUser() {
    return this._profile ? this._profile.username : null;
  },

  currentId() {
    return this._profile ? this._profile.numeric_id : null;
  },

  async getId(username) {
    const { data } = await sb
      .from("profiles")
      .select("numeric_id")
      .eq("username_lower", (username || "").trim().toLowerCase())
      .maybeSingle();
    return data ? data.numeric_id : null;
  },

  async logout() {
    await sb.auth.signOut();
    this._profile = null;
    location.href = "index.html";
  },

  // Sem conta/sessão -> manda pro index.html
  async requireLogin(destino = "index.html") {
    await this.ready;
    if (!this.currentUser()) location.replace(destino);
  },

  // ---------- Amigos ----------
  // Lista de nomes dos amigos da conta logada
  async getFriends() {
    await this.ready;
    if (!this._profile) return [];
    const { data, error } = await sb
      .from("friends")
      .select("friend:profiles!friends_friend_id_fkey(username)")
      .eq("user_id", this._profile.id);
    if (error || !data) return [];
    return data.map(r => r.friend.username);
  },

  async addFriend(username) {
    await this.ready;
    if (!this._profile) return { ok: false, msg: "Faça login primeiro." };
    username = (username || "").trim();
    if (!username) return { ok: false, msg: "Digite um usuário." };
    if (username.toLowerCase() === this._profile.username.toLowerCase()) {
      return { ok: false, msg: "Você não pode adicionar a si mesmo." };
    }

    const { data: alvo } = await sb
      .from("profiles")
      .select("id, username")
      .eq("username_lower", username.toLowerCase())
      .maybeSingle();
    if (!alvo) return { ok: false, msg: "Esse usuário não existe." };

    const { error } = await sb
      .from("friends")
      .insert({ user_id: this._profile.id, friend_id: alvo.id });
    if (error) {
      if (error.code === "23505") return { ok: false, msg: "Vocês já são amigos." };
      return { ok: false, msg: "Erro ao adicionar amigo." };
    }
    return { ok: true, name: alvo.username };
  },

  async removeFriend(username) {
    await this.ready;
    if (!this._profile) return;
    const { data: alvo } = await sb
      .from("profiles")
      .select("id")
      .eq("username_lower", (username || "").trim().toLowerCase())
      .maybeSingle();
    if (!alvo) return;
    await sb.from("friends").delete()
      .eq("user_id", this._profile.id)
      .eq("friend_id", alvo.id);
  }
};

Auth.init();
