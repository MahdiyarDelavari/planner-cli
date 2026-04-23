#!/usr/bin/env node

const {
  c,
  clearScreen,
  print,
  drawBox,
  drawTable,
  banner,
  progressBar,
  boxRound,
  boxLight,
  symbols,
  getTermWidth,
  hideCursor,
  showCursor,
} = require("./ui");

const store = require("./store");
const { exportTXT, exportCSV, exportJSON, exportHTML } = require("./export");
const { question, selectMenu, confirm, waitForKey } = require("./input");

const sym = symbols();

function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function priorityLabel(priority) {
  switch (priority) {
    case "high":
      return c("▲ HIGH", "brightRed", "bold");
    case "medium":
      return c("■ MED", "brightYellow");
    case "low":
      return c("▼ LOW", "brightGreen");
    default:
      return c(priority, "dim");
  }
}

function statusLabel(done) {
  return done
    ? c(`${sym.check} Done`, "brightGreen", "bold")
    : c(`${sym.undone} Pending`, "brightYellow");
}

async function showDashboard() {
  clearScreen();
  const stats = store.getStats();

  print("");
  print(banner("PLANNER"));
  print("");

  const welcomeLines = [
    c(`${sym.book}  Welcome to Planner CLI Notebook`, "brightWhite", "bold"),
    "",
    c(`${sym.bullet} Total Notes:   `, "white") + c(String(stats.total), "brightCyan", "bold"),
    c(`${sym.check} Completed:     `, "white") + c(String(stats.done), "brightGreen", "bold"),
    c(`${sym.clock} Pending:       `, "white") + c(String(stats.pending), "brightYellow", "bold"),
    "",
    c("  Progress: ", "white") + progressBar(stats.done, stats.total, 25),
  ];
  print(drawBox(welcomeLines, { title: "Dashboard", style: boxRound, color: "brightCyan", titleColor: "brightWhite" }));
  print("");

  if (stats.total > 0) {
    const catLines = Object.entries(stats.byCategory).map(
      ([cat, count]) => `  ${c(sym.tag, "brightMagenta")} ${c(cat, "white")}: ${c(String(count), "brightCyan", "bold")}`
    );
    const priLines = [
      `  ${priorityLabel("high")}: ${c(String(stats.byPriority.high), "bold")}`,
      `  ${priorityLabel("medium")}: ${c(String(stats.byPriority.medium), "bold")}`,
      `  ${priorityLabel("low")}: ${c(String(stats.byPriority.low), "bold")}`,
    ];
    const summaryLines = [...catLines, "", ...priLines];
    print(drawBox(summaryLines, { title: "Summary", style: boxRound, color: "brightMagenta", titleColor: "brightWhite" }));
    print("");
  }

  const recentNotes = store.getAllNotes().slice(0, 3);
  if (recentNotes.length > 0) {
    const headers = ["#", "Title", "Category", "Priority", "Status", "Date"];
    const rows = recentNotes.map((n, idx) => [
      c(String(idx + 1), "dim"),
      c(n.title.length > 25 ? n.title.slice(0, 22) + "..." : n.title, "brightWhite"),
      c(n.category, "brightCyan"),
      priorityLabel(n.priority),
      statusLabel(n.done),
      c(formatDate(n.createdAt), "dim"),
    ]);
    print(c("  Recent Notes:", "brightWhite", "bold"));
    print(drawTable(headers, rows, { color: "brightBlue", headerColor: "brightYellow" }));
    print("");
  }
}

