const readline = require("readline");
const { c, clearScreen, hideCursor, showCursor, print, symbols } = require("./ui");

function question(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(c(prompt, "brightCyan") + " ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function selectMenu(title, items, options = {}) {
  const { color = "brightCyan", showIndex = true } = options;
  const sym = symbols();

  return new Promise((resolve) => {
    let selected = 0;

    function render() {
      clearScreen();
      print("");
      print("  " + c(title, "brightWhite", "bold"));
      print("  " + c(sym.separator.repeat(40), "dim"));
      print("");

      items.forEach((item, idx) => {
        const isSelected = idx === selected;
        const prefix = isSelected
          ? c(`  ${sym.pointer} `, "brightGreen", "bold")
          : "    ";
        const label = isSelected
          ? c(item.label, "brightWhite", "bold")
          : c(item.label, "white");
        const desc = item.desc ? c(` — ${item.desc}`, "dim") : "";
        const indexStr = showIndex ? c(`${idx + 1}. `, "dim") : "";
        print(`${prefix}${indexStr}${label}${desc}`);
      });

      print("");
      print(
        "  " +
          c("↑/↓", "brightYellow") +
          c(" navigate  ", "dim") +
          c("Enter", "brightYellow") +
          c(" select  ", "dim") +
          c("q", "brightYellow") +
          c(" back", "dim")
      );
    }

    render();
    hideCursor();

    if (!process.stdin.isTTY) {
      showCursor();
      resolve(items[0]?.value ?? null);
      return;
    }

    const wasRaw = process.stdin.isRaw;
    process.stdin.setRawMode(true);
    process.stdin.resume();

    function onKey(key) {
      if (key[0] === 27 && key[1] === 91) {
        if (key[2] === 65) {
          selected = (selected - 1 + items.length) % items.length;
          render();
        } else if (key[2] === 66) {
          selected = (selected + 1) % items.length;
          render();
        }
      } else if (key[0] === 13) {
        cleanup();
        resolve(items[selected].value);
      } else if (key[0] === 113 || key[0] === 81) {
        cleanup();
        resolve("__back__");
      } else if (key[0] === 3) {
        cleanup();
        process.exit(0);
      }
    }

    function cleanup() {
      process.stdin.removeListener("data", onKey);
      process.stdin.setRawMode(wasRaw || false);
      process.stdin.pause();
      showCursor();
    }

    process.stdin.on("data", onKey);
  });
}

function confirm(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(
      c(prompt, "brightYellow") + c(" (y/n) ", "dim"),
      (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() === "y");
      }
    );
  });
}

function waitForKey(message = "Press any key to continue...") {
  return new Promise((resolve) => {
    print("  " + c(message, "dim"));

    if (!process.stdin.isTTY) {
      resolve();
      return;
    }

    const wasRaw = process.stdin.isRaw;
    process.stdin.setRawMode(true);
    process.stdin.resume();

    function onKey(key) {
      process.stdin.removeListener("data", onKey);
      process.stdin.setRawMode(wasRaw || false);
      process.stdin.pause();
      if (key[0] === 3) process.exit(0);
      resolve();
    }

    process.stdin.on("data", onKey);
  });
}

module.exports = { question, selectMenu, confirm, waitForKey };
