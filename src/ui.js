const os = require("os");

const ESC = "\x1b[";

const colors = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  italic: `${ESC}3m`,
  underline: `${ESC}4m`,
  blink: `${ESC}5m`,
  inverse: `${ESC}7m`,
  strikethrough: `${ESC}9m`,

  black: `${ESC}30m`,
  red: `${ESC}31m`,
  green: `${ESC}32m`,
  yellow: `${ESC}33m`,
  blue: `${ESC}34m`,
  magenta: `${ESC}35m`,
  cyan: `${ESC}36m`,
  white: `${ESC}37m`,

  bgBlack: `${ESC}40m`,
  bgRed: `${ESC}41m`,
  bgGreen: `${ESC}42m`,
  bgYellow: `${ESC}43m`,
  bgBlue: `${ESC}44m`,
  bgMagenta: `${ESC}45m`,
  bgCyan: `${ESC}46m`,
  bgWhite: `${ESC}47m`,

  brightBlack: `${ESC}90m`,
  brightRed: `${ESC}91m`,
  brightGreen: `${ESC}92m`,
  brightYellow: `${ESC}93m`,
  brightBlue: `${ESC}94m`,
  brightMagenta: `${ESC}95m`,
  brightCyan: `${ESC}96m`,
  brightWhite: `${ESC}97m`,

  bgBrightBlack: `${ESC}100m`,
  bgBrightRed: `${ESC}101m`,
  bgBrightGreen: `${ESC}102m`,
  bgBrightYellow: `${ESC}103m`,
  bgBrightBlue: `${ESC}104m`,
  bgBrightMagenta: `${ESC}105m`,
  bgBrightCyan: `${ESC}106m`,
  bgBrightWhite: `${ESC}107m`,
};

function c(text, ...styles) {
  const prefix = styles.map((s) => colors[s] || "").join("");
  return `${prefix}${text}${colors.reset}`;
}

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

function visLen(str) {
  return stripAnsi(str).length;
}

function padEnd(str, len) {
  const diff = len - visLen(str);
  return diff > 0 ? str + " ".repeat(diff) : str;
}

function padCenter(str, len) {
  const diff = len - visLen(str);
  if (diff <= 0) return str;
  const left = Math.floor(diff / 2);
  const right = diff - left;
  return " ".repeat(left) + str + " ".repeat(right);
}

const box = {
  topLeft: "╔",
  topRight: "╗",
  bottomLeft: "╚",
  bottomRight: "╝",
  horizontal: "═",
  vertical: "║",
  teeLeft: "╠",
  teeRight: "╣",
  teeDown: "╦",
  teeUp: "╩",
  cross: "╬",
};

const boxLight = {
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
  teeLeft: "├",
  teeRight: "┤",
  teeDown: "┬",
  teeUp: "┴",
  cross: "┼",
};

const boxRound = {
  topLeft: "╭",
  topRight: "╮",
  bottomLeft: "╰",
  bottomRight: "╯",
  horizontal: "─",
  vertical: "│",
  teeLeft: "├",
  teeRight: "┤",
  teeDown: "┬",
  teeUp: "┴",
  cross: "┼",
};

function getTermWidth() {
  try {
    return process.stdout.columns || 80;
  } catch {
    return 80;
  }
}

function drawBox(lines, options = {}) {
  const {
    title = "",
    style = box,
    color = "cyan",
    titleColor = "brightCyan",
    padding = 1,
    maxWidth = 0,
    center = false,
  } = options;

  const termW = getTermWidth();
  const contentMaxW =
    maxWidth > 0 ? maxWidth - 4 - padding * 2 : termW - 4 - padding * 2;

  const wrapped = [];
  for (const line of lines) {
    const raw = stripAnsi(line);
    if (raw.length <= contentMaxW) {
      wrapped.push(line);
    } else {
      let remaining = line;
      while (visLen(remaining) > contentMaxW) {
        wrapped.push(remaining.substring(0, contentMaxW));
        remaining = remaining.substring(contentMaxW);
      }
      if (remaining) wrapped.push(remaining);
    }
  }

  const maxContentLen = Math.max(
    ...wrapped.map((l) => visLen(l)),
    visLen(stripAnsi(title)) + 2
  );
  const innerW = maxContentLen + padding * 2;

  const pad = " ".repeat(padding);
  const result = [];

  let topBar = style.horizontal.repeat(innerW);
  if (title) {
    const tText = ` ${c(title, titleColor, "bold")} `;
    const tRawLen = visLen(tText);
    const pos = 2;
    topBar =
      style.horizontal.repeat(pos) +
      tText +
      style.horizontal.repeat(Math.max(0, innerW - pos - tRawLen));
  }

  result.push(c(style.topLeft + topBar + style.topRight, color));

  for (const line of wrapped) {
    const padded = padEnd(line, maxContentLen);
    result.push(
      c(style.vertical, color) +
        pad +
        padded +
        pad +
        c(style.vertical, color)
    );
  }

  result.push(
    c(
      style.bottomLeft + style.horizontal.repeat(innerW) + style.bottomRight,
      color
    )
  );

  if (center) {
    const boxW = innerW + 2;
    const leftPad = Math.max(0, Math.floor((termW - boxW) / 2));
    return result.map((l) => " ".repeat(leftPad) + l);
  }

  return result;
}

