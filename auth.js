const Auth = {
  KEY_USERS: "oldrblx_users",
  KEY_SESSION: "oldrblx_session",
  KEY_NEXT_ID: "oldrblx_next_id",

  async hash(texto) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  },

  // Lê as contas e, se alguma ainda não tem id (contas antigas), atribui em sequência
  getUsers() {
    const users = JSON.parse(localStorage.getItem(this.KEY_USERS) || "{}");
    let next = parseInt(localStorage.getItem(this.KEY_NEXT_ID) || "1", 10);
    let mudou = false;

    // garante que o contador nunca fique abaixo de um id já existente
    Object.values(users).forEach(u => {
      if (u.id && u.id >= next) { next = u.id + 1; mudou = true; }
    });
    // contas antigas sem id
    Object.values(users).forEach(u => {
      if (!u.id) { u.id = next++; mudou = true; }
    });

    if (mudou) {
      localStorage.setItem(this.KEY_USERS, JSON.stringify(users));
      localStorage.setItem(this.KEY_NEXT_ID, String(next));
    }
    return users;
  },

  async register(username, password) {
    username = username.trim();
    if (username.length < 3) return { ok: false, msg: "Usuário muito curto (mín. 3)." };
    if (password.length < 4) return { ok: false, msg: "Senha muito curta (mín. 4)." };
    const users = this.getUsers();
    if (users[username.toLowerCase()]) return { ok: false, msg: "Esse usuário já existe." };

    // gera o próximo id (primeira conta = 1)
    const id = parseInt(localStorage.getItem(this.KEY_NEXT_ID) || "1", 10);
    localStorage.setItem(this.KEY_NEXT_ID, String(id + 1));

    users[username.toLowerCase()] = { id: id, name: username, pass: await this.hash(password) };
    localStorage.setItem(this.KEY_USERS, JSON.stringify(users));
    localStorage.setItem(this.KEY_SESSION, username);
    return { ok: true, id: id };
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

  // Id da conta logada (ou de qualquer usuário pelo nome)
  getId(username) {
    const u = this.getUsers()[(username || "").trim().toLowerCase()];
    return u ? u.id : null;
  },

  currentId() {
    const me = this.currentUser();
    return me ? this.getId(me) : null;
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
