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
  }
};
