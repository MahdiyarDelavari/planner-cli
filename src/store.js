const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

function resolveDataDir() {
  const platform = os.platform();
  if (platform === "win32") {
    const appData =
      process.env.APPDATA ||
      path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, ".planner-cli", ".data", ".store");
  } else if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", ".planner-cli", ".data", ".store");
  } else {
    return path.join(os.homedir(), ".local", "share", ".planner-cli", ".data", ".store");
  }
}

const DATA_DIR = resolveDataDir();
const DATA_FILE = path.join(DATA_DIR, "notes.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function generateId() {
  return crypto.randomBytes(4).toString("hex");
}

function load() {
  ensureDir();
  if (!fs.existsSync(DATA_FILE)) {
    return { notes: [], categories: ["General", "Work", "Personal", "Ideas"] };
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { notes: [], categories: ["General", "Work", "Personal", "Ideas"] };
  }
}

function save(data) {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function addNote(title, body, category = "General", priority = "medium") {
  const data = load();
  const note = {
    id: generateId(),
    title,
    body,
    category,
    priority,
    done: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.notes.unshift(note);
  save(data);
  return note;
}

function getAllNotes() {
  return load().notes;
}

function getNoteById(id) {
  return load().notes.find((n) => n.id === id) || null;
}

function updateNote(id, updates) {
  const data = load();
  const idx = data.notes.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  data.notes[idx] = {
    ...data.notes[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  save(data);
  return data.notes[idx];
}

function deleteNote(id) {
  const data = load();
  const idx = data.notes.findIndex((n) => n.id === id);
  if (idx === -1) return false;
  data.notes.splice(idx, 1);
  save(data);
  return true;
}

function toggleDone(id) {
  const data = load();
  const note = data.notes.find((n) => n.id === id);
  if (!note) return null;
  note.done = !note.done;
  note.updatedAt = new Date().toISOString();
  save(data);
  return note;
}

function getCategories() {
  return load().categories;
}

function addCategory(name) {
  const data = load();
  if (!data.categories.includes(name)) {
    data.categories.push(name);
    save(data);
  }
  return data.categories;
}

function getStats() {
  const notes = getAllNotes();
  const total = notes.length;
  const done = notes.filter((n) => n.done).length;
  const pending = total - done;
  const byCategory = {};
  const byPriority = { high: 0, medium: 0, low: 0 };

  for (const note of notes) {
    byCategory[note.category] = (byCategory[note.category] || 0) + 1;
    if (byPriority[note.priority] !== undefined) {
      byPriority[note.priority]++;
    }
  }

  return { total, done, pending, byCategory, byPriority };
}

function searchNotes(query) {
  const lower = query.toLowerCase();
  return getAllNotes().filter(
    (n) =>
      n.title.toLowerCase().includes(lower) ||
      n.body.toLowerCase().includes(lower) ||
      n.category.toLowerCase().includes(lower)
  );
}

module.exports = {
  addNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
  toggleDone,
  getCategories,
  addCategory,
  getStats,
  searchNotes,
  DATA_DIR,
};
