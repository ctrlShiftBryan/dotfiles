#!/usr/bin/env node
/**
 * Excalidraw CLI — inspect, create, and export .excalidraw files
 *
 * All commands output JSON to stdout.
 *
 * Usage:
 *   node excalidraw-cli.mjs info <file>
 *   node excalidraw-cli.mjs elements <file>
 *   node excalidraw-cli.mjs search <file> <query>
 *   node excalidraw-cli.mjs create <output>
 *   node excalidraw-cli.mjs add <file> --type <type> [flags]
 *   node excalidraw-cli.mjs export <file> --format svg|png
 *   node excalidraw-cli.mjs open <file>
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

// ── helpers ──────────────────────────────────────────────────────────

function out(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
}

function die(msg) {
  out({ error: msg });
  process.exit(1);
}

function parseFlag(args, flag, defaultValue) {
  const idx = args.indexOf(flag);
  if (idx === -1) return defaultValue;
  const val = args[idx + 1];
  args.splice(idx, 2);
  return val;
}

function parseFlagInt(args, flag, defaultValue) {
  const val = parseFlag(args, flag, null);
  return val !== null ? parseInt(val, 10) : defaultValue;
}

function parseFlagFloat(args, flag, defaultValue) {
  const val = parseFlag(args, flag, null);
  return val !== null ? parseFloat(val) : defaultValue;
}

function generateId() {
  return crypto.randomBytes(10).toString("hex").slice(0, 20);
}

function readExcalidraw(filePath) {
  if (!fs.existsSync(filePath)) die(`File not found: ${filePath}`);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    die(`Invalid JSON in ${filePath}: ${e.message}`);
  }
}

function writeExcalidraw(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function baseElement(overrides = {}) {
  const now = Date.now();
  return {
    id: generateId(),
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    angle: 0,
    x: 0,
    y: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    width: 100,
    height: 100,
    seed: Math.floor(Math.random() * 2000000000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 2000000000),
    isDeleted: false,
    groupIds: [],
    frameId: null,
    boundElements: null,
    updated: now,
    link: null,
    locked: false,
    ...overrides,
  };
}

// ── commands ─────────────────────────────────────────────────────────

function cmdInfo(args) {
  const filePath = args[0];
  if (!filePath) die("Usage: info <file>");
  const data = readExcalidraw(filePath);
  const elements = data.elements || [];

  const typeCounts = {};
  const textLabels = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const el of elements) {
    if (el.isDeleted) continue;
    typeCounts[el.type] = (typeCounts[el.type] || 0) + 1;
    if (el.type === "text") textLabels.push(el.text || el.originalText || "");
    if (el.x < minX) minX = el.x;
    if (el.y < minY) minY = el.y;
    if (el.x + (el.width || 0) > maxX) maxX = el.x + (el.width || 0);
    if (el.y + (el.height || 0) > maxY) maxY = el.y + (el.height || 0);
  }

  const activeElements = elements.filter((e) => !e.isDeleted);

  out({
    file: filePath,
    elementCount: activeElements.length,
    typeCounts,
    textLabels,
    boundingBox:
      activeElements.length > 0
        ? { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
        : null,
    appState: data.appState
      ? {
          theme: data.appState.theme,
          viewBackgroundColor: data.appState.viewBackgroundColor,
          gridSize: data.appState.gridSize,
        }
      : null,
  });
}

function cmdElements(args) {
  const filePath = args[0];
  if (!filePath) die("Usage: elements <file>");
  const data = readExcalidraw(filePath);
  const elements = (data.elements || []).filter((e) => !e.isDeleted);

  const result = elements.map((el) => {
    const entry = {
      id: el.id,
      type: el.type,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
    };
    if (el.type === "text") {
      entry.text = el.text || el.originalText || "";
      entry.fontSize = el.fontSize;
      entry.containerId = el.containerId || null;
    }
    if (el.type === "arrow" || el.type === "line") {
      entry.points = el.points;
      if (el.startArrowhead) entry.startArrowhead = el.startArrowhead;
      if (el.endArrowhead) entry.endArrowhead = el.endArrowhead;
      if (el.startBinding) entry.startBinding = el.startBinding;
      if (el.endBinding) entry.endBinding = el.endBinding;
    }
    if (el.boundElements && el.boundElements.length > 0) {
      entry.boundElements = el.boundElements;
    }
    return entry;
  });

  out(result);
}

function cmdSearch(args) {
  const filePath = args[0];
  const query = args[1];
  if (!filePath || !query) die("Usage: search <file> <query>");
  const data = readExcalidraw(filePath);
  const lowerQuery = query.toLowerCase();

  const matches = (data.elements || [])
    .filter((el) => {
      if (el.isDeleted) return false;
      const text = (el.text || el.originalText || "").toLowerCase();
      return text.includes(lowerQuery);
    })
    .map((el) => ({
      id: el.id,
      type: el.type,
      text: el.text || el.originalText || "",
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
    }));

  out({ query, matchCount: matches.length, matches });
}

function cmdCreate(args) {
  const outputPath = args[0];
  if (!outputPath) die("Usage: create <output>");
  if (fs.existsSync(outputPath)) die(`File already exists: ${outputPath}`);

  const data = {
    type: "excalidraw",
    version: 2,
    source: "excalidraw-cli",
    elements: [],
    appState: {
      gridSize: null,
      viewBackgroundColor: "#ffffff",
    },
    files: {},
  };

  writeExcalidraw(outputPath, data);
  out({ status: "ok", file: outputPath });
}

function cmdAdd(args) {
  const filePath = args[0];
  if (!filePath) die("Usage: add <file> --type <type> [flags]");
  args.shift();

  const type = parseFlag(args, "--type", null);
  if (!type) die("--type is required. Supported: rect, text, ellipse, arrow, line, diamond");

  const x = parseFlagFloat(args, "--x", 0);
  const y = parseFlagFloat(args, "--y", 0);
  const width = parseFlagFloat(args, "--width", type === "text" ? null : 200);
  const height = parseFlagFloat(args, "--height", type === "text" ? null : 100);
  const color = parseFlag(args, "--color", "#1e1e1e");
  const bg = parseFlag(args, "--bg", "transparent");

  const data = readExcalidraw(filePath);
  const newElements = [];

  const shapeTypes = ["rect", "ellipse", "diamond"];
  const typeMap = { rect: "rectangle", ellipse: "ellipse", diamond: "diamond" };

  if (shapeTypes.includes(type)) {
    const label = parseFlag(args, "--label", null);
    const shapeId = generateId();

    const shape = baseElement({
      id: shapeId,
      type: typeMap[type],
      x,
      y,
      width,
      height,
      strokeColor: color,
      backgroundColor: bg,
    });

    if (label) {
      const textId = generateId();
      shape.boundElements = [{ id: textId, type: "text" }];

      const textEl = baseElement({
        id: textId,
        type: "text",
        x: x + 10,
        y: y + height / 2 - 12.5,
        width: width - 20,
        height: 25,
        text: label,
        originalText: label,
        autoResize: true,
        fontSize: 20,
        fontFamily: 5,
        textAlign: "center",
        verticalAlign: "middle",
        containerId: shapeId,
        strokeColor: color,
        backgroundColor: "transparent",
        lineHeight: 1.25,
        rawText: label,
      });

      newElements.push(shape, textEl);
      out({ status: "ok", shapeId, textId, type: typeMap[type], label });
    } else {
      newElements.push(shape);
      out({ status: "ok", id: shapeId, type: typeMap[type] });
    }
  } else if (type === "text") {
    const text = parseFlag(args, "--text", null);
    if (!text) die("--text is required for text elements");
    const fontSize = parseFlagInt(args, "--font-size", 20);

    const lines = text.split("\\n");
    const lineHeight = 1.25;
    const computedHeight = lines.length * fontSize * lineHeight;
    const computedWidth = Math.max(...lines.map((l) => l.length)) * fontSize * 0.6;

    const textEl = baseElement({
      type: "text",
      x,
      y,
      width: width || computedWidth,
      height: height || computedHeight,
      text,
      originalText: text,
      autoResize: true,
      fontSize,
      fontFamily: 5,
      textAlign: "left",
      verticalAlign: "top",
      containerId: null,
      strokeColor: color,
      backgroundColor: "transparent",
      lineHeight,
      rawText: text,
    });

    newElements.push(textEl);
    out({ status: "ok", id: textEl.id, type: "text", text });
  } else if (type === "arrow" || type === "line") {
    const pointsStr = parseFlag(args, "--points", "[[0,0],[200,0]]");
    const endArrow = parseFlag(args, "--end-arrow", type === "arrow" ? "arrow" : null);
    let points;
    try {
      points = JSON.parse(pointsStr);
    } catch {
      die(`Invalid --points JSON: ${pointsStr}`);
    }

    const el = baseElement({
      type,
      x,
      y,
      width: Math.abs(points[points.length - 1][0] - points[0][0]),
      height: Math.abs(points[points.length - 1][1] - points[0][1]),
      points,
      strokeColor: color,
      backgroundColor: bg,
      startArrowhead: null,
      endArrowhead: endArrow,
      startBinding: null,
      endBinding: null,
      lastCommittedPoint: null,
    });

    newElements.push(el);
    out({ status: "ok", id: el.id, type, points });
  } else {
    die(`Unsupported type: ${type}. Supported: rect, text, ellipse, arrow, line, diamond`);
  }

  data.elements.push(...newElements);
  writeExcalidraw(filePath, data);
}

function cmdExport(args) {
  const filePath = args[0];
  if (!filePath) die("Usage: export <file> --format svg|png");
  args.shift();

  const format = parseFlag(args, "--format", "svg");
  if (!["svg", "png"].includes(format)) die("--format must be svg or png");

  if (!fs.existsSync(filePath)) die(`File not found: ${filePath}`);

  const outDir = path.dirname(filePath);
  const baseName = path.basename(filePath).replace(/\.excalidraw(\.json)?$/, "");
  const outFile = path.join(outDir, `${baseName}.${format}`);

  try {
    execSync(
      `npx -y excalidraw-brute-export-cli -i "${filePath}" -o "${outDir}" -t ${format}`,
      { stdio: ["pipe", "pipe", "pipe"], timeout: 120_000 }
    );
    out({ status: "ok", file: outFile, format });
  } catch (e) {
    die(`Export failed: ${e.stderr?.toString() || e.message}`);
  }
}

async function cmdOpen(args) {
  const filePath = args[0];
  if (!filePath) die("Usage: open <file>");
  if (!fs.existsSync(filePath)) die(`File not found: ${filePath}`);

  const absPath = path.resolve(filePath);
  const open = (await import("open")).default;
  await open("https://excalidraw.com");
  out({
    status: "ok",
    message: `Opened excalidraw.com — drag and drop ${absPath} into the browser to load it.`,
  });
}

// ── main ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args.shift();

const commands = {
  info: cmdInfo,
  elements: cmdElements,
  search: cmdSearch,
  create: cmdCreate,
  add: cmdAdd,
  export: cmdExport,
  open: cmdOpen,
};

if (!command || !commands[command]) {
  die(
    `Unknown command: ${command || "(none)"}. Available: ${Object.keys(commands).join(", ")}`
  );
}

try {
  await commands[command](args);
} catch (e) {
  die(e.message);
}