function drawTable(headers, rows, options = {}) {
  const { color = "cyan", headerColor = "brightYellow", style = boxLight } = options;

  const colCount = headers.length;
  const colWidths = headers.map((h) => visLen(h));

  for (const row of rows) {
    for (let idx = 0; idx < colCount; idx++) {
      const cellLen = visLen(String(row[idx] || ""));
      if (cellLen > colWidths[idx]) colWidths[idx] = cellLen;
    }
  }

  const pad = 1;
  const result = [];

  const topLine =
    c(style.topLeft, color) +
    colWidths
      .map((w) => c(style.horizontal.repeat(w + pad * 2), color))
      .join(c(style.teeDown, color)) +
    c(style.topRight, color);
  result.push(topLine);

  const headerLine =
    c(style.vertical, color) +
    headers
      .map((h, idx) => {
        const content = c(padCenter(h, colWidths[idx]), headerColor, "bold");
        return " ".repeat(pad) + content + " ".repeat(pad);
      })
      .join(c(style.vertical, color)) +
    c(style.vertical, color);
  result.push(headerLine);

  const sepLine =
    c(style.teeLeft, color) +
    colWidths
      .map((w) => c(style.horizontal.repeat(w + pad * 2), color))
      .join(c(style.cross, color)) +
    c(style.teeRight, color);
  result.push(sepLine);

  for (const row of rows) {
    const rowLine =
      c(style.vertical, color) +
      row
        .map((cell, idx) => {
          const content = padEnd(String(cell || ""), colWidths[idx]);
          return " ".repeat(pad) + content + " ".repeat(pad);
        })
        .join(c(style.vertical, color)) +
      c(style.vertical, color);
    result.push(rowLine);
  }

  const bottomLine =
    c(style.bottomLeft, color) +
    colWidths
      .map((w) => c(style.horizontal.repeat(w + pad * 2), color))
      .join(c(style.teeUp, color)) +
    c(style.bottomRight, color);
  result.push(bottomLine);

  return result;
}

function banner(text) {
  const letters = {
    P: ["████╗ ", "██╔═╝ ", "████╗ ", "██╔═╝ ", "██║   ", "╚═╝   "],
    L: ["██╗   ", "██║   ", "██║   ", "██║   ", "████╗ ", "╚═══╝ "],
    A: [" ██╗  ", "████╗ ", "██╔█╗ ", "████║ ", "██╔██╗", "╚═╝══╝"],
    N: ["██╗ ██╗", "███╗██║", "█╔███║ ", "█║╚██║ ", "█║ ██║ ", "╚╝ ╚═╝ "],
    E: ["████╗", "██╔═╝", "███╗ ", "██╔═╝", "████╗", "╚═══╝"],
    R: ["████╗ ", "██╔═██╗", "████╔╝ ", "██╔═██╗", "██║ ██║", "╚═╝ ╚═╝"],
  };

  const gradient = ["brightCyan", "cyan", "brightBlue", "blue", "brightMagenta", "magenta"];
  const lines = [];

  for (let row = 0; row < 6; row++) {
    let line = "";
    for (const ch of text.toUpperCase()) {
      if (letters[ch]) {
        line += c(letters[ch][row] || "      ", gradient[row]) + " ";
      } else {
        line += "   ";
      }
    }
    lines.push(line);
  }
  return lines;
}

function progressBar(value, max, width = 30) {
  const ratio = Math.min(value / Math.max(max, 1), 1);
  const filled = Math.round(ratio * width);
  const empty = width - filled;

  const filledColor = ratio === 1 ? "brightGreen" : ratio >= 0.5 ? "brightYellow" : "brightRed";

  return (
    c("▐", "dim") +
    c("█".repeat(filled), filledColor) +
    c("░".repeat(empty), "dim") +
    c("▌", "dim") +
    ` ${c(Math.round(ratio * 100) + "%", "bold", filledColor)}`
  );
}

function clearScreen() {
  process.stdout.write("\x1b[2J\x1b[H");
}

function hideCursor() {
  process.stdout.write("\x1b[?25l");
}

function showCursor() {
  process.stdout.write("\x1b[?25h");
}

function print(...lines) {
  for (const line of lines.flat()) {
    process.stdout.write(line + "\n");
  }
}

function symbols() {
  const isWin = os.platform() === "win32";
  return {
    check: isWin ? "√" : "✔",
    cross: isWin ? "×" : "✖",
    bullet: isWin ? "*" : "●",
    star: isWin ? "*" : "★",
    arrow: isWin ? ">" : "❯",
    note: isWin ? "♪" : "📝",
    book: isWin ? "#" : "📓",
    pin: isWin ? "!" : "📌",
    clock: isWin ? "@" : "🕐",
    tag: isWin ? "#" : "🏷",
    fire: isWin ? "!" : "🔥",
    done: isWin ? "[x]" : "☑",
    undone: isWin ? "[ ]" : "☐",
    separator: isWin ? "-" : "─",
    pointer: isWin ? ">" : "❯",
  };
}

module.exports = {
  c,
  colors,
  stripAnsi,
  visLen,
  padEnd,
  padCenter,
  box,
  boxLight,
  boxRound,
  getTermWidth,
  drawBox,
  drawTable,
  banner,
  progressBar,
  clearScreen,
  hideCursor,
  showCursor,
  print,
  symbols,
};
