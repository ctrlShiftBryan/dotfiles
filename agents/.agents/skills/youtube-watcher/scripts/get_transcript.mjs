#!/usr/bin/env node
import { fetchTranscript } from "youtube-transcript-plus";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    format: { type: "string", default: "json" },
    lang: { type: "string", default: "en" },
  },
});

const url = positionals[0];
if (!url) {
  console.error("Usage: get_transcript.mjs <youtube-url> [--format json|text] [--lang en]");
  process.exit(1);
}

const decode = (s) => s.replace(/&#(\d+);/g, (_, c) => String.fromCharCode(c))
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

try {
  const transcript = await fetchTranscript(url, { lang: values.lang });
  const segments = transcript.map((s) => ({
    text: decode(s.text),
    start: s.offset,
    duration: s.duration,
  }));

  if (values.format === "text") {
    console.log(segments.map((s) => s.text).join("\n"));
  } else {
    console.log(JSON.stringify(segments, null, 2));
  }
} catch (e) {
  console.error(`Error fetching transcript: ${e.message}`);
  process.exit(1);
}