async function addNoteScreen() {
  clearScreen();
  print("");
  print(
    drawBox(
      [c(`${sym.note}  Create a New Note`, "brightWhite", "bold")],
      { title: "New Note", style: boxRound, color: "brightGreen", titleColor: "brightWhite" }
    )
  );
  print("");

  const title = await question(`  ${sym.arrow} Title:`);
  if (!title) {
    print("  " + c("Cancelled — title is required.", "brightRed"));
    await waitForKey();
    return;
  }

  const body = await question(`  ${sym.arrow} Body/Description:`);

  const categories = store.getCategories();
  const catChoice = await selectMenu("  Select Category:", [
    ...categories.map((cat) => ({ label: cat, value: cat })),
    { label: "+ New Category", value: "__new__", desc: "Create a custom category" },
  ]);

  if (catChoice === "__back__") return;

  let category = catChoice;
  if (catChoice === "__new__") {
    category = await question(`  ${sym.arrow} Category name:`);
    if (category) store.addCategory(category);
    else category = "General";
  }

  const priority = await selectMenu("  Select Priority:", [
    { label: "▲ High", value: "high", desc: "Urgent & important" },
    { label: "■ Medium", value: "medium", desc: "Normal priority" },
    { label: "▼ Low", value: "low", desc: "Can wait" },
  ]);

  if (priority === "__back__") return;

  const note = store.addNote(title, body || "", category, priority);

  clearScreen();
  print("");
  print(
    drawBox(
      [
        c(`${sym.check} Note created successfully!`, "brightGreen", "bold"),
        "",
        `${c("ID:", "dim")}       ${c(note.id, "brightCyan")}`,
        `${c("Title:", "dim")}    ${c(note.title, "brightWhite")}`,
        `${c("Category:", "dim")} ${c(note.category, "brightMagenta")}`,
        `${c("Priority:", "dim")} ${priorityLabel(note.priority)}`,
      ],
      { title: "Success", style: boxRound, color: "brightGreen", titleColor: "brightWhite" }
    )
  );
  print("");
  await waitForKey();
}

async function listNotesScreen() {
  const notes = store.getAllNotes();

  clearScreen();
  print("");
  print(
    drawBox(
      [c(`${sym.book}  All Notes (${notes.length})`, "brightWhite", "bold")],
      { title: "Notebook", style: boxRound, color: "brightCyan", titleColor: "brightWhite" }
    )
  );
  print("");

  if (notes.length === 0) {
    print("  " + c("No notes yet. Create one from the main menu!", "dim"));
    print("");
    await waitForKey();
    return;
  }

  const headers = ["#", "ID", "Title", "Category", "Priority", "Status", "Created"];
  const rows = notes.map((n, idx) => [
    c(String(idx + 1), "dim"),
    c(n.id, "brightBlue"),
    c(n.title.length > 30 ? n.title.slice(0, 27) + "..." : n.title, "brightWhite"),
    c(n.category, "brightCyan"),
    priorityLabel(n.priority),
    statusLabel(n.done),
    c(formatDate(n.createdAt), "dim"),
  ]);

  print(drawTable(headers, rows, { color: "brightBlue", headerColor: "brightYellow" }));
  print("");
  await waitForKey();
}

async function viewNoteScreen() {
  const notes = store.getAllNotes();
  if (notes.length === 0) {
    clearScreen();
    print("  " + c("No notes to view.", "dim"));
    await waitForKey();
    return;
  }

  const choice = await selectMenu(
    `${sym.book} Select a Note to View:`,
    notes.map((n) => ({
      label: `[${n.id}] ${n.title}`,
      value: n.id,
      desc: `${n.category} | ${n.priority}`,
    }))
  );

  if (choice === "__back__") return;

  const note = store.getNoteById(choice);
  if (!note) return;

  clearScreen();
  print("");

  const lines = [
    c(note.title, "brightWhite", "bold"),
    "",
    `${c("ID:", "dim")}         ${c(note.id, "brightBlue")}`,
    `${c("Category:", "dim")}   ${c(note.category, "brightMagenta")}`,
    `${c("Priority:", "dim")}   ${priorityLabel(note.priority)}`,
    `${c("Status:", "dim")}     ${statusLabel(note.done)}`,
    `${c("Created:", "dim")}    ${c(formatDate(note.createdAt), "brightCyan")}`,
    `${c("Updated:", "dim")}    ${c(formatDate(note.updatedAt), "brightCyan")}`,
    "",
    c("─".repeat(40), "dim"),
    "",
    ...(note.body ? note.body.split("\n").map((l) => c(l, "white")) : [c("(no body)", "dim")]),
  ];

  print(drawBox(lines, { title: `Note: ${note.id}`, style: boxRound, color: "brightYellow", titleColor: "brightWhite" }));
  print("");
  await waitForKey();
}

