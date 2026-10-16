const Auth = {
  KEY_USERS: "oldrblx_users",
  KEY_SESSION: "oldrblx_session",

  async hash(texto) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  },

  getUsers() {
    return JSON.parse(localStorage.getItem(this.KEY_USERS) || "{}");
  },

  async register(username, password) {
    username = username.trim();
    if (username.length < 3) return { ok: false, msg: "Usuário muito curto (mín. 3)." };
    if (password.length < 4) return { ok: false, msg: "Senha muito curta (mín. 4)." };
    const users = this.getUsers();
    if (users[username.toLowerCase()]) return { ok: false, msg: "Esse usuário já existe." };
    users[username.toLowerCase()] = { name: username, pass: await this.hash(password) };
    localStorage.setItem(this.KEY_USERS, JSON.stringify(users));
    localStorage.setItem(this.KEY_SESSION, username);
    return { ok: true };
  },

  async login(username, password) {
    const user = this.getUsers()[username.trim().toLowerCase()];
    if (!user || user.pass !== await this.hash(password)) {
      return { ok: false, msg: "Usuário ou senha incorretos." };
    }
    localStorage.setItem(this.KEY_SESSION, user.name);
    return { ok: true };
  },

  currentUser() {
    return localStorage.getItem(this.KEY_SESSION);
  },

  logout() {
    localStorage.removeItem(this.KEY_SESSION);
    location.href = "index.html";
  },

  // Sem conta/sessão -> manda pro index.html
  requireLogin(destino = "index.html") {
    if (!this.currentUser()) location.replace(destino);
  },

  // ---------- Amigos (por conta) ----------
  _friendsKey() {
    const me = this.currentUser();
    return me ? "oldrblx_friends_" + me.toLowerCase() : null;
  },

  // Lista de nomes dos amigos da conta logada
  getFriends() {
    const key = this._friendsKey();
    if (!key) return [];
    try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { return []; }
  },

  addFriend(username) {
    const key = this._friendsKey();
    if (!key) return { ok: false, msg: "Faça login primeiro." };
    username = (username || "").trim();
    if (!username) return { ok: false, msg: "Digite um usuário." };
    if (username.toLowerCase() === this.currentUser().toLowerCase()) {
      return { ok: false, msg: "Você não pode adicionar a si mesmo." };
    }
    const alvo = this.getUsers()[username.toLowerCase()];
    if (!alvo) return { ok: false, msg: "Esse usuário não existe." };
    const lista = this.getFriends();
    if (lista.some(n => n.toLowerCase() === alvo.name.toLowerCase())) {
      return { ok: false, msg: "Vocês já são amigos." };
    }
    lista.push(alvo.name);
    localStorage.setItem(key, JSON.stringify(lista));
    return { ok: true, name: alvo.name };
  },

  removeFriend(username) {
    const key = this._friendsKey();
    if (!key) return;
    const lista = this.getFriends().filter(n => n.toLowerCase() !== username.toLowerCase());
    localStorage.setItem(key, JSON.stringify(lista));
  }
};
