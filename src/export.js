const fs = require("fs");
const path = require("path");

function getExportDir() {
  const dir = path.join(process.cwd(), "exports");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function timestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function exportTXT(notes) {
  const lines = [];
  lines.push("═".repeat(60));
  lines.push("  PLANNER CLI — NOTEBOOK EXPORT");
  lines.push("  Exported: " + formatDate(new Date().toISOString()));
  lines.push("  Total Notes: " + notes.length);
  lines.push("═".repeat(60));
  lines.push("");

  for (let idx = 0; idx < notes.length; idx++) {
    const note = notes[idx];
    lines.push("─".repeat(50));
    lines.push(`  #${idx + 1}  ${note.title}`);
    lines.push("─".repeat(50));
    lines.push(`  ID:        ${note.id}`);
    lines.push(`  Category:  ${note.category}`);
    lines.push(`  Priority:  ${note.priority.toUpperCase()}`);
    lines.push(`  Status:    ${note.done ? "DONE" : "PENDING"}`);
    lines.push(`  Created:   ${formatDate(note.createdAt)}`);
    lines.push(`  Updated:   ${formatDate(note.updatedAt)}`);
    lines.push("");
    if (note.body) {
      lines.push("  " + note.body.split("\n").join("\n  "));
    } else {
      lines.push("  (no body)");
    }
    lines.push("");
  }

  lines.push("═".repeat(60));
  lines.push("  End of Export");
  lines.push("═".repeat(60));

  const filePath = path.join(getExportDir(), `planner_${timestamp()}.txt`);
  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
  return filePath;
}

function escapeCSV(value) {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function exportCSV(notes) {
  const headers = ["ID", "Title", "Body", "Category", "Priority", "Status", "Created", "Updated"];
  const rows = [headers.join(",")];

  for (const note of notes) {
    rows.push(
      [
        escapeCSV(note.id),
        escapeCSV(note.title),
        escapeCSV(note.body),
        escapeCSV(note.category),
        escapeCSV(note.priority),
        escapeCSV(note.done ? "Done" : "Pending"),
        escapeCSV(formatDate(note.createdAt)),
        escapeCSV(formatDate(note.updatedAt)),
      ].join(",")
    );
  }

  const filePath = path.join(getExportDir(), `planner_${timestamp()}.csv`);
  fs.writeFileSync(filePath, rows.join("\n"), "utf-8");
  return filePath;
}

function exportJSON(notes) {
  const data = {
    exportedAt: new Date().toISOString(),
    totalNotes: notes.length,
    notes: notes,
  };

  const filePath = path.join(getExportDir(), `planner_${timestamp()}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  return filePath;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function exportHTML(notes) {
  const doneCount = notes.filter((n) => n.done).length;
  const pendingCount = notes.length - doneCount;
  const pct = notes.length > 0 ? Math.round((doneCount / notes.length) * 100) : 0;

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Planner CLI — Notebook Export</title>
  <style>
    :root {
      --bg: #0d1117;
      --card: #161b22;
      --border: #30363d;
      --text: #c9d1d9;
      --heading: #58a6ff;
      --accent: #1f6feb;
      --green: #3fb950;
      --yellow: #d29922;
      --red: #f85149;
      --purple: #bc8cff;
      --cyan: #39d2c0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 2rem;
    }
    .container { max-width: 960px; margin: 0 auto; }
    .header {
      text-align: center;
      padding: 2rem 0;
      border-bottom: 1px solid var(--border);
      margin-bottom: 2rem;
    }
    .header h1 {
      font-size: 2.2rem;
      background: linear-gradient(135deg, var(--cyan), var(--accent), var(--purple));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .header .subtitle { color: #8b949e; font-size: 0.95rem; }
    .stats-bar {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      margin: 1.5rem 0;
      flex-wrap: wrap;
    }
    .stat-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1rem 1.5rem;
      text-align: center;
      min-width: 120px;
    }
    .stat-card .number {
      font-size: 1.8rem;
      font-weight: 700;
    }
    .stat-card .label { color: #8b949e; font-size: 0.85rem; }
    .stat-card.total .number { color: var(--heading); }
    .stat-card.done .number { color: var(--green); }
    .stat-card.pending .number { color: var(--yellow); }
    .progress-wrap {
      margin: 1rem auto;
      max-width: 400px;
    }
    .progress-bar {
      height: 10px;
      background: var(--border);
      border-radius: 5px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 5px;
      background: linear-gradient(90deg, var(--green), var(--cyan));
      transition: width 0.3s;
    }
    .progress-label {
      text-align: center;
      margin-top: 0.3rem;
      font-size: 0.85rem;
      color: #8b949e;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0 2rem;
    }
    th {
      background: var(--card);
      color: var(--heading);
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid var(--accent);
      font-size: 0.9rem;
    }
    td {
      padding: 0.65rem 1rem;
      border-bottom: 1px solid var(--border);
      font-size: 0.9rem;
      vertical-align: top;
    }
    tr:hover td { background: rgba(56, 139, 253, 0.05); }
    .badge {
      display: inline-block;
      padding: 0.15rem 0.6rem;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
    }
    .badge-high { background: rgba(248,81,73,0.15); color: var(--red); }
    .badge-medium { background: rgba(210,153,34,0.15); color: var(--yellow); }
    .badge-low { background: rgba(63,185,80,0.15); color: var(--green); }
    .badge-done { background: rgba(63,185,80,0.15); color: var(--green); }
    .badge-pending { background: rgba(210,153,34,0.15); color: var(--yellow); }
    .badge-category { background: rgba(188,140,255,0.15); color: var(--purple); }
    .note-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      transition: border-color 0.2s;
    }
    .note-card:hover { border-color: var(--accent); }
    .note-card h3 { color: var(--heading); margin-bottom: 0.5rem; font-size: 1.1rem; }
    .note-meta {
      display: flex;
      gap: 0.8rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }
    .note-body {
      color: #8b949e;
      white-space: pre-wrap;
      line-height: 1.5;
      padding-top: 0.5rem;
      border-top: 1px solid var(--border);
    }
    .footer {
      text-align: center;
      padding: 2rem 0;
      color: #484f58;
      font-size: 0.85rem;
      border-top: 1px solid var(--border);
    }
    .view-toggle {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin: 1.5rem 0;
    }
    .view-btn {
      background: var(--card);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 0.4rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .view-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
    #card-view { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📓 Planner CLI Notebook</h1>
      <p class="subtitle">Exported on ${escapeHTML(formatDate(new Date().toISOString()))}</p>
    </div>

    <div class="stats-bar">
      <div class="stat-card total">
        <div class="number">${notes.length}</div>
        <div class="label">Total</div>
      </div>
      <div class="stat-card done">
        <div class="number">${doneCount}</div>
        <div class="label">Done</div>
      </div>
      <div class="stat-card pending">
        <div class="number">${pendingCount}</div>
        <div class="label">Pending</div>
      </div>
    </div>

    <div class="progress-wrap">
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="progress-label">${pct}% Complete</div>
    </div>

    <div class="view-toggle">
      <button class="view-btn active" onclick="showView('table')">📋 Table</button>
      <button class="view-btn" onclick="showView('card')">🃏 Cards</button>
    </div>

    <div id="table-view">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>`;

  notes.forEach((note, idx) => {
    html += `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${escapeHTML(note.title)}</strong></td>
            <td><span class="badge badge-category">${escapeHTML(note.category)}</span></td>
            <td><span class="badge badge-${note.priority}">${escapeHTML(note.priority.toUpperCase())}</span></td>
            <td><span class="badge badge-${note.done ? "done" : "pending"}">${note.done ? "✔ Done" : "○ Pending"}</span></td>
            <td>${escapeHTML(formatDate(note.createdAt))}</td>
          </tr>`;
  });

  html += `
        </tbody>
      </table>
    </div>

    <div id="card-view">`;

  notes.forEach((note, idx) => {
    html += `
      <div class="note-card">
        <h3>#${idx + 1} — ${escapeHTML(note.title)}</h3>
        <div class="note-meta">
          <span class="badge badge-category">${escapeHTML(note.category)}</span>
          <span class="badge badge-${note.priority}">${escapeHTML(note.priority.toUpperCase())}</span>
          <span class="badge badge-${note.done ? "done" : "pending"}">${note.done ? "✔ Done" : "○ Pending"}</span>
          <span style="color:#484f58;font-size:0.8rem">${escapeHTML(formatDate(note.createdAt))}</span>
        </div>
        ${note.body ? `<div class="note-body">${escapeHTML(note.body)}</div>` : ""}
      </div>`;
  });

  html += `
    </div>

    <div class="footer">
      Planner CLI — Generated with ❤️ using Node.js
    </div>
  </div>

  <script>
    function showView(view) {
      document.getElementById('table-view').style.display = view === 'table' ? 'block' : 'none';
      document.getElementById('card-view').style.display = view === 'card' ? 'block' : 'none';
      document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
    }
  </script>
</body>
</html>`;

  const filePath = path.join(getExportDir(), `planner_${timestamp()}.html`);
  fs.writeFileSync(filePath, html, "utf-8");
  return filePath;
}

module.exports = { exportTXT, exportCSV, exportJSON, exportHTML };