async function editNoteScreen() {
  const notes = store.getAllNotes();
  if (notes.length === 0) {
    clearScreen();
    print("  " + c("No notes to edit.", "dim"));
    await waitForKey();
    return;
  }

  const choice = await selectMenu(
    `${sym.note} Select a Note to Edit:`,
    notes.map((n) => ({
      label: `[${n.id}] ${n.title}`,
      value: n.id,
      desc: `${n.category} | ${n.done ? "Done" : "Pending"}`,
    }))
  );

  if (choice === "__back__") return;

  const note = store.getNoteById(choice);
  if (!note) return;

  clearScreen();
  print("");
  print(
    drawBox(
      [c(`Editing: ${note.title}`, "brightWhite", "bold"), "", c("Leave blank to keep current value", "dim")],
      { title: "Edit Note", style: boxRound, color: "brightYellow", titleColor: "brightWhite" }
    )
  );
  print("");

  const newTitle = await question(`  ${sym.arrow} Title [${note.title}]:`);
  const newBody = await question(`  ${sym.arrow} Body [${note.body.slice(0, 40) || "(empty)"}]:`);

  const categories = store.getCategories();
  const catChoice = await selectMenu("  Select New Category:", [
    { label: `Keep: ${note.category}`, value: "__keep__" },
    ...categories.map((cat) => ({ label: cat, value: cat })),
  ]);
  if (catChoice === "__back__") return;

  const priChoice = await selectMenu("  Select New Priority:", [
    { label: `Keep: ${note.priority}`, value: "__keep__" },
    { label: "▲ High", value: "high" },
    { label: "■ Medium", value: "medium" },
    { label: "▼ Low", value: "low" },
  ]);
  if (priChoice === "__back__") return;

  const updates = {};
  if (newTitle) updates.title = newTitle;
  if (newBody) updates.body = newBody;
  if (catChoice !== "__keep__") updates.category = catChoice;
  if (priChoice !== "__keep__") updates.priority = priChoice;

  store.updateNote(note.id, updates);

  clearScreen();
  print("");
  print(
    drawBox(
      [c(`${sym.check} Note updated successfully!`, "brightGreen", "bold")],
      { title: "Updated", style: boxRound, color: "brightGreen", titleColor: "brightWhite" }
    )
  );
  print("");
  await waitForKey();
}

async function toggleNoteScreen() {
  const notes = store.getAllNotes();
  if (notes.length === 0) {
    clearScreen();
    print("  " + c("No notes to toggle.", "dim"));
    await waitForKey();
    return;
  }

  const choice = await selectMenu(
    `${sym.done} Toggle Note Status:`,
    notes.map((n) => ({
      label: `${n.done ? sym.check : sym.undone} [${n.id}] ${n.title}`,
      value: n.id,
      desc: n.done ? "Mark as pending" : "Mark as done",
    }))
  );

  if (choice === "__back__") return;

  const updated = store.toggleDone(choice);
  if (updated) {
    clearScreen();
    print("");
    const msg = updated.done
      ? c(`${sym.check} "${updated.title}" marked as DONE!`, "brightGreen", "bold")
      : c(`${sym.undone} "${updated.title}" marked as PENDING`, "brightYellow", "bold");
    print(drawBox([msg], { title: "Toggled", style: boxRound, color: "brightGreen", titleColor: "brightWhite" }));
    print("");
    await waitForKey();
  }
}

async function deleteNoteScreen() {
  const notes = store.getAllNotes();
  if (notes.length === 0) {
    clearScreen();
    print("  " + c("No notes to delete.", "dim"));
    await waitForKey();
    return;
  }

  const choice = await selectMenu(
    `${sym.cross} Select a Note to Delete:`,
    notes.map((n) => ({
      label: `[${n.id}] ${n.title}`,
      value: n.id,
      desc: n.category,
    }))
  );

  if (choice === "__back__") return;

  const note = store.getNoteById(choice);
  if (!note) return;

  const yes = await confirm(`  Delete "${note.title}" (${note.id})?`);
  if (yes) {
    store.deleteNote(choice);
    clearScreen();
    print("");
    print(
      drawBox(
        [c(`${sym.check} Note deleted.`, "brightRed", "bold")],
        { title: "Deleted", style: boxRound, color: "brightRed", titleColor: "brightWhite" }
      )
    );
    print("");
  } else {
    print("  " + c("Cancelled.", "dim"));
  }
  await waitForKey();
}

