// Local data layer — replaces the Base44 backend.
// All records are kept in the browser's localStorage, so the app runs as a
// static site (GitHub Pages) with no external server.

const PREFIX = "mabat:";
const USER_KEY = `${PREFIX}user`;

const ENTITY_NAMES = ["Project", "Regulation", "ReviewChecklist", "ReviewDecision", "Validation"];

const ENTITY_DEFAULTS = {
  Project: { status: "draft", review_round: 1 },
};

const DEFAULT_USER = { id: "local-user", full_name: "", email: "local@mabat", role: "admin" };

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const newId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`)
    .replace(/-/g, "")
    .slice(0, 24);

const sortRecords = (records, sort) => {
  if (!sort) return records;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return [...records].sort((a, b) => {
    const av = a[field] ?? "";
    const bv = b[field] ?? "";
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
};

const matches = (record, query) => Object.entries(query || {}).every(([k, v]) => record[k] === v);

function createEntity(name) {
  const key = `${PREFIX}entity:${name}`;
  const load = () => readJSON(key, []);
  const save = (records) => writeJSON(key, records);

  return {
    async list(sort, limit) {
      const records = sortRecords(load(), sort);
      return limit ? records.slice(0, limit) : records;
    },
    async filter(query, sort, limit) {
      const records = sortRecords(load().filter((r) => matches(r, query)), sort);
      return limit ? records.slice(0, limit) : records;
    },
    async get(id) {
      const record = load().find((r) => r.id === id);
      if (!record) throw new Error(`${name} ${id} not found`);
      return record;
    },
    async create(data) {
      const now = new Date().toISOString();
      const record = {
        ...(ENTITY_DEFAULTS[name] || {}),
        ...data,
        id: newId(),
        created_date: now,
        updated_date: now,
        created_by: auth.current().email,
      };
      save([...load(), record]);
      return record;
    },
    async update(id, data) {
      const records = load();
      const index = records.findIndex((r) => r.id === id);
      if (index === -1) throw new Error(`${name} ${id} not found`);
      records[index] = { ...records[index], ...data, id, updated_date: new Date().toISOString() };
      save(records);
      return records[index];
    },
    async delete(id) {
      save(load().filter((r) => r.id !== id));
    },
  };
}

const auth = {
  current: () => ({ ...DEFAULT_USER, ...readJSON(USER_KEY, {}) }),
  async me() {
    return auth.current();
  },
  async updateMe(data) {
    writeJSON(USER_KEY, { ...auth.current(), ...data });
    return auth.current();
  },
  async isAuthenticated() {
    return true;
  },
  logout() {},
  redirectToLogin() {},
};

// Full backup of all app data as a plain object, and restore from one.
const backup = {
  export() {
    const data = { version: 1, exported_at: new Date().toISOString(), user: auth.current(), entities: {} };
    ENTITY_NAMES.forEach((n) => (data.entities[n] = readJSON(`${PREFIX}entity:${n}`, [])));
    return data;
  },
  import(data) {
    if (!data || typeof data.entities !== "object") throw new Error("קובץ גיבוי לא תקין");
    ENTITY_NAMES.forEach((n) => writeJSON(`${PREFIX}entity:${n}`, data.entities[n] || []));
    if (data.user) writeJSON(USER_KEY, data.user);
  },
};

export const api = {
  entities: Object.fromEntries(ENTITY_NAMES.map((n) => [n, createEntity(n)])),
  auth,
  backup,
};
