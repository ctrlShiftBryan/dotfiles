#!/usr/bin/env node
/**
 * YouTube Playlist Manager — Node.js port of yt_playlist.py
 *
 * All commands output JSON to stdout.
 *
 * Usage:
 *   node yt_playlist.mjs auth
 *   node yt_playlist.mjs create "Title" [--description "..."] [--privacy private|unlisted|public]
 *   node yt_playlist.mjs add <playlist_id> <video>
 *   node yt_playlist.mjs bulk-create "Title" <video1> [video2] ... [--description "..."] [--privacy unlisted]
 *   node yt_playlist.mjs list [--max 25]
 *   node yt_playlist.mjs remove <playlist_id> <video>
 *   node yt_playlist.mjs videos <playlist_id> [--max 50]
 *   node yt_playlist.mjs liked [--max 50]
 *   node yt_playlist.mjs subscriptions [--max 50]
 */

import { google } from "googleapis";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const SKILL_DIR = path.resolve(path.dirname(__filename), "..");
const CREDENTIALS_FILE = path.join(SKILL_DIR, "credentials.json");
const TOKEN_FILE = path.join(SKILL_DIR, "token.json");

const SCOPES = ["https://www.googleapis.com/auth/youtube"];

// ── helpers ──────────────────────────────────────────────────────────

function out(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
}

function die(msg) {
  out({ error: msg });
  process.exit(1);
}

function extractVideoId(input) {
  if (!input) return input;
  if (input.includes("youtube.com") || input.includes("youtu.be")) {
    if (input.includes("v=")) return input.split("v=")[1].split("&")[0];
    if (input.includes("youtu.be/"))
      return input.split("youtu.be/")[1].split("?")[0];
  }
  return input;
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

// ── auth ─────────────────────────────────────────────────────────────

function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    die(
      `credentials.json not found at ${CREDENTIALS_FILE}. Download OAuth credentials from Google Cloud Console.`
    );
  }
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf-8"));
  const { client_id, client_secret, redirect_uris } =
    creds.installed || creds.web || {};
  if (!client_id) die("Invalid credentials.json — missing client_id");
  return new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris?.[0] || "http://localhost:8080"
  );
}

function saveToken(oauth2Client) {
  const token = oauth2Client.credentials;
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(token, null, 2));
}

async function authenticate() {
  const oauth2Client = loadCredentials();

  // Try existing token
  if (fs.existsSync(TOKEN_FILE)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
    oauth2Client.setCredentials(token);

    // If token has refresh_token and is expired, refresh it
    if (token.refresh_token && token.expiry_date && token.expiry_date < Date.now()) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        saveToken(oauth2Client);
      } catch {
        // Refresh failed — fall through to browser flow
      }
    }

    // Verify token works
    if (oauth2Client.credentials.access_token) {
      try {
        const yt = google.youtube({ version: "v3", auth: oauth2Client });
        await yt.channels.list({ part: "id", mine: true });
        // Auto-save refreshed tokens
        oauth2Client.on("tokens", () => saveToken(oauth2Client));
        return oauth2Client;
      } catch {
        // Token invalid — fall through to browser flow
      }
    }
  }

  // Browser-based OAuth flow
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  // Open browser
  const open = (await import("open")).default;
  await open(authUrl);

  // Local server to receive callback
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, "http://localhost:8080");
      const authCode = url.searchParams.get("code");
      if (authCode) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Authentication successful!</h1><p>You can close this tab.</p>");
        server.close();
        resolve(authCode);
      } else {
        res.writeHead(400);
        res.end("Missing code parameter");
      }
    });
    server.listen(8080, () => {
      process.stderr.write("Waiting for OAuth callback on http://localhost:8080 ...\n");
    });
    server.on("error", (err) => reject(err));
    // Timeout after 2 minutes
    setTimeout(() => { server.close(); reject(new Error("Auth timeout")); }, 120_000);
  });

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  saveToken(oauth2Client);
  oauth2Client.on("tokens", () => saveToken(oauth2Client));
  return oauth2Client;
}

async function getYouTube() {
  const auth = await authenticate();
  return google.youtube({ version: "v3", auth });
}

// ── commands ─────────────────────────────────────────────────────────

async function cmdAuth() {
  await authenticate();
  out({ status: "ok", message: "Authenticated. Token saved." });
}

async function cmdCreate(args) {
  const title = args[0];
  if (!title) die("Usage: create <title> [--description ...] [--privacy ...]");
  const description = parseFlag(args, "--description", "");
  const privacy = parseFlag(args, "--privacy", "private");

  const yt = await getYouTube();
  const res = await yt.playlists.insert({
    part: "snippet,status",
    requestBody: {
      snippet: { title, description },
      status: { privacyStatus: privacy },
    },
  });
  const id = res.data.id;
  out({ id, title, url: `https://youtube.com/playlist?list=${id}` });
}

