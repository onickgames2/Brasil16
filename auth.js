// ===== CONFIG DO SUPABASE =====
const SUPABASE_URL = "https://upewvriimpcpktxwzxxo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7X00eY3rjYNkyK7hvfbskg_06exBASU";
// ==============================

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const Auth = {
  _profile: null, // { id (uuid), numeric_id, username }
  _ultimoErro: null,

  _email(username) {
    return username.trim().toLowerCase() + "@brasil16.app";
  },

  async _buscarPerfil(uid) {
    const { data, error } = await sb
      .from("profiles")
      .select("id, numeric_id, username")
      .eq("id", uid)
      .maybeSingle();
    if (error) console.error("Erro ao buscar perfil:", error);
    return data || null;
  },

  async _carregarPerfil(session) {
    if (!session) { this._profile = null; return; }
    const uid = session.user.id;
    let perfil = await this._buscarPerfil(uid);

    // fallback: perfil não existe -> cria a partir do nome salvo no cadastro
    if (!perfil) {
      const nome = (session.user.user_metadata || {}).username;
      if (nome) {
        const { error } = await sb.from("profiles").insert({ id: uid, username: nome });
        if (error) {
          console.error("Erro ao criar perfil:", error);
          this._ultimoErro = error.message;
        }
        perfil = await this._buscarPerfil(uid);
      }
    }
    this._profile = perfil;
  },

  ready: null,

  init() {
    this.ready = sb.auth.getSession().then(({ data }) => this._carregarPerfil(data.session));
    sb.auth.onAuthStateChange((evento) => {
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
    if (!this._profile) {
      return { ok: false, msg: "Perfil não gerado: " + (this._ultimoErro || "confira a tabela profiles") };
    }
    return { ok: true, id: this._profile.numeric_id };
  },

  async login(username, password) {
    const { data, error } = await sb.auth.signInWithPassword({
      email: this._email(username),
      password: password
    });
    if (error) return { ok: false, msg: "Usuário ou senha incorretos." };

    await this._carregarPerfil(data.session);
    if (!this._profile) {
      return { ok: false, msg: "Login ok, mas o perfil não existe: " + (this._ultimoErro || "veja o console (F12)") };
    }
    return { ok: true };
  },

  currentUser() { return this._profile ? this._profile.username : null; },
  currentId() { return this._profile ? this._profile.numeric_id : null; },

  async getId(username) {
    const { data } = await sb
      .from("profiles")
      .select("numeric_id")
      .eq("username_lower", (username || "").trim().toLowerCase())
      .maybeSingle();
    return data ? data.numeric_id : null;
  },

  async _perfilPorNome(username) {
    const { data } = await sb
      .from("profiles")
      .select("id, username")
      .eq("username_lower", (username || "").trim().toLowerCase())
      .maybeSingle();
    return data || null;
  },

  async logout() {
    try { await sb.auth.signOut(); } catch (e) { console.error(e); }
    this._profile = null;
    location.replace("index.html");
  },

  async requireLogin(destino = "index.html") {
    await this.ready;
    if (!this.currentUser()) location.replace(destino);
  },

  // ---------- Amigos ----------
  async getFriends() {
    await this.ready;
    if (!this._profile) return [];
    const { data, error } = await sb
      .from("friends")
      .select("friend:profiles!friends_friend_id_fkey(username)")
      .eq("user_id", this._profile.id);
    if (error) { console.error("Erro ao listar amigos:", error); return []; }
    return (data || []).map(r => r.friend.username);
  },

  // Envia um PEDIDO de amizade (a amizade só vale depois que a pessoa aceita)
  async sendFriendRequest(username) {
    await this.ready;
    if (!this._profile) return { ok: false, msg: "Faça login primeiro." };
    username = (username || "").trim();
    if (!username) return { ok: false, msg: "Digite um usuário." };
    if (username.toLowerCase() === this._profile.username.toLowerCase()) {
      return { ok: false, msg: "Você não pode adicionar a si mesmo." };
    }

    const alvo = await this._perfilPorNome(username);
    if (!alvo) return { ok: false, msg: "Esse usuário não existe." };
    const me = this._profile.id;

    const { data: jaAmigo } = await sb.from("friends").select("friend_id")
      .eq("user_id", me).eq("friend_id", alvo.id).maybeSingle();
    if (jaAmigo) return { ok: false, msg: "Vocês já são amigos." };

    const { data: pend } = await sb.from("friend_requests").select("id, from_id")
      .or("and(from_id.eq." + me + ",to_id.eq." + alvo.id + "),and(from_id.eq." + alvo.id + ",to_id.eq." + me + ")")
      .maybeSingle();
    if (pend) {
      return pend.from_id === me
        ? { ok: false, msg: "Você já enviou um pedido para " + alvo.username + "." }
        : { ok: false, msg: alvo.username + " já te enviou um pedido. Aceite em Pedidos de amizade." };
    }

    const { error } = await sb.from("friend_requests").insert({ from_id: me, to_id: alvo.id });
    if (error) {
      if (error.code === "23505") return { ok: false, msg: "Pedido já enviado." };
      console.error("Erro ao enviar pedido:", error);
      return { ok: false, msg: "Erro ao enviar pedido." };
    }
    return { ok: true, name: alvo.username };
  },

  // atalho antigo: agora sempre manda pedido
  async addFriend(username) { return this.sendFriendRequest(username); },

  async getIncomingRequests() {
    await this.ready;
    if (!this._profile) return [];
    const { data, error } = await sb.from("friend_requests")
      .select("id, from:profiles!friend_requests_from_id_fkey(username)")
      .eq("to_id", this._profile.id)
      .order("created_at", { ascending: false });
    if (error) { console.error("Erro ao listar pedidos:", error); return []; }
    return (data || []).map(r => ({ id: r.id, name: r.from.username }));
  },

  async getOutgoingRequests() {
    await this.ready;
    if (!this._profile) return [];
    const { data, error } = await sb.from("friend_requests")
      .select("id, to:profiles!friend_requests_to_id_fkey(username)")
      .eq("from_id", this._profile.id)
      .order("created_at", { ascending: false });
    if (error) { console.error("Erro ao listar enviados:", error); return []; }
    return (data || []).map(r => ({ id: r.id, name: r.to.username }));
  },

  async acceptRequest(id) {
    const { error } = await sb.rpc("accept_friend_request", { req_id: id });
    if (error) { console.error(error); return { ok: false, msg: "Erro ao aceitar." }; }
    return { ok: true };
  },

  // recusar (quem recebeu) ou cancelar (quem enviou)
  async declineRequest(id) {
    const { error } = await sb.from("friend_requests").delete().eq("id", id);
    if (error) { console.error(error); return { ok: false }; }
    return { ok: true };
  },

  async removeFriend(username) {
    await this.ready;
    if (!this._profile) return;
    const alvo = await this._perfilPorNome(username);
    if (!alvo) return;
    const { error } = await sb.rpc("remove_friend", { other: alvo.id });
    if (error) console.error(error);
  },

  // ---------- Feed (seus posts + dos seus amigos) ----------
  async getFeed() {
    await this.ready;
    if (!this._profile) return [];
    const { data, error } = await sb.from("posts")
      .select("id, content, created_at, user_id, author:profiles!posts_user_id_fkey(username)")
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) { console.error("Erro ao carregar feed:", error); return []; }
    return (data || []).map(p => ({
      id: p.id,
      text: p.content,
      date: p.created_at,
      author: p.author ? p.author.username : "?",
      mine: p.user_id === this._profile.id
    }));
  },

  async postFeed(texto) {
    await this.ready;
    if (!this._profile) return { ok: false, msg: "Faça login primeiro." };
    texto = (texto || "").trim();
    if (!texto) return { ok: false, msg: "Escreva alguma coisa." };
    if (texto.length > 254) return { ok: false, msg: "Máximo de 254 caracteres." };
    const { error } = await sb.from("posts").insert({ user_id: this._profile.id, content: texto });
    if (error) { console.error(error); return { ok: false, msg: "Erro ao publicar." }; }
    return { ok: true };
  },

  async deletePost(id) {
    const { error } = await sb.from("posts").delete().eq("id", id);
    if (error) console.error(error);
  }
};

Auth.init();