async function searchScreen() {
  clearScreen();
  print("");
  print(
    drawBox(
      [c(`${sym.pin}  Search Notes`, "brightWhite", "bold")],
      { title: "Search", style: boxRound, color: "brightMagenta", titleColor: "brightWhite" }
    )
  );
  print("");

  const query = await question(`  ${sym.arrow} Search:`);
  if (!query) return;

  const results = store.searchNotes(query);

  clearScreen();
  print("");

  if (results.length === 0) {
    print(
      drawBox(
        [c(`No notes matching "${query}"`, "brightYellow")],
        { title: "No Results", style: boxRound, color: "brightYellow", titleColor: "brightWhite" }
      )
    );
  } else {
    print(c(`  Found ${results.length} result(s) for "${query}":`, "brightGreen", "bold"));
    print("");
    const headers = ["#", "Title", "Category", "Priority", "Status"];
    const rows = results.map((n, idx) => [
      c(String(idx + 1), "dim"),
      c(n.title.length > 30 ? n.title.slice(0, 27) + "..." : n.title, "brightWhite"),
      c(n.category, "brightCyan"),
      priorityLabel(n.priority),
      statusLabel(n.done),
    ]);
    print(drawTable(headers, rows, { color: "brightMagenta", headerColor: "brightYellow" }));
  }

  print("");
  await waitForKey();
}

async function statsScreen() {
  clearScreen();
  const stats = store.getStats();

  print("");
  const lines = [
    c(`${sym.star}  Notebook Statistics`, "brightWhite", "bold"),
    "",
    `${c("Total Notes:", "white")}     ${c(String(stats.total), "brightCyan", "bold")}`,
    `${c("Completed:", "white")}       ${c(String(stats.done), "brightGreen", "bold")}`,
    `${c("Pending:", "white")}         ${c(String(stats.pending), "brightYellow", "bold")}`,
    "",
    c("  Completion: ", "white") + progressBar(stats.done, stats.total, 30),
    "",
    c("─── By Category ───", "dim"),
  ];

  for (const [cat, count] of Object.entries(stats.byCategory)) {
    lines.push(
      `  ${c(sym.tag, "brightMagenta")} ${c(cat, "white")}: ${c(String(count), "brightCyan", "bold")}  ${progressBar(count, stats.total, 15)}`
    );
  }

  lines.push("", c("─── By Priority ───", "dim"));
  lines.push(`  ${priorityLabel("high")}:   ${c(String(stats.byPriority.high), "bold")}  ${progressBar(stats.byPriority.high, stats.total, 15)}`);
  lines.push(`  ${priorityLabel("medium")}: ${c(String(stats.byPriority.medium), "bold")}  ${progressBar(stats.byPriority.medium, stats.total, 15)}`);
  lines.push(`  ${priorityLabel("low")}:    ${c(String(stats.byPriority.low), "bold")}  ${progressBar(stats.byPriority.low, stats.total, 15)}`);

  print(drawBox(lines, { title: "Statistics", style: boxRound, color: "brightCyan", titleColor: "brightWhite" }));
  print("");
  await waitForKey();
}