async function cmdAdd(args) {
  const [playlistId, rawVideo] = args;
  if (!playlistId || !rawVideo) die("Usage: add <playlist_id> <video>");
  const videoId = extractVideoId(rawVideo);

  const yt = await getYouTube();
  await yt.playlistItems.insert({
    part: "snippet",
    requestBody: {
      snippet: {
        playlistId,
        resourceId: { kind: "youtube#video", videoId },
      },
    },
  });
  out({ status: "ok", videoId, playlistId });
}

async function cmdBulkCreate(args) {
  // Parse flags before consuming positional args
  const description = parseFlag(args, "--description", "");
  const privacy = parseFlag(args, "--privacy", "unlisted");

  const title = args[0];
  const videos = args.slice(1);
  if (!title || videos.length === 0)
    die("Usage: bulk-create <title> <video1> [video2] ... [--description ...] [--privacy ...]");

  const yt = await getYouTube();

  // Create playlist
  const plRes = await yt.playlists.insert({
    part: "snippet,status",
    requestBody: {
      snippet: { title, description },
      status: { privacyStatus: privacy },
    },
  });
  const playlistId = plRes.data.id;

  const added = [];
  const failed = [];

  for (const raw of videos) {
    const videoId = extractVideoId(raw);
    try {
      await yt.playlistItems.insert({
        part: "snippet",
        requestBody: {
          snippet: {
            playlistId,
            resourceId: { kind: "youtube#video", videoId },
          },
        },
      });
      added.push(videoId);
    } catch (e) {
      failed.push({ videoId, error: e.message });
    }
  }

  out({
    playlistId,
    url: `https://youtube.com/playlist?list=${playlistId}`,
    added,
    failed,
  });
}

async function cmdList(args) {
  const maxResults = parseFlagInt(args, "--max", 25);
  const yt = await getYouTube();
  const res = await yt.playlists.list({
    part: "snippet,contentDetails",
    mine: true,
    maxResults,
  });
  const items = (res.data.items || []).map((item) => ({
    id: item.id,
    title: item.snippet.title,
    videoCount: item.contentDetails.itemCount,
    url: `https://youtube.com/playlist?list=${item.id}`,
  }));
  out(items);
}

async function cmdRemove(args) {
  const [playlistId, rawVideo] = args;
  if (!playlistId || !rawVideo) die("Usage: remove <playlist_id> <video>");
  const videoId = extractVideoId(rawVideo);

  const yt = await getYouTube();
  const res = await yt.playlistItems.list({
    part: "id,snippet",
    playlistId,
    maxResults: 50,
  });

  const item = (res.data.items || []).find(
    (i) => i.snippet.resourceId.videoId === videoId
  );
  if (!item) die(`Video ${videoId} not found in playlist ${playlistId}`);

  await yt.playlistItems.delete({ id: item.id });
  out({ status: "ok", videoId });
}

async function cmdVideos(args) {
  const playlistId = args[0];
  if (!playlistId) die("Usage: videos <playlist_id> [--max 50]");
  const maxResults = parseFlagInt(args, "--max", 50);

  const yt = await getYouTube();
  const res = await yt.playlistItems.list({
    part: "snippet",
    playlistId,
    maxResults,
  });

  const items = (res.data.items || []).map((item) => ({
    title: item.snippet.title,
    videoId: item.snippet.resourceId.videoId,
    channel: item.snippet.videoOwnerChannelTitle || "Unknown",
  }));
  out(items);
}

async function cmdLiked(args) {
  const maxResults = parseFlagInt(args, "--max", 50);
  const yt = await getYouTube();
  const res = await yt.videos.list({
    part: "snippet",
    myRating: "like",
    maxResults,
  });

  const items = (res.data.items || []).map((item) => ({
    title: item.snippet.title,
    videoId: item.id,
    channel: item.snippet.channelTitle,
  }));
  out(items);
}

async function cmdSubscriptions(args) {
  const maxResults = parseFlagInt(args, "--max", 50);
  const yt = await getYouTube();
  const res = await yt.subscriptions.list({
    part: "snippet",
    mine: true,
    maxResults,
  });

  const items = (res.data.items || []).map((item) => ({
    title: item.snippet.title,
    channelId: item.snippet.resourceId.channelId,
  }));
  out(items);
}

// ── main ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args.shift();

const commands = {
  auth: cmdAuth,
  create: cmdCreate,
  add: cmdAdd,
  "bulk-create": cmdBulkCreate,
  list: cmdList,
  remove: cmdRemove,
  videos: cmdVideos,
  liked: cmdLiked,
  subscriptions: cmdSubscriptions,
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
