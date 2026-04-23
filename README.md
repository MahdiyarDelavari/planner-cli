# planner-cli

A beautiful **CLI Planner & Notebook** with a rich terminal GUI — **zero dependencies**, built with pure Node.js.

## Features

- **Interactive menu** with arrow-key navigation
- **Rich terminal UI** — colored boxes, tables, progress bars, ASCII banner
- **Full CRUD** — add, view, edit, delete notes
- **Categories & Priorities** — organize notes with tags and urgency levels
- **Toggle Done/Pending** — track completion status
- **Search** — find notes by keyword
- **Export** — export data to TXT, CSV, JSON, and HTML
- **Statistics dashboard** — progress bars, category/priority breakdown
- **Persistent storage** — notes saved as JSON in `~/.planner-cli/`
- **Zero npm dependencies** — uses only Node.js built-in modules

## Quick Start

```bash
git clone https://github.com/MahdiyarDelavari/planner-cli.git
cd planner-cli
node src/app.js
```

## Controls

| Key        | Action           |
|------------|------------------|
| `↑` / `↓`  | Navigate menus   |
| `Enter`    | Select           |
| `q`        | Go back          |
| `Ctrl+C`   | Exit             |

## Project Structure

```
planner-cli/
├── package.json
├── README.md
└── src/
    ├── app.js      # Main app + all screens
    ├── ui.js       # Terminal UI library (colors, boxes, tables, banner)
    ├── input.js    # Interactive input (menus, prompts, key handling)
    ├── store.js    # Data layer (JSON file storage)
    └── export.js   # Export logic (TXT, CSV, JSON, HTML)
```

## Data Storage

Notes are stored in `~/.planner-cli/notes.json` and persist across sessions.
