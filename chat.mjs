const BASE_URL = process.env.ANTHROPIC_BASE_URL || "https://api.moonshot.cn/anthropic";
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY");
  process.exit(1);
}

const url = `${BASE_URL}/v1/messages`;
const userText = process.argv.slice(2).join(" ") || "回复我一个字：OK";

const body = {
  model: "kimi-k2-thinking",
  max_tokens: 256,
  messages: [{ role: "user", content: userText }],
};

const resp = await fetch(url, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify(body),
});

const text = await resp.text();
if (!resp.ok) {
  console.error("HTTP", resp.status, resp.statusText);
  console.error(text);
  process.exit(2);
}

const data = JSON.parse(text);
const out = (data.content || [])
  .map(p => (p.type === "text" ? p.text : ""))
  .join("");
console.log(out || JSON.stringify(data, null, 2));