async function exportScreen() {
  const notes = store.getAllNotes();
  if (notes.length === 0) {
    clearScreen();
    print("");
    print(
      drawBox(
        [c("No notes to export.", "brightYellow")],
        { title: "Export", style: boxRound, color: "brightYellow", titleColor: "brightWhite" }
      )
    );
    print("");
    await waitForKey();
    return;
  }

  const format = await selectMenu(`${sym.star} Export Notebook`, [
    { label: "📄  TXT  — Plain Text", value: "txt", desc: "Human-readable text file" },
    { label: "📊  CSV  — Spreadsheet", value: "csv", desc: "Open in Excel / Google Sheets" },
    { label: "🌐  HTML — Web Page", value: "html", desc: "Beautiful styled report" },
    { label: "📦  JSON — Raw Data", value: "json", desc: "Machine-readable format" },
    { label: "📚  ALL  — Every Format", value: "all", desc: "Export all 4 formats at once" },
  ]);

  if (format === "__back__") return;

  clearScreen();
  print("");

  const exported = [];

  if (format === "txt" || format === "all") {
    exported.push({ format: "TXT", path: exportTXT(notes) });
  }
  if (format === "csv" || format === "all") {
    exported.push({ format: "CSV", path: exportCSV(notes) });
  }
  if (format === "html" || format === "all") {
    exported.push({ format: "HTML", path: exportHTML(notes) });
  }
  if (format === "json" || format === "all") {
    exported.push({ format: "JSON", path: exportJSON(notes) });
  }

  const lines = [
    c(`${sym.check}  Export Complete!`, "brightGreen", "bold"),
    "",
    c(`${notes.length} note(s) exported:`, "white"),
    "",
  ];

  for (const exp of exported) {
    lines.push(
      `  ${c(sym.arrow, "brightCyan")} ${c(exp.format, "brightYellow", "bold")}  ${c("→", "dim")}  ${c(exp.path, "brightWhite")}`
    );
  }

  print(
    drawBox(lines, { title: "Exported", style: boxRound, color: "brightGreen", titleColor: "brightWhite" })
  );
  print("");
  await waitForKey();
}

async function mainMenu() {
  while (true) {
    await showDashboard();

    const choice = await selectMenu(`${sym.book} Planner CLI — Main Menu`, [
      { label: `${sym.note}  Add Note`, value: "add", desc: "Create a new note" },
      { label: `${sym.book}  List Notes`, value: "list", desc: "View all notes" },
      { label: `${sym.pin}  View Note`, value: "view", desc: "Read a specific note" },
      { label: `${sym.star}  Edit Note`, value: "edit", desc: "Modify an existing note" },
      { label: `${sym.done}  Toggle Done`, value: "toggle", desc: "Mark done/pending" },
      { label: `${sym.cross}  Delete Note`, value: "delete", desc: "Remove a note" },
      { label: `${sym.fire}  Search`, value: "search", desc: "Find notes by keyword" },
      { label: `${sym.bullet}  Statistics`, value: "stats", desc: "View notebook stats" },
      { label: `${sym.star}  Export`, value: "export", desc: "Export as TXT/CSV/HTML/JSON" },
      { label: `${sym.arrow}  Exit`, value: "exit", desc: "Quit Planner CLI" },
    ]);

    switch (choice) {
      case "add":
        await addNoteScreen();
        break;
      case "list":
        await listNotesScreen();
        break;
      case "view":
        await viewNoteScreen();
        break;
      case "edit":
        await editNoteScreen();
        break;
      case "toggle":
        await toggleNoteScreen();
        break;
      case "delete":
        await deleteNoteScreen();
        break;
      case "search":
        await searchScreen();
        break;
      case "stats":
        await statsScreen();
        break;
      case "export":
        await exportScreen();
        break;
      case "exit":
      case "__back__":
        clearScreen();
        print("");
        print(
          drawBox(
            [
              c(`${sym.star}  Thanks for using Planner CLI!`, "brightCyan", "bold"),
              "",
              c("Your notes are saved at:", "dim"),
              c(store.DATA_DIR, "brightWhite"),
            ],
            { title: "Goodbye", style: boxRound, color: "brightMagenta", titleColor: "brightWhite" }
          )
        );
        print("");
        showCursor();
        process.exit(0);
    }
  }
}

process.on("exit", () => showCursor());
process.on("SIGINT", () => {
  showCursor();
  process.exit(0);
});

mainMenu().catch((err) => {
  showCursor();
  console.error(c("Error: " + err.message, "brightRed"));
  process.exit(1);
});
